import { NextResponse } from "next/server"
import teamsheetsData from "@/data/teamsheets.json"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEAMSHEETS = teamsheetsData as any[]

function lcg(seed: number): number {
  return (Math.imul((seed ^ (seed >>> 16)) + 0x9e3779b9, 0x45d9f3b) >>> 0)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')
  const dateStr = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : new Date().toISOString().split("T")[0]

  let seed = parseInt(dateStr.replace(/-/g, ""), 10)
  // Offset seed for teamsheet game to rotate differently from other games
  seed = lcg(seed + 3)
  seed = lcg(seed)

  const idx = seed % TEAMSHEETS.length
  const match = TEAMSHEETS[idx]

  return NextResponse.json({ match, dateStr })
}
