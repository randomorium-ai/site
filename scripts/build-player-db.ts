#!/usr/bin/env tsx
// scripts/build-player-db.ts
//
// Builds src/data/players.json from Wikipedia data.
//
// Algorithm:
//   Phase 1 — Discovery
//     Fetch all pages tagged hastemplate:"Infobox football biography" (213k+)
//     via parallel CirrusSearch with pre-calculated gsroffset values.
//     Each batch also fetches 60-day pageview proxies (pvipdays=60).
//     Keep pages with ≥100 views in 60 days (~5-10k candidates).
//
//   Phase 2 — Enrichment
//     For each candidate, in parallel (batches of 50):
//       a) Fetch 10-year pageview total (2016–2025) via per-article API
//       b) Fetch wikitext and parse the Infobox football biography
//     Apply minimum 10k 10-year views threshold.
//
//   Output — Sort by popularity_score desc, write players.json.
//
// Usage:
//   npx tsx scripts/build-player-db.ts                          # full rebuild
//   npx tsx scripts/build-player-db.ts --incremental            # add next 50 players
//   npx tsx scripts/build-player-db.ts --incremental --batch-size 200
//   npx tsx scripts/build-player-db.ts --incremental --month 2019-06
//   npx tsx scripts/build-player-db.ts --incremental --fill-months
// Estimated runtime (full): ~10 minutes

import fs from "fs"
import path from "path"
import type { Player, CareerClub } from "../src/lib/player"
import {
  slugify,
  normalise,
  ADJECTIVE_TO_COUNTRY,
  COUNTRY_TO_CONFEDERATION,
} from "../src/lib/player"

// ── Config ────────────────────────────────────────────────────────────────────

const WIKI_SEARCH_BASE = "https://en.wikipedia.org/w/api.php"
// Correct project identifier: en.wikipedia.org (not en.wikipedia)
const WIKI_VIEWS_BASE = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/user"
const OUTPUT_PATH = path.join(process.cwd(), "src", "data", "players.json")

const SEARCH_BATCH = 500              // Max per CirrusSearch call
const VIEWS_60_DAY_MIN = 100          // Lowered threshold — catch more players
const VIEWS_10YR_MIN = 10_000         // 10yr minimum (lowered to catch semi-obscure)
const ENRICH_CONCURRENCY = 20         // Parallel enrichment requests (lower = fewer rate-limit failures)
const MAX_RETRIES = 3
const PROGRESS_PATH = path.join(process.cwd(), "scripts", "build-progress.json")
const CHECKPOINT_INTERVAL = 10        // Write players.json every N new players

// Hardcoded supplemental titles to always include regardless of view threshold.
// Covers test players and historically important figures.
const SUPPLEMENTAL_TITLES = new Set([
  // Test players — must always be present
  "Harry_Kane",
  "Lionel_Messi",
  "Cristiano_Ronaldo",
  "Erling_Haaland",
  "Kylian_Mbappé",
  "Luka_Modrić",
  "Vinícius_Júnior",
  "İlkay_Gündoğan",
  "Bukayo_Saka",
  "Jude_Bellingham",
  "Florian_Wirtz",
  "Lamine_Yamal",
  "Reece_James",
  "Ché_Adams",
  "Daniel_James_(footballer)",
  "Maxwel_Cornet",
  "Josh_Maja",
  "Ronaldo_(Brazilian_footballer)",
  "Emile_Heskey",
  "Jonjo_Shelvey",
  "Patrick_Vieira",
  "Ruud_van_Nistelrooy",
  "Michael_Owen",
  // Extra important players
  "Pedri",
  "Gavi_(footballer)",
  "Phil_Foden",
  "Declan_Rice",
  "Trent_Alexander-Arnold",
  "Marcus_Rashford",
  "Jadon_Sancho",
  "Mason_Mount",
  "Ben_White_(footballer)",
  "John_Stones",
  "Kyle_Walker",
  "Aaron_Ramsdale",
  "Jordan_Pickford",
  "Jack_Grealish",
  "James_Maddison",
  "Ollie_Watkins",
  "Ivan_Toney",
  "Emile_Smith_Rowe",
  "Conor_Gallagher",
  "Roberto_Firmino",
  "Sadio_Mané",
  "Mohamed_Salah",
  "Virgil_van_Dijk",
  "Kevin_De_Bruyne",
  "Raheem_Sterling",
  "Robert_Lewandowski",
  "Romelu_Lukaku",
  "Eden_Hazard",
  "Gareth_Bale",
  "Zlatan_Ibrahimović",
  "Wayne_Rooney",
  "Steven_Gerrard",
  "Frank_Lampard",
  "Thierry_Henry",
  "David_Beckham",
  "Zinedine_Zidane",
  "Ronaldinho",
  "Kaka",
  "Andrés_Iniesta",
  "Xavi",
  "Neymar",
  "Antoine_Griezmann",
  "Paul_Pogba",
  "N'Golo_Kanté",
  "Karim_Benzema",
  "Didier_Drogba",
  "Samuel_Eto'o",
  "Rio_Ferdinand",
  "John_Terry",
  "Ashley_Cole",
  "Sol_Campbell",
])

