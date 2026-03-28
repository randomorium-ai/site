// Local player dataset — primary search layer, zero API calls
// Sourced from OpenFootball (https://github.com/openfootball/players), CC0 license
// Fallback to API-Football when local search returns no results

import { readFileSync } from 'fs'
import { join } from 'path'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LocalPlayer {
  n: string    // name
  nat: string  // nationality
  pos: string  // GK | DEF | MID | ATT
}

// ── Load dataset (once, module-level singleton) ────────────────────────────────

let _players: LocalPlayer[] | null = null

function getPlayers(): LocalPlayer[] {
  if (_players) return _players
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'players.json')
    const raw = readFileSync(filePath, 'utf-8')
    _players = JSON.parse(raw) as LocalPlayer[]
  } catch {
    _players = []
  }
  return _players
}

// ── Normalise text for matching ────────────────────────────────────────────────

export function normaliseText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics: Modrić → Modric
    .toLowerCase()
    .trim()
}

// ── Fuzzy search ───────────────────────────────────────────────────────────────

export interface LocalSearchResult {
  name: string
  nationality: string
  position: string
  score: number  // higher = better match
}

export function searchLocalPlayers(
  query: string,
  limit = 20
): LocalSearchResult[] {
  if (query.length < 2) return []

  const normQ = normaliseText(query)
  const queryWords = normQ.split(/\s+/).filter(w => w.length > 0)
  const players = getPlayers()

  const results: LocalSearchResult[] = []

  for (const p of players) {
    const normName = normaliseText(p.n)
    const nameWords = normName.split(/\s+/)

    let score = 0

    // Exact full name match
    if (normName === normQ) {
      score = 1000
    }
    // Full name starts with query
    else if (normName.startsWith(normQ)) {
      score = 800
    }
    // All query words found in name words
    else if (queryWords.every(qw => nameWords.some(nw => nw.startsWith(qw)))) {
      score = 600
    }
    // Any query word starts any name word
    else if (queryWords.some(qw => nameWords.some(nw => nw.startsWith(qw)))) {
      score = 400
    }
    // Full name contains query as substring
    else if (normName.includes(normQ)) {
      score = 200
    }
    // Any query word is substring of full name
    else if (queryWords.some(qw => normName.includes(qw) && qw.length >= 3)) {
      score = 100
    }

    if (score > 0) {
      results.push({
        name: p.n,
        nationality: p.nat,
        position: p.pos,
        score,
      })
    }
  }

  // Sort by score descending, then name alphabetically
  results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  return results.slice(0, limit)
}

// ── Find best local match for a given name ─────────────────────────────────────
// Used to normalise user input before API lookup

export function findLocalPlayer(name: string): LocalPlayer | null {
  const results = searchLocalPlayers(name, 1)
  if (results.length === 0) return null
  if (results[0].score < 400) return null  // low confidence
  return {
    n: results[0].name,
    nat: results[0].nationality,
    pos: results[0].position,
  }
}
