// Unified local player search — no API calls.
// Priority: 1. alias resolution → 2. popular-players pool → 3. OpenFootball dataset
// Returns ApiPlayer[] with career stats populated from the popular pool where available.

import { PLAYER_ALIASES } from "@/data/player-aliases"
import { searchPopularPlayers, findPopularPlayer, type PopularPlayer } from "@/data/popular-players"
import { searchLocalPlayers, normaliseText } from "@/lib/football-data"
import type { ApiPlayer } from "@/lib/football-api"

// ── Build ApiPlayer from a PopularPlayer ───────────────────────────────────

function popularToApiPlayer(pop: PopularPlayer): ApiPlayer {
  const parts = pop.name.trim().split(" ")
  const firstname = parts.slice(0, -1).join(" ")
  const lastname = parts[parts.length - 1]

  return {
    id: 0,
    name: pop.name,
    firstname,
    lastname,
    age: 0,
    nationality: pop.nationality,
    position: pop.position,
    photo: "",
    currentTeam: pop.currentTeam,
    currentTeamId: 0,
    stats: {
      appearances: 0,
      goals: 0,
      assists: 0,
      minutesPlayed: 0,
      yellowCards: 0,
      redCards: 0,
      rating: "0",
      careerGoals: pop.careerGoals,
      careerApps: pop.careerApps,
      careerAssists: pop.careerAssists,
      intCaps: pop.intCaps,
    },
  }
}

// ── Build a minimal ApiPlayer from OpenFootball data ──────────────────────

function localToApiPlayer(name: string, nationality: string, position: string): ApiPlayer {
  // Check if we have career stats for this player in the popular pool
  const pop = findPopularPlayer(name)
  if (pop) return popularToApiPlayer(pop)

  const parts = name.trim().split(" ")
  const firstname = parts.slice(0, -1).join(" ")
  const lastname = parts[parts.length - 1]

  return {
    id: 0,
    name,
    firstname,
    lastname,
    age: 0,
    nationality,
    position,
    photo: "",
    currentTeam: "",
    currentTeamId: 0,
    stats: {
      appearances: 0,
      goals: 0,
      assists: 0,
      minutesPlayed: 0,
      yellowCards: 0,
      redCards: 0,
      rating: "0",
      careerGoals: 0,
      careerApps: 0,
      careerAssists: 0,
      intCaps: 0,
    },
  }
}

// ── Main unified search ────────────────────────────────────────────────────
// Returns up to `limit` players, sourced entirely from local data.

export function searchLocal(query: string, limit = 20): ApiPlayer[] {
  if (query.length < 2) return []

  const normQ = normaliseText(query)
  const seen = new Set<string>()
  const results: ApiPlayer[] = []

  // ── Step 1: alias resolution ──────────────────────────────────────────
  const canonicalName = PLAYER_ALIASES[normQ]
  if (canonicalName) {
    const pop = findPopularPlayer(canonicalName)
    if (pop) {
      seen.add(normaliseText(pop.name))
      results.push(popularToApiPlayer(pop))
    }
  }

  // ── Step 2: popular pool search ───────────────────────────────────────
  const popularResults = searchPopularPlayers(normQ, limit)
  for (const pop of popularResults) {
    const key = normaliseText(pop.name)
    if (!seen.has(key)) {
      seen.add(key)
      results.push(popularToApiPlayer(pop))
    }
    if (results.length >= limit) return results
  }

  // ── Step 3: OpenFootball dataset ──────────────────────────────────────
  if (results.length < limit) {
    const localResults = searchLocalPlayers(normQ, limit)
    for (const local of localResults) {
      const key = normaliseText(local.name)
      if (!seen.has(key)) {
        seen.add(key)
        results.push(localToApiPlayer(local.name, local.nationality, local.position))
      }
      if (results.length >= limit) break
    }
  }

  return results
}
