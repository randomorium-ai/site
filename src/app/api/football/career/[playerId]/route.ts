import { NextRequest, NextResponse } from "next/server"
import { getPlayerCareer, ApiError } from "@/lib/football-api"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params
  const id = Number(playerId)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid player ID" }, { status: 400 })
  }

  try {
    const career = await getPlayerCareer(id)
    return NextResponse.json({ career })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Failed to fetch career" }, { status: 500 })
  }
}
