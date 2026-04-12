import { NextResponse } from "next/server"
import type { Player } from "@/lib/player"
import playersData from "@/data/players.json"

const PLAYERS = playersData as unknown as Player[]

function lcg(seed: number): number {
  return (Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0)
}

export async function GET() {
  const now = new Date()
  const dateStr = now.toISOString().split("T")[0]

  // Filter to iconic players with long enough careers to make connections possible
  const pool = PLAYERS.filter(
    p => p.popularity_score > 1_500_000 && (p.career_clubs?.length ?? 0) >= 3
  )

  // Date-seeded LCG to pick two distinct players
  let seed = parseInt(dateStr.replace(/-/g, ""), 10)
  seed = lcg(seed)
  seed = lcg(seed)

  const idxA = seed % pool.length
  seed = lcg(seed)
  let idxB = seed % pool.length
  // Ensure different players
  if (idxB === idxA) idxB = (idxB + 1) % pool.length

  const aPlayer = pool[idxA]
  const bPlayer = pool[idxB]

  return NextResponse.json({ aPlayer, bPlayer, dateStr })
}
