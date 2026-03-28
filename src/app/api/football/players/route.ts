import { NextRequest, NextResponse } from "next/server"
import { searchPlayers, ApiError } from "@/lib/football-api"
import { searchLocalPlayers, normaliseText } from "@/lib/football-data"

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("search") ?? ""
  const league = req.nextUrl.searchParams.get("league") ?? undefined

  if (raw.length < 2) {
    return NextResponse.json({ players: [] })
  }

  const normQ = normaliseText(raw)
  const words = normQ.split(/\s+/).filter(w => w.length >= 2)

  // ── Phase 1: Local search (instant, zero API calls) ──────────────────────────
  // Returns name/nationality/position — no stats or team
  // We use this to normalise the search term before hitting the API

  const localMatches = searchLocalPlayers(normQ)

  // ── Phase 2: API-Football (stats + current team) ──────────────────────────────
  // Use the top local match name if confident, otherwise try the raw query
  // Retry: full query → first word → last word

  const apiQueries: string[] = []

  if (localMatches.length > 0 && localMatches[0].score >= 600) {
    // High confidence local match — use the correctly spelled name first
    apiQueries.push(normaliseText(localMatches[0].name))
  }

  // Always include the direct query and word-by-word fallbacks
  apiQueries.push(normQ)
  if (words.length > 1) {
    apiQueries.push(words[0], words[words.length - 1])
  }

  // Deduplicate
  const attempts = [...new Set(apiQueries)]

  try {
    for (const attempt of attempts) {
      const players = await searchPlayers(attempt, league)
      if (players.length > 0) {
        return NextResponse.json({ players, source: "api" })
      }
    }

    // ── Phase 3: Return local-only results if API returns nothing ─────────────
    // These won't have stats/team but at least show the player exists
    // The game will handle the missing data gracefully
    if (localMatches.length > 0) {
      const localPlayers = localMatches.map(m => ({
        id: 0,  // no API ID
        name: m.name,
        firstname: m.name.split(' ').slice(0, -1).join(' '),
        lastname: m.name.split(' ').slice(-1)[0],
        age: 0,
        nationality: m.nationality,
        position: m.position,
        photo: '',
        currentTeam: '',
        currentTeamId: 0,
        stats: { appearances: 0, goals: 0, assists: 0, minutesPlayed: 0, yellowCards: 0, redCards: 0, rating: '0' },
      }))
      return NextResponse.json({ players: localPlayers, source: "local" })
    }

    return NextResponse.json({ players: [] })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
