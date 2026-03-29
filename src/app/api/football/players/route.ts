import { NextRequest, NextResponse } from "next/server"
import { searchPlayers, ApiError } from "@/lib/football-api"
import { normaliseText } from "@/lib/football-data"
import { searchLocal } from "@/lib/football-search"

// ── Route handler ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("search") ?? ""
  const league = req.nextUrl.searchParams.get("league") ?? undefined

  if (raw.length < 2) {
    return NextResponse.json({ players: [] })
  }

  const normQ = normaliseText(raw)

  // ── Phase 1: Local search (alias → popular pool → OpenFootball) ───────────
  // Zero API calls. Covers ~400 popular players with career stats plus 25k
  // OpenFootball players for less-famous names like Reece James.

  const localPlayers = searchLocal(normQ)

  if (localPlayers.length > 0) {
    return NextResponse.json({ players: localPlayers, source: "local" })
  }

  // ── Phase 2: API-Football fallback (only when local returns nothing) ───────
  // Preserves the 100 req/day free-tier budget for truly unknown players.

  const words = normQ.split(/\s+/).filter(w => w.length >= 2)
  const attempts = [...new Set([normQ, ...words])]

  try {
    for (const attempt of attempts) {
      const players = await searchPlayers(attempt, league)
      if (players.length > 0) {
        const withTeam = players.filter(p => p.currentTeam)
        return NextResponse.json({
          players: withTeam.length > 0 ? withTeam : players,
          source: "api",
        })
      }
    }

    return NextResponse.json({ players: [] })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
