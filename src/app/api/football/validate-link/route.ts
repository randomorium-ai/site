import { NextRequest, NextResponse } from "next/server"
import { findPlayerById } from "@/lib/player-search"

export async function POST(req: NextRequest) {
  let body: { playerAId: string; playerBId: string; linkType: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { playerAId, playerBId, linkType } = body

  // Non-club links are honor system — always accepted
  if (linkType !== "club") {
    return NextResponse.json({ valid: true, evidence: null })
  }

  const playerA = findPlayerById(playerAId)
  const playerB = findPlayerById(playerBId)

  if (!playerA || !playerB) {
    // Unknown player — accept on honor system
    return NextResponse.json({ valid: true, evidence: null })
  }

  // Find overlapping career clubs (by normalised name, ignoring years)
  const clubsA = new Set(playerA.career_clubs.map((c) => c.club.toLowerCase().trim()))

  for (const clubB of playerB.career_clubs) {
    const name = clubB.club.toLowerCase().trim()
    if (clubsA.has(name)) {
      return NextResponse.json({
        valid: true,
        evidence: `Both played for ${clubB.club}`,
      })
    }
  }

  return NextResponse.json({ valid: false, evidence: null })
}
