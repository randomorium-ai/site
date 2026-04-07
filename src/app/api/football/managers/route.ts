import { NextRequest, NextResponse } from "next/server"
import managersData from "@/data/managers.json"
import type { ManagerRecord } from "@/lib/overlap"

const MANAGERS = managersData as unknown as ManagerRecord[]

export async function GET(req: NextRequest) {
  const search = (req.nextUrl.searchParams.get("search") ?? "").toLowerCase().trim()

  if (search.length < 2) {
    return NextResponse.json({ managers: [] })
  }

  const results = MANAGERS.filter(m =>
    m.name.toLowerCase().includes(search)
  ).slice(0, 10)

  return NextResponse.json({ managers: results })
}
