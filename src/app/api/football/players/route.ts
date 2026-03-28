import { NextRequest, NextResponse } from "next/server"
import { searchPlayers, ApiError } from "@/lib/football-api"

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? ""
  const league = req.nextUrl.searchParams.get("league") ?? undefined

  if (search.length < 2) {
    return NextResponse.json({ players: [] })
  }

  try {
    const players = await searchPlayers(search, league)
    return NextResponse.json({ players })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