// Nationality overrides for players whose Wikipedia infobox/intro can't be
// auto-parsed (e.g. born in one country but represents another).
const TITLE_NATIONALITY_OVERRIDE: Record<string, string> = {
  "Josh_Maja":                      "Nigeria",  // Born in England, plays for Nigeria; infobox ambiguous
  "Ronaldo_(Brazilian_footballer)": "Brazil",   // parseNationality picks up Portuguese from article cross-refs
}

// ── Build progress tracking ───────────────────────────────────────────────────

interface BuildProgress {
  months_processed: string[]   // "2016-03" etc. — months fully scanned for new players
  months_remaining: string[]   // months not yet scanned
  players_queued: string[]     // Wikipedia titles discovered but not yet enriched
  players_fetched: string[]    // player IDs already in players.json
  last_run: string             // ISO timestamp of last incremental run
  total_players: number
}

function allMonths(): string[] {
  const months: string[] = []
  for (let year = 2016; year <= 2026; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === 2016 && month < 3) continue
      if (year === 2026 && month > 3) break
      months.push(`${year}-${String(month).padStart(2, "0")}`)
    }
  }
  return months
}

function loadProgress(): BuildProgress {
  try {
    if (fs.existsSync(PROGRESS_PATH)) {
      return JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf-8"))
    }
  } catch { /* fall through */ }
  return {
    months_processed: [],
    months_remaining: allMonths(),
    players_queued: [],
    players_fetched: [],
    last_run: "",
    total_players: 0,
  }
}

function saveProgress(progress: BuildProgress): void {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2))
}

