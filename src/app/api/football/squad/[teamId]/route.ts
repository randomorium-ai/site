import { NextRequest, NextResponse } from "next/server"
import { getSquad, ApiError } from "@/lib/football-api"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params
  const id = parseInt(teamId, 10)

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 })
  }

  try {
    const players = await getSquad(id)
    return NextResponse.json({ players })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}
