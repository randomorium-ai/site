import { NextRequest, NextResponse } from "next/server"
import { getPlayerCareer, ApiError } from "@/lib/football-api"

export async function POST(req: NextRequest) {
  let body: { playerAId: number; playerBId: number; linkType: string }
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

  try {
    const [careerA, careerB] = await Promise.all([
      getPlayerCareer(playerAId),
      getPlayerCareer(playerBId),
    ])

    const setA = new Set(careerA.map(s => `${s.teamId}:${s.season}`))

    for (const b of careerB) {
      if (setA.has(`${b.teamId}:${b.season}`)) {
        const yr = String(parseInt(b.season) + 1).slice(-2)
        return NextResponse.json({
          valid: true,
          evidence: `Both at ${b.teamName} — ${b.season}/${yr}`,
        })
      }
    }

    return NextResponse.json({ valid: false, evidence: null })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}