function loadExistingPlayers(): Player[] {
  try {
    if (fs.existsSync(OUTPUT_PATH)) {
      return JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"))
    }
  } catch { /* fall through */ }
  return []
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "randomorium-player-db-builder/1.0 (https://randomorium.ai)" },
      })
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          await sleep(1000 * (attempt + 1))
          continue
        }
        throw new Error(`HTTP ${res.status}: ${url}`)
      }
      return (await res.json()) as T
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(500 * (attempt + 1))
    }
  }
  throw new Error(`Failed after ${retries} retries: ${url}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Phase 1: Discovery ────────────────────────────────────────────────────────

async function discoverFootballBios(): Promise<Map<string, number>> {
  // First call: get total hit count
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: 'hastemplate:"Infobox football biography"',
    gsrnamespace: "0",
    gsrlimit: "1",
    prop: "info",
    formatversion: "2",
  })

  interface SearchInfoResponse {
    query?: { searchinfo?: { totalhits: number } }
  }

  const first = await fetchJson<SearchInfoResponse>(`${WIKI_SEARCH_BASE}?${params}`)
  const total = first.query?.searchinfo?.totalhits ?? 213_191
  console.log(`Total football biography pages: ${total}`)

  // Pre-calculate all offsets and fetch in parallel chunks
  const offsets = Array.from({ length: Math.ceil(total / SEARCH_BATCH) }, (_, i) => i * SEARCH_BATCH)
  console.log(`Fetching ${offsets.length} batches of ${SEARCH_BATCH} pages...`)

  const candidates = new Map<string, number>() // title → 60-day views

  // Process in chunks of 50 parallel requests
  const PARALLEL_CHUNK = 50
  for (let i = 0; i < offsets.length; i += PARALLEL_CHUNK) {
    const chunk = offsets.slice(i, i + PARALLEL_CHUNK)
    const results = await Promise.allSettled(
      chunk.map((offset) => fetchSearchBatch(offset))
    )
    for (const result of results) {
      if (result.status !== "fulfilled") continue
      for (const [title, views] of result.value) {
        if (views >= VIEWS_60_DAY_MIN || SUPPLEMENTAL_TITLES.has(title)) {
          candidates.set(title, views)
        }
      }
    }
    const processed = Math.min(i + PARALLEL_CHUNK, offsets.length)
    if (processed % 100 === 0 || processed === offsets.length) {
      console.log(`  Batch ${processed}/${offsets.length} — ${candidates.size} candidates`)
    }
  }

  // Ensure supplementals are always included
  for (const title of SUPPLEMENTAL_TITLES) {
    if (!candidates.has(title)) {
      candidates.set(title, 0)
    }
  }

  console.log(`Phase 1 complete: ${candidates.size} candidates`)
  return candidates
}

async function fetchSearchBatch(offset: number): Promise<Map<string, number>> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: 'hastemplate:"Infobox football biography"',
    gsrnamespace: "0",
    gsrlimit: String(SEARCH_BATCH),
    gsroffset: String(offset),
    prop: "pageviews",
    pvipdays: "60",
    formatversion: "2",
  })

  interface BatchResponse {
    query?: { pages?: Array<{ title: string; pageviews?: Record<string, number | null> }> }
  }

  const data = await fetchJson<BatchResponse>(`${WIKI_SEARCH_BASE}?${params}`)
  const pages = data.query?.pages ?? []
  const result = new Map<string, number>()

  for (const page of pages) {
    if (!page.title) continue
    // Skip list/disambiguation pages
    if (page.title.startsWith("List of") || page.title.startsWith("Wikipedia:")) continue
    const views60 = page.pageviews
      ? Object.values(page.pageviews).reduce<number>((s, v) => s + (v ?? 0), 0)
      : 0
    result.set(page.title, views60)
  }

  return result
}

// ── Monthly pageview discovery ────────────────────────────────────────────────
// Fetches top Wikipedia articles for a given month (YYYY-MM) and returns
// titles of pages that might be footballers (high-view pages to check).

async function discoverFromMonth(yearMonth: string): Promise<string[]> {
  const [year, month] = yearMonth.split("-")
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia.org/all-access/${year}/${month}/all-days`

  interface TopPagesResponse {
    items?: [{ articles?: Array<{ article: string; views: number }> }]
  }

  try {
    const data = await fetchJson<TopPagesResponse>(url)
    const articles = data.items?.[0]?.articles ?? []
    // Return titles of pages with at least 5,000 views in that month
    // enrichOne() will filter out non-footballers naturally
    return articles
      .filter((a) => a.views >= 5_000)
      .map((a) => a.article.replace(/ /g, "_"))
      .filter((t) => !t.startsWith("Wikipedia:") && !t.startsWith("Special:") && !t.startsWith("Portal:"))
  } catch {
    return []
  }
}

// ── Phase 2: Enrichment ────────────────────────────────────────────────────────

async function enrichCandidates(candidates: Map<string, number>): Promise<Player[]> {
  const titles = Array.from(candidates.keys())
  console.log(`Phase 2: Enriching ${titles.length} candidates...`)

  const results: Player[] = []
  let processed = 0
  let skipped = 0

  for (let i = 0; i < titles.length; i += ENRICH_CONCURRENCY) {
    const batch = titles.slice(i, i + ENRICH_CONCURRENCY)
    const settled = await Promise.allSettled(batch.map((t) => enrichOne(t)))

    for (const result of settled) {
      processed++
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value)
      } else {
        skipped++
      }
    }

    if (processed % 200 === 0 || processed === titles.length) {
      console.log(`  ${processed}/${titles.length} — ${results.length} valid, ${skipped} skipped`)
    }
    // Small pause between batches to avoid API rate limits
    if (i + ENRICH_CONCURRENCY < titles.length) await sleep(200)
  }

  return results
}

async function enrichOne(title: string): Promise<Player | null> {
  const [wikitextFirst, views10yr] = await Promise.all([
    fetchWikitext(title),
    fetch10YrViews(title),
  ])

  // Supplemental players get an extra retry if wikitext fetch failed
  let wikitext = wikitextFirst
  if (!wikitext && SUPPLEMENTAL_TITLES.has(title)) {
    await sleep(1000)
    wikitext = await fetchWikitext(title)
  }

  if (!wikitext) return null
  if (views10yr < VIEWS_10YR_MIN && !SUPPLEMENTAL_TITLES.has(title)) return null

  return parseInfobox(title, wikitext, views10yr)
}

// ── Wikitext fetch ────────────────────────────────────────────────────────────

