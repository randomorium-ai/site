import { NextResponse } from "next/server"
import type { Player } from "@/lib/player"
import playersData from "@/data/players.json"

const PLAYERS = playersData as unknown as Player[]

function lcg(seed: number): number {
  return (Math.imul((seed ^ (seed >>> 16)) + 0xc4ceb9fe, 0x45d9f3b) >>> 0)
}

export async function GET() {
  const now = new Date()
  const dateStr = now.toISOString().split("T")[0]

  // Pool: recognisable players
  const pool = PLAYERS.filter(p => p.popularity_score > 100_000)

  let seed = parseInt(dateStr.replace(/-/g, ""), 10)
  seed = lcg(seed + 11)
  seed = lcg(seed)

  const idx = seed % pool.length
  // Return mystery player — client reveals identity after game over
  const mystery = pool[idx]

  return NextResponse.json({ mystery, dateStr })
}
