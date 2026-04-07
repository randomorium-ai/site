import { NextRequest, NextResponse } from "next/server"
import { searchClubs } from "@/lib/player-search"

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? ""
  const clubs = searchClubs(search, 20)
  return NextResponse.json({ clubs })
}
