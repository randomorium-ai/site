import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { supabase } from "@/lib/holiday-bazaar/supabase"

export async function POST(req: NextRequest) {
  try {
    const { trip_name, organiser_name } = await req.json()

    if (!trip_name?.trim() || !organiser_name?.trim()) {
      return NextResponse.json(
        { error: "trip_name and organiser_name are required" },
        { status: 400 }
      )
    }

    const tripId = nanoid(8)

    // We need the organiser's member_id before inserting the trip
    // (trip.created_by references a member id), so we pre-generate it.
    const organiserId = crypto.randomUUID()

    // Insert trip
    const { error: tripError } = await supabase.from("trips").insert({
      id: tripId,
      name: trip_name.trim(),
      created_by: organiserId,
      status: "collecting",
    })

    if (tripError) {
      console.error("trips insert error", tripError)
      return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
    }

    // Insert organiser as first member
    const { error: memberError } = await supabase.from("members").insert({
      id: organiserId,
      trip_id: tripId,
      name: organiser_name.trim(),
      al_budget: null,
      departure_airports: [],
    })

    if (memberError) {
      console.error("members insert error", memberError)
      // Roll back the trip — best effort
      await supabase.from("trips").delete().eq("id", tripId)
      return NextResponse.json({ error: "Failed to create organiser" }, { status: 500 })
    }

    return NextResponse.json({
      trip_id: tripId,
      member_id: organiserId,
    })
  } catch (err) {
    console.error("trips route error", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
