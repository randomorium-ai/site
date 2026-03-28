import { NextRequest, NextResponse } from "next/server"
import { getPlayer, ApiError } from "@/lib/football-api"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const playerId = parseInt(id, 10)

  if (isNaN(playerId)) {
    return NextResponse.json({ error: "Invalid player id" }, { status: 400 })
  }

  try {
    const player = await getPlayer(playerId)
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }
    return NextResponse.json({ player })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}
