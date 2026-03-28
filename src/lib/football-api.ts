// API-Football via RapidAPI
// Base URL: https://v3.football.api-sports.io
// Key stored as RAPIDAPI_KEY (server-side only)

const BASE_URL = "https://v3.football.api-sports.io"
const RAPIDAPI_HOST = "v3.football.api-sports.io"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiPlayer {
  id: number
  name: string
  firstname: string
  lastname: string
  age: number
  nationality: string
  position: string // "Goalkeeper" | "Defender" | "Midfielder" | "Attacker"
  photo: string
  currentTeam: string
  currentTeamId: number
  stats: {
    appearances: number
    goals: number
    assists: number
    minutesPlayed: number
    yellowCards: number
    redCards: number
    rating: string
  }
}

export interface ApiTheme {
  id: string
  label: string
  unit: string
  targetMin: number
  targetMax: number
  getStat: (p: ApiPlayer) => number
}

// ── Themes for The Number game ─────────────────────────────────────────────

export const API_THEMES: ApiTheme[] = [
  {
    id: "goals",
    label: "Goals this season",
    unit: "goals",
    targetMin: 5,
    targetMax: 40,
    getStat: (p) => p.stats.goals,
  },
  {
    id: "assists",
    label: "Assists this season",
    unit: "assists",
    targetMin: 3,
    targetMax: 25,
    getStat: (p) => p.stats.assists,
  },
  {
    id: "minutes",
    label: "Minutes played this season",
    unit: "mins",
    targetMin: 500,
    targetMax: 2500,
    getStat: (p) => p.stats.minutesPlayed,
  },
]

// ── Career season type ─────────────────────────────────────────────────────

export interface CareerSeason {
  season: string    // e.g. "2024" = 2024/25
  teamId: number
  teamName: string
  appearances: number
}

// ── In-memory cache ────────────────────────────────────────────────────────

interface CacheEntry {
  data: unknown
  expires: number
}

const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 60 * 60 * 1000 // 1 hour

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCached(key: string, data: unknown, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) throw new ApiError("RAPIDAPI_KEY not configured", 500)

  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const cacheKey = url.toString()
  const cached = getCached<T>(cacheKey)
  if (cached) return cached

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new ApiError(`API-Football error: ${res.status} ${res.statusText}`, res.status)
  }

  const json = await res.json() as T
  setCached(cacheKey, json)
  return json
}

// ── Response normalisation helpers ────────────────────────────────────────

function normalisePosition(raw: string): string {
  const map: Record<string, string> = {
    Goalkeeper: "GK",
    Defender: "DEF",
    Midfielder: "MID",
    Attacker: "ATT",
  }
  return map[raw] ?? raw
}

// API returns "appearences" (typo) — handle both spellings
function extractAppearances(stats: Record<string, unknown>): number {
  const g = stats.games as Record<string, unknown> | undefined
  if (!g) return 0
  return (g.appearences as number | null) ?? (g.appearances as number | null) ?? 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalisePlayerEntry(entry: any): ApiPlayer {
  const p = entry.player
  const s = entry.statistics?.[0] ?? {}
  const games = s.games ?? {}
  const goals = s.goals ?? {}
  const cards = s.cards ?? {}

  return {
    id: p.id,
    name: p.name,
    firstname: p.firstname,
    lastname: p.lastname,
    age: p.age ?? 0,
    nationality: p.nationality ?? "",
    position: normalisePosition(games.position ?? p.position ?? ""),
    photo: p.photo ?? "",
    currentTeam: s.team?.name ?? "",
    currentTeamId: s.team?.id ?? 0,
    stats: {
      appearances: extractAppearances(s),
      goals: goals.total ?? 0,
      assists: goals.assists ?? 0,
      minutesPlayed: games.minutes ?? 0,
      yellowCards: cards.yellow ?? 0,
      redCards: cards.red ?? 0,
      rating: games.rating ?? "0",
    },
  }
}

// ── Public API functions ───────────────────────────────────────────────────

const CURRENT_SEASON = "2024"
const CAREER_SEASONS = ["2024", "2023", "2022", "2021", "2020"]
const TTL_24H = 24 * 60 * 60 * 1000

// Top 5 European leagues + Champions League
const SEARCH_LEAGUES = ["39", "140", "78", "135", "61", "2"]

export async function searchPlayers(query: string, league?: string): Promise<ApiPlayer[]> {
  if (query.length < 2) return []

  const leagues = league ? [league] : SEARCH_LEAGUES

  // Search all leagues in parallel, deduplicate by player id
  const results = await Promise.allSettled(
    leagues.map(l =>
      apiFetch<{ response: unknown[] }>("/players", {
        search: query,
        season: CURRENT_SEASON,
        league: l,
      })
    )
  )

  const seen = new Set<number>()
  const players: ApiPlayer[] = []

  for (const result of results) {
    if (result.status !== "fulfilled") continue
    for (const entry of result.value.response ?? []) {
      const p = normalisePlayerEntry(entry)
      if (!seen.has(p.id)) {
        seen.add(p.id)
        players.push(p)
      }
    }
  }

  return players
}

export async function getPlayer(id: number): Promise<ApiPlayer | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await apiFetch<any>("/players", { id: String(id), season: CURRENT_SEASON })
  const entries = data.response ?? []
  if (entries.length === 0) return null
  return normalisePlayerEntry(entries[0])
}

