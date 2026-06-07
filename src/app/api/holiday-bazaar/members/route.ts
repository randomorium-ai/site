import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/holiday-bazaar/supabase"

export async function POST(req: NextRequest) {
  try {
    const {
      trip_id,
      member_id,
      name,
      al_budget,
      departure_airports,
      date_ranges,
    } = await req.json()

    // Validate required fields
    if (!trip_id?.trim()) {
      return NextResponse.json({ error: "trip_id is required" }, { status: 400 })
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }
    if (typeof al_budget !== "number" || al_budget < 0 || al_budget > 10) {
      return NextResponse.json({ error: "al_budget must be a number between 0 and 10" }, { status: 400 })
    }
    if (!Array.isArray(departure_airports) || departure_airports.length === 0 || departure_airports.length > 2) {
      return NextResponse.json({ error: "departure_airports must be an array of 1-2 IATA codes" }, { status: 400 })
    }
    if (!Array.isArray(date_ranges) || date_ranges.length === 0) {
      return NextResponse.json({ error: "at least one date_range is required" }, { status: 400 })
    }

    // Verify trip exists
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id")
      .eq("id", trip_id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    let resolvedMemberId: string

    if (member_id) {
      // Update existing member — .eq("trip_id") verifies ownership in the same query
      const { data: updated, error: updateErr } = await supabase
        .from("members")
        .update({ name: name.trim(), al_budget, departure_airports })
        .eq("id", member_id)
        .eq("trip_id", trip_id)
        .select("id")
        .single()

      if (updateErr || !updated) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 })
      }

      // Replace date ranges
      await supabase.from("date_ranges").delete().eq("member_id", member_id)

      resolvedMemberId = member_id
    } else {
      // Insert new member
      resolvedMemberId = crypto.randomUUID()
      const { error: memberError } = await supabase.from("members").insert({
        id: resolvedMemberId,
        trip_id,
        name: name.trim(),
        al_budget,
        departure_airports,
      })

      if (memberError) {
        console.error("members insert error", memberError)
        return NextResponse.json({ error: "Failed to add member" }, { status: 500 })
      }
    }

    // Insert date ranges
    const rangeRows = date_ranges.map((r: { start_date: string; end_date: string }) => ({
      member_id: resolvedMemberId,
      start_date: r.start_date,
      end_date: r.end_date,
    }))

    const { error: rangesError } = await supabase.from("date_ranges").insert(rangeRows)

    if (rangesError) {
      console.error("date_ranges insert error", rangesError)
      if (!member_id) {
        await supabase.from("members").delete().eq("id", resolvedMemberId)
      }
      return NextResponse.json({ error: "Failed to save date ranges" }, { status: 500 })
    }

    return NextResponse.json({ member_id: resolvedMemberId })
  } catch (err) {
    console.error("members route error", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