async function fetchWikitext(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "parse",
    format: "json",
    page: title,
    prop: "wikitext",
    formatversion: "2",
  })

  interface ParseResponse {
    parse?: { wikitext?: string }
    error?: { code: string }
  }

  try {
    const data = await fetchJson<ParseResponse>(`${WIKI_SEARCH_BASE}?${params}`)
    if (data.error) return null
    return data.parse?.wikitext ?? null
  } catch {
    return null
  }
}

// ── 10-year pageview fetch ────────────────────────────────────────────────────
// Correct URL format: en.wikipedia.org (not en.wikipedia), dates YYYYMMDD (8 digits)

async function fetch10YrViews(title: string): Promise<number> {
  const url = `${WIKI_VIEWS_BASE}/${encodeURIComponent(title)}/monthly/20160101/20251231`

  interface ViewsResponse {
    items?: Array<{ views: number }>
  }

  try {
    const data = await fetchJson<ViewsResponse>(url)
    return (data.items ?? []).reduce((s, item) => s + item.views, 0)
  } catch {
    return 0
  }
}

// ── Infobox parsing ───────────────────────────────────────────────────────────

function parseInfobox(title: string, wikitext: string, popularity_score: number): Player | null {
  const infoboxStart = wikitext.indexOf("{{Infobox football biography")
  if (infoboxStart === -1) return null

  // Find matching closing braces
  let depth = 0
  let end = infoboxStart
  for (let i = infoboxStart; i < wikitext.length - 1; i++) {
    if (wikitext[i] === "{" && wikitext[i + 1] === "{") { depth++; i++ }
    else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
      depth--; i++
      if (depth === 0) { end = i + 1; break }
    }
  }

  const infobox = wikitext.slice(infoboxStart, end)

  // Extract a named field, stopping at pipe or newline (not at })
  // This allows multi-template field values to be captured partially, then cleaned
  function field(name: string): string {
    const re = new RegExp(`\\|\\s*${name}\\s*=([^|\n]*)`, "i")
    const m = infobox.match(re)
    if (!m) return ""
    return cleanFieldValue(m[1])
  }

  function fields(prefix: string): string[] {
    const re = new RegExp(`\\|\\s*${prefix}(\\d+)\\s*=([^|\n]*)`, "gi")
    const map: Record<number, string> = {}
    let m: RegExpExecArray | null
    while ((m = re.exec(infobox)) !== null) {
      map[parseInt(m[1])] = cleanFieldValue(m[2])
    }
    const maxIdx = Math.max(0, ...Object.keys(map).map(Number))
    return Array.from({ length: maxIdx }, (_, i) => map[i + 1] ?? "")
  }

  // Like fields() but returns raw (uncleaned) values for numeric extraction via parseNum()
  function rawFields(prefix: string): string[] {
    const re = new RegExp(`\\|\\s*${prefix}(\\d+)\\s*=([^|\n]*)`, "gi")
    const map: Record<number, string> = {}
    let m: RegExpExecArray | null
    while ((m = re.exec(infobox)) !== null) {
      map[parseInt(m[1])] = m[2].trim()
    }
    const maxIdx = Math.max(0, ...Object.keys(map).map(Number))
    return Array.from({ length: maxIdx }, (_, i) => map[i + 1] ?? "")
  }

  // ── Name ──────────────────────────────────────────────────────────────────
  const rawName = field("name") || field("fullname") || humaniseName(title)
  const name = rawName || humaniseName(title)
  if (!name || name.includes("{{") || name.includes("}}")) return null
  // Reject non-player entries (titles like "Knight Bachelor", "OBE", etc.)
  if (/^(knight|dame|order of|title|honour)/i.test(name)) return null
  if (name.length < 3 || name.length > 60) return null

  // ── Nationality ───────────────────────────────────────────────────────────
  const nationalityField = field("nationalityfp") || field("citizenship") || field("nationality")
  const birthPlaceField = field("birth_place")
  const nationality = parseNationality(nationalityField, birthPlaceField, wikitext, title)
  if (!nationality) return null

  const confederation = COUNTRY_TO_CONFEDERATION[nationality] ?? "UEFA"

  // ── Date of birth ─────────────────────────────────────────────────────────
  const dobRaw = field("birth_date")
  const dob = parseDob(dobRaw)
  const age = dob ? calcAge(dob) : 0

  // ── Position ──────────────────────────────────────────────────────────────
  const posRaw = field("position")
  const position = parsePosition(posRaw)

  // ── Current club ──────────────────────────────────────────────────────────
  const currentClubRaw = field("currentclub") || field("current club")
  const current_club = currentClubRaw.replace(/\[\[.*?\|/g, "").replace(/\[\[|\]\]/g, "").trim()
  // Mark as retired if no club, explicitly "retired", or only a women's/girls' club
  // (some players managed women's teams after retiring from playing)
  const retired = !current_club
    || current_club.toLowerCase() === "retired"
    || /\bW\.?F\.?C\.?\b/i.test(current_club)   // Women's Football Club suffix
    || /\b(women|girls|ladies)\b/i.test(current_club)

  // ── Career clubs ──────────────────────────────────────────────────────────
  const clubNames = fields("clubs")
  const clubYears = fields("years")
  const clubCapsRaw  = rawFields("caps")
  const clubGoalsRaw = rawFields("goals")

  const career_clubs: CareerClub[] = []
  let career_goals = 0
  let career_apps = 0
  let peak_club = ""
  let peakApps = 0

  for (let i = 0; i < clubNames.length; i++) {
    const clubName = clubNames[i]
    if (!clubName || clubName.includes("{{")) continue

    const yearsStr = clubYears[i] ?? ""
    const { from, to } = parseYears(yearsStr)
    const apps  = parseNum(clubCapsRaw[i]  ?? "0")
    const goals = parseNum(clubGoalsRaw[i] ?? "0")

    career_clubs.push({ club: clubName, from, to, apps, goals })
    career_goals += goals
    career_apps += apps
    if (apps > peakApps) { peakApps = apps; peak_club = clubName }
  }

  // ── International caps ────────────────────────────────────────────────────
  const nationalTeams     = fields("nationalteam")
  const nationalCapsRaw   = rawFields("nationalcaps")
  const nationalGoalsRaw  = rawFields("nationalgoals")

  let international_caps = 0
  let international_goals = 0

  for (let i = 0; i < nationalTeams.length; i++) {
    const team = nationalTeams[i]
    if (!team || team.includes("{{")) continue
    // Skip youth/U-21 teams
    if (/\bU-?\d+\b/i.test(team) || /youth|u\d+|under-\d+/i.test(team)) continue
    international_caps  += parseNum(nationalCapsRaw[i]  ?? "0")
    international_goals += parseNum(nationalGoalsRaw[i] ?? "0")
  }

  // ── Manager detection ──────────────────────────────────────────────────────
  // Parse managedclubs/managingclubs fields to detect player-managers.
  // is_manager = true if the player has ever managed at professional level.
  // managing_club = current club if actively managing, null otherwise.
  const managedClubNames = fields("managedclubs").concat(fields("managingclubs"))
  const managedYears = fields("managedyears").concat(fields("managingyears"))

  let is_manager = false
  let managing_club: string | null = null

  for (let i = 0; i < managedClubNames.length; i++) {
    const clubName = managedClubNames[i]
    if (!clubName || clubName.includes("{{")) continue
    is_manager = true
    // Check if this stint is current (no end year)
    const yearsStr = managedYears[i] ?? ""
    const { to } = parseYears(yearsStr)
    if (to === null && !managing_club) {
      managing_club = clubName
    }
  }

  // ── Assemble ──────────────────────────────────────────────────────────────
  const id = slugify(name)
  if (!id) return null

  const player: Player = {
    id,
    name,
    nationality,
    confederation,
    dob,
    age,
    position,
    current_club: retired ? "" : current_club,
    retired,
    career_clubs,
    career_goals,
    career_apps,
    international_caps,
    international_goals,
    peak_club,
    popularity_score,
    wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  }

  if (is_manager) player.is_manager = true
  if (managing_club) player.managing_club = managing_club

  return player
}

// ── Markup helpers ────────────────────────────────────────────────────────────

// Extract a number from a raw infobox value that may contain templates like
// {{Nts|182}}, {{sort|182|...}}, {{formatnum:182}}, inline refs, or plain integers.
// Uses the FIRST digit sequence after stripping markup — never concatenates digits.
function parseNum(raw: string): number {
  if (!raw) return 0
  // Template with leading number: {{Nts|N}}, {{sort|N|...}}, {{formatnum:N}}
  const m = raw.match(/\{\{\s*(?:nts|sort|formatnum)\s*[|:](\d+)/i)
  if (m) return parseInt(m[1])
  // Strip inline templates and ref tags, then take the FIRST digit sequence
  const cleaned = raw
    .replace(/\{\{[^{}]*\}\}/g, "")            // {{...}} templates
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "") // <ref>...</ref>
    .replace(/<ref[^>]*\/>/gi, "")              // <ref ... />
  const first = cleaned.match(/\d+/)
  return first ? parseInt(first[0]) : 0
}

function cleanFieldValue(s: string): string {
  // Remove complete templates: {{...}}
  // Replace with up to 5 passes to handle nested templates
  for (let i = 0; i < 5; i++) {
    const prev = s
    s = s.replace(/\{\{[^{}]*\}\}/g, "")
    if (s === prev) break
  }
  // Remove unclosed opening template ({{word that was cut off by regex)
  s = s.replace(/\{\{[^}]*$/, "")
  // Wikilinks: [[Target|Display]] → Display; [[Target]] → Target
  s = s.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1")
  // Remove remaining [[ ]]
  s = s.replace(/\[\[|\]\]/g, "")
  // HTML tags
  s = s.replace(/<[^>]+>/g, "")
  // Ref tags (single line)
  s = s.replace(/<ref[^>]*>.*?<\/ref>/gi, "")
  s = s.replace(/<ref[^>]*\/>/gi, "")
  return s.trim()
}

function humaniseName(title: string): string {
  return title
    .replace(/_\([^)]+\)$/, "")   // remove disambiguation
    .replace(/_/g, " ")
    .trim()
}

function parseNationality(fieldVal: string, birthPlace: string, wikitext: string, title: string): string | null {
  // Hard override for players whose auto-parsing produces wrong results
  if (TITLE_NATIONALITY_OVERRIDE[title]) return TITLE_NATIONALITY_OVERRIDE[title]

  if (fieldVal) {
    const cleaned = fieldVal.toLowerCase().trim()
    // Direct adjective lookup
    if (ADJECTIVE_TO_COUNTRY[cleaned]) return ADJECTIVE_TO_COUNTRY[cleaned]
    // Try as country name
    for (const country of Object.keys(COUNTRY_TO_CONFEDERATION)) {
      if (normalise(country) === normalise(fieldVal)) return country
    }
    // Multi-nationality: take the first token
    const firstWord = cleaned.split(/[\s/,]+/)[0]
    if (ADJECTIVE_TO_COUNTRY[firstWord]) return ADJECTIVE_TO_COUNTRY[firstWord]
  }

  // Fall back to first 800 chars of article intro
  const intro = wikitext.slice(0, 800).toLowerCase()
  // Match "{nationality} footballer", "{nationality} football manager", "{nationality} football coach"
  for (const [adj, country] of Object.entries(ADJECTIVE_TO_COUNTRY)) {
    if (intro.includes(adj + " footballer") ||
        intro.includes(adj + " professional") ||
        intro.includes(adj + " football manager") ||
        intro.includes(adj + " football coach") ||
        intro.includes(adj + " football player")) {
      return country
    }
  }

  // Final fallback: last country name in birth_place field
  if (birthPlace) {
    const tokens = birthPlace.split(/,\s*/)
    const lastToken = tokens[tokens.length - 1].trim()
    for (const country of Object.keys(COUNTRY_TO_CONFEDERATION)) {
      if (normalise(country) === normalise(lastToken)) return country
    }
    // Also check penultimate token (some places list region before country)
    if (tokens.length >= 2) {
      const penult = tokens[tokens.length - 2].trim()
      for (const country of Object.keys(COUNTRY_TO_CONFEDERATION)) {
        if (normalise(country) === normalise(penult)) return country
      }
    }
  }

  return null
}

function parseDob(raw: string): string {
  if (!raw) return ""
  // {{birth date and age|1993|7|28|...}} or {{birth date|1993|7|28}}
  const m = raw.match(/(\d{4})\s*[|,]\s*(\d{1,2})\s*[|,]\s*(\d{1,2})/)
  if (m) {
    const [, y, mo, d] = m
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  const iso = raw.match(/(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  return ""
}

function calcAge(dob: string): number {
  if (!dob) return 0
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function parsePosition(raw: string): Player["position"] {
  const lower = raw.toLowerCase()
  if (/goalkeeper|goal keeper/.test(lower)) return "GK"
  if (/defender|centre.back|center.back|\bback\b/.test(lower)) return "DEF"
  if (/midfielder|midfield/.test(lower)) return "MID"
  if (/forward|striker|winger|attacker/.test(lower)) return "ATT"
  return "MID"
}

function parseYears(raw: string): { from: number; to: number | null } {
  const m = raw.match(/(\d{4})\s*[–\-]\s*(\d{4}|present)?/)
  if (!m) {
    const single = raw.match(/(\d{4})/)
    return { from: single ? parseInt(single[1]) : 0, to: null }
  }
  const from = parseInt(m[1])
  const to = m[2] && /\d{4}/.test(m[2]) ? parseInt(m[2]) : null
  return { from, to }
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function deduplicatePlayers(players: Player[]): Player[] {
  const best = new Map<string, Player>()
  for (const p of players) {
    const existing = best.get(p.id)
    if (!existing || p.popularity_score > existing.popularity_score) {
      best.set(p.id, p)
    }
  }
  return Array.from(best.values())
}

// ── Incremental mode ──────────────────────────────────────────────────────────

async function runIncremental(batchSize: number, specificMonth?: string, fillMonths?: boolean) {
  console.log("=== build-player-db (incremental) ===")
  console.log(`Output: ${OUTPUT_PATH}`)
  console.log(`Progress: ${PROGRESS_PATH}`)
  console.log("")

  const existingPlayers = loadExistingPlayers()
  const progress = loadProgress()

  // Build dedup sets from existing players
  const fetchedIds = new Set(existingPlayers.map((p) => p.id))
  const fetchedUrls = new Set(existingPlayers.map((p) => p.wikipedia_url))

  // ── Month discovery phase ─────────────────────────────────────────────────
  if (fillMonths || specificMonth) {
    const monthsToProcess = specificMonth
      ? [specificMonth].filter((m) => !progress.months_processed.includes(m))
      : progress.months_remaining.slice()

    if (monthsToProcess.length === 0) {
      console.log("All months already processed.")
    } else {
      console.log(`Discovering players from ${monthsToProcess.length} months...`)
      let totalNew = 0

      for (const month of monthsToProcess) {
        const titles = await discoverFromMonth(month)
        let monthNew = 0
        for (const title of titles) {
          if (!fetchedIds.has(slugify(humaniseName(title))) &&
              !progress.players_queued.includes(title) &&
              !progress.players_fetched.includes(slugify(humaniseName(title)))) {
            progress.players_queued.push(title)
            monthNew++
          }
        }
        if (!progress.months_processed.includes(month)) {
          progress.months_processed.push(month)
        }
        progress.months_remaining = progress.months_remaining.filter((m) => m !== month)
        totalNew += monthNew
        console.log(`  ${month}: ${titles.length} candidates, ${monthNew} new titles queued`)
        saveProgress(progress)
        await sleep(200)
      }
      console.log(`Discovery complete. ${totalNew} new titles added to queue.`)
      console.log(`Queue size: ${progress.players_queued.length}`)
      console.log("")
    }
  }

  // ── Enrichment phase ──────────────────────────────────────────────────────
  const toProcess = progress.players_queued.slice(0, batchSize)
  if (toProcess.length === 0) {
    console.log("No players queued.")
    console.log("Run with --fill-months to discover more players from monthly pageviews.")
    console.log(`Total players in database: ${existingPlayers.length}`)
    return
  }

  console.log(`Processing ${toProcess.length} players (${progress.players_queued.length} total in queue)...`)
  console.log("")

  const newPlayers: Player[] = []
  const failed: { title: string; reason: string }[] = []
  const currentPlayers = [...existingPlayers]

  for (let i = 0; i < toProcess.length; i++) {
    const title = toProcess[i]
    const displayName = humaniseName(title)
    console.log(`  Fetching player ${i + 1}/${toProcess.length}: ${displayName}...`)

    try {
      const player = await enrichOne(title)

      if (player) {
        if (!fetchedIds.has(player.id) && !fetchedUrls.has(player.wikipedia_url)) {
          newPlayers.push(player)
          fetchedIds.add(player.id)
          fetchedUrls.add(player.wikipedia_url)
          currentPlayers.push(player)
          progress.players_fetched.push(player.id)

          // Checkpoint: write every CHECKPOINT_INTERVAL new players
          if (newPlayers.length % CHECKPOINT_INTERVAL === 0) {
            const sorted = deduplicatePlayers(currentPlayers).sort((a, b) => b.popularity_score - a.popularity_score)
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2))
            progress.total_players = sorted.length
            progress.players_queued = progress.players_queued.filter((t) => !toProcess.slice(0, i + 1).includes(t))
            saveProgress(progress)
            console.log(`    ✓ Checkpoint: ${sorted.length} total players in database`)
          }
        } else {
          console.log(`    → Skipped duplicate: ${player.name}`)
        }
      } else {
        failed.push({ title, reason: "Not a footballer or below view threshold" })
      }
    } catch (err) {
      failed.push({ title, reason: String(err) })
    }
  }

  // Final write
  const finalPlayers = deduplicatePlayers(currentPlayers).sort((a, b) => b.popularity_score - a.popularity_score)
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalPlayers, null, 2))

  // Update progress
  progress.players_queued = progress.players_queued.filter((t) => !toProcess.includes(t))
  progress.total_players = finalPlayers.length
  progress.last_run = new Date().toISOString()
  saveProgress(progress)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("")
  console.log(`Run complete. ${newPlayers.length} new players added:`)
  const addedSorted = [...newPlayers].sort((a, b) => b.popularity_score - a.popularity_score)
  for (const p of addedSorted) {
    const status = p.is_manager ? "manager" : p.retired ? "retired" : "active"
    console.log(`- ${p.name} (${p.nationality}, ${p.position}, ${status}) — popularity: ${p.popularity_score.toLocaleString()}`)
  }

  console.log("")
  console.log(`Total players now in database: ${finalPlayers.length}`)
  console.log(`Remaining in queue: ${progress.players_queued.length}`)

  if (addedSorted.length > 0) {
    console.log("\nTop 5 most popular added this run:")
    for (const p of addedSorted.slice(0, 5)) {
      console.log(`  ${p.name} — ${p.popularity_score.toLocaleString()}`)
    }
  }

  if (failed.length > 0) {
    console.log(`\nFailed to fetch (${failed.length}):`)
    for (const f of failed.slice(0, 10)) {
      console.log(`  ${humaniseName(f.title)}: ${f.reason}`)
    }
    if (failed.length > 10) console.log(`  ... and ${failed.length - 10} more`)
  }
}

// ── Full rebuild ──────────────────────────────────────────────────────────────

async function runFullBuild() {
  console.log("=== build-player-db ===")
  console.log(`Output: ${OUTPUT_PATH}`)
  console.log("")

  const startMs = Date.now()

  const candidates = await discoverFootballBios()
  const players = await enrichCandidates(candidates)
  const deduped = deduplicatePlayers(players)
  deduped.sort((a, b) => b.popularity_score - a.popularity_score)

  console.log("")
  console.log(`Total players: ${deduped.length}`)
  console.log(`Elapsed: ${((Date.now() - startMs) / 1000).toFixed(1)}s`)

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(deduped, null, 2))
  console.log(`Written to ${OUTPUT_PATH}`)

  // Update progress to reflect full build
  const progress = loadProgress()
  progress.players_fetched = deduped.map((p) => p.id)
  progress.players_queued = []
  progress.total_players = deduped.length
  progress.last_run = new Date().toISOString()
  saveProgress(progress)

  console.log("\nTop 10 by popularity:")
  for (const p of deduped.slice(0, 10)) {
    console.log(`  ${p.name} (${p.nationality}) — ${p.popularity_score.toLocaleString()} views, ${p.career_goals}g/${p.career_apps}a`)
  }

  // Spot-check test players
  console.log("\nTest player check:")
  const testNames = ["harry kane", "lionel messi", "cristiano ronaldo", "erling haaland",
    "emile heskey", "jonjo shelvey", "michael owen", "bukayo saka"]
  for (const name of testNames) {
    const found = deduped.find(p => normalise(p.name).includes(normalise(name)))
    console.log(`  ${name}: ${found ? `✓ (${found.name}, ${found.popularity_score.toLocaleString()} views)` : "✗ MISSING"}`)
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const incremental = args.includes("--incremental")
  const fillMonths = args.includes("--fill-months")

  const batchSizeIdx = args.indexOf("--batch-size")
  const batchSize = batchSizeIdx !== -1 ? parseInt(args[batchSizeIdx + 1] ?? "50") : 50

  const monthIdx = args.indexOf("--month")
  const specificMonth = monthIdx !== -1 ? args[monthIdx + 1] : undefined

  if (incremental) {
    await runIncremental(batchSize, specificMonth, fillMonths)
  } else {
    await runFullBuild()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