export async function getPlayerCareer(playerId: number): Promise<CareerSeason[]> {
  const cacheKey = `career:${playerId}`
  const cached = getCached<CareerSeason[]>(cacheKey)
  if (cached) return cached

  const results = await Promise.allSettled(
    CAREER_SEASONS.map(season =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiFetch<any>("/players", { id: String(playerId), season })
    )
  )

  const seen = new Set<string>()
  const seasons: CareerSeason[] = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status !== "fulfilled") continue
    const entries = result.value.response ?? []
    for (const entry of entries) {
      const s = entry.statistics?.[0]
      if (!s?.team?.id) continue
      const key = `${s.team.id}:${CAREER_SEASONS[i]}`
      if (seen.has(key)) continue
      seen.add(key)
      seasons.push({
        season: CAREER_SEASONS[i],
        teamId: s.team.id,
        teamName: s.team.name ?? "",
        appearances: extractAppearances(s),
      })
    }
  }

  setCached(cacheKey, seasons, TTL_24H)
  return seasons
}

export async function getSquad(teamId: number): Promise<ApiPlayer[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await apiFetch<any>("/players/squads", { team: String(teamId) })
  const squad = data.response?.[0]?.players ?? []
  // Squad endpoint returns minimal player data — no stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return squad.map((p: any) => ({
    id: p.id,
    name: p.name,
    firstname: "",
    lastname: "",
    age: p.age ?? 0,
    nationality: "",
    position: normalisePosition(p.position ?? ""),
    photo: p.photo ?? "",
    currentTeam: "",
    currentTeamId: teamId,
    stats: { appearances: 0, goals: 0, assists: 0, minutesPlayed: 0, yellowCards: 0, redCards: 0, rating: "0" },
  }))
}

export async function getFixtureLineup(fixtureId: number): Promise<{
  home: { teamName: string; players: ApiPlayer[] }
  away: { teamName: string; players: ApiPlayer[] }
} | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await apiFetch<any>("/fixtures/lineups", { fixture: String(fixtureId) })
  const lineups = data.response ?? []
  if (lineups.length < 2) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapLineupPlayer = (p: any): ApiPlayer => ({
    id: p.player.id,
    name: p.player.name,
    firstname: "",
    lastname: "",
    age: 0,
    nationality: "",
    position: normalisePosition(p.player.pos ?? ""),
    photo: p.player.photo ?? "",
    currentTeam: "",
    currentTeamId: 0,
    stats: { appearances: 0, goals: 0, assists: 0, minutesPlayed: 0, yellowCards: 0, redCards: 0, rating: "0" },
  })

  return {
    home: {
      teamName: lineups[0].team.name,
      players: (lineups[0].startXI ?? []).map(mapLineupPlayer),
    },
    away: {
      teamName: lineups[1].team.name,
      players: (lineups[1].startXI ?? []).map(mapLineupPlayer),
    },
  }
}
