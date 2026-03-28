import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/holiday-bazaar/supabase"
import { mockFlightSearch } from "@/lib/holiday-bazaar/flights"
import type { MemberWithAvailability } from "@/lib/holiday-bazaar/types"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tripId = searchParams.get("trip_id")
    const windowStart = searchParams.get("window_start")
    const windowEnd = searchParams.get("window_end")

    if (!tripId || !windowStart || !windowEnd) {
      return NextResponse.json(
        { error: "trip_id, window_start, and window_end are required" },
        { status: 400 }
      )
    }

    // Verify trip exists
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id")
      .eq("id", tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Fetch members with their date ranges
    const { data: membersData, error: membersError } = await supabase
      .from("members")
      .select("*, date_ranges(*)")
      .eq("trip_id", tripId)
      .order("joined_at", { ascending: true })

    if (membersError) {
      console.error("members fetch error", membersError)
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    }

    const members = (membersData as MemberWithAvailability[]) ?? []

    const results = mockFlightSearch({
      window_start: windowStart,
      window_end: windowEnd,
      members,
    })

    return NextResponse.json({ results })
  } catch (err) {
    console.error("flights route error", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
