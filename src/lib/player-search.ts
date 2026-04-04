// Runtime player search over the local players.json dataset.
// Zero API calls. Returns players sorted by popularity_score.

import type { Player } from "@/lib/player"
import { normalise } from "@/lib/player"
import { PLAYER_ALIASES } from "@/data/player-aliases"

// Import players.json as a static asset (committed to repo, rebuilt weekly by cron).
// TypeScript resolveJsonModule + Next.js bundle this at deployment time.
import playersData from "@/data/players.json"
const PLAYERS = playersData as unknown as Player[]

// ── Search ────────────────────────────────────────────────────────────────────

export function searchPlayers(query: string, limit = 20): Player[] {
  if (query.length < 2) return []

  const normQ = normalise(query)
  const seen = new Set<string>()
  const results: Player[] = []

  // ── Step 1: alias resolution ──────────────────────────────────────────────
  const aliasTarget = PLAYER_ALIASES[normQ]
  if (aliasTarget) {
    const normTarget = normalise(aliasTarget)
    const p = PLAYERS.find((pl) => normalise(pl.name) === normTarget)
    if (p) {
      seen.add(p.id)
      results.push(p)
    }
  }

  // ── Step 2: name substring match, ranked by popularity ───────────────────
  const matches = PLAYERS
    .filter((p) => !seen.has(p.id) && normalise(p.name).includes(normQ))
    .sort((a, b) => b.popularity_score - a.popularity_score)

  for (const p of matches) {
    if (results.length >= limit) break
    seen.add(p.id)
    results.push(p)
  }

  return results
}

// ── Lookups ───────────────────────────────────────────────────────────────────

export function findPlayerById(id: string): Player | undefined {
  return PLAYERS.find((p) => p.id === id)
}

export function findPlayerByName(name: string): Player | undefined {
  const normName = normalise(name)
  return PLAYERS.find((p) => normalise(p.name) === normName)
}
