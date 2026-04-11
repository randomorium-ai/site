import { NextResponse } from "next/server"
import type { Player } from "@/lib/player"
import playersData from "@/data/players.json"

const PLAYERS = playersData as unknown as Player[]

function lcg(seed: number): number {
  return (Math.imul((seed ^ (seed >>> 16)) + 0xbf58476d, 0x45d9f3b) >>> 0)
}

// Clubs that count: exclude stints with fewer than 10 apps (likely short loans)
// Keep apps=0 entries (data missing but stint was real)
function qualifyingClubs(player: Player): Player['career_clubs'] {
  const seen = new Set<string>()
  return player.career_clubs.filter(c => {
    const key = c.club.toLowerCase().trim()
    if (seen.has(key)) return false  // deduplicate same club
    if (c.apps > 0 && c.apps < 10) return false  // short loan/spell
    seen.add(key)
    return true
  })
}

export async function GET() {
  const now = new Date()
  const dateStr = now.toISOString().split("T")[0]

  // Pool: popular players with at least 3 qualifying clubs
  const pool = PLAYERS.filter(p => {
    const clubs = qualifyingClubs(p)
    return p.popularity_score > 500_000 && clubs.length >= 3
  })

  let seed = parseInt(dateStr.replace(/-/g, ""), 10)
  seed = lcg(seed + 7)
  seed = lcg(seed)

  const idx = seed % pool.length
  const player = pool[idx]
  const clubs = qualifyingClubs(player)

  return NextResponse.json({ player, clubs, dateStr })
}
