import { NextRequest, NextResponse } from "next/server"
import { searchPlayers } from "@/lib/player-search"
import { normalise } from "@/lib/player"

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("search") ?? ""
  if (raw.length < 2) return NextResponse.json({ players: [] })

  const normQ = normalise(raw)
  const players = searchPlayers(normQ)
  return NextResponse.json({ players })
}
