import { NextRequest, NextResponse } from "next/server"
import { getFixtureLineup, ApiError } from "@/lib/football-api"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params
  const id = parseInt(fixtureId, 10)

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid fixture id" }, { status: 400 })
  }

  try {
    const lineup = await getFixtureLineup(id)
    if (!lineup) {
      return NextResponse.json({ error: "Lineup not found" }, { status: 404 })
    }
    return NextResponse.json({ lineup })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}
