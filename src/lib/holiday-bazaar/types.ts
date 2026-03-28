export type TripStatus = "collecting" | "searching" | "booked"

export interface Trip {
  id: string // 8-char nanoid slug
  name: string
  created_by: string // member_id of organiser
  created_at: string
  status: TripStatus
}

export interface Member {
  id: string // uuid
  trip_id: string
  name: string
  al_budget: number | null
  departure_airports: string[] // IATA codes, max 2
  account_id: string | null
  joined_at: string
}

export interface DateRange {
  id: string
  member_id: string
  start_date: string // ISO date string YYYY-MM-DD
  end_date: string
}

// Member with their date ranges attached — used in the live trip view
export interface MemberWithAvailability extends Member {
  date_ranges: DateRange[]
}

// A scored window of dates surfaced in the suggestions panel
export interface DateWindow {
  start_date: string
  end_date: string
  day_count: number
  available_member_ids: string[]
  unavailable_member_ids: string[]
  al_days_required: number // min AL days any member needs
  attendee_count: number
  quorum: "full" | "majority" | "minority" // >= 80% | >= 50% | < 50%
}

// ── AL Pattern types (Section 6.1) ────────────────────────────────────────

export type ALPatternId =
  | "SAT_SUN"
  | "THU_EVE_SUN"
  | "FRI_MORN_SUN"
  | "FRI_EVE_SUN"
  | "FRI_EVE_MON"
  | "WED_EVE_SUN"
  | "THU_EVE_MON"
  | "FRI_MORN_MON"
  | "WED_EVE_MON"

export interface ALPattern {
  id: ALPatternId
  al_days: number
  nights: number
  depart_day: number // 0 = Sun, 1 = Mon, ... 6 = Sat
  depart_after_work: boolean // true = must depart >= 18:00
  return_day: number
}

// ── Flight result types (ephemeral, not persisted) ────────────────────────

export interface FlightLeg {
  flight_number: string
  departure_iata: string
  arrival_iata: string
  departure_time: string // ISO datetime
  arrival_time: string
  price_gbp: number
}

export interface MemberFlight {
  member_id: string
  outbound: FlightLeg
  inbound: FlightLeg
  al_days_used: number
  price_gbp: number
  al_pattern: ALPatternId
}

export interface FlightResult {
  destination_iata: string
  destination_name: string
  destination_country: string
  destination_flag: string
  window_start: string
  window_end: string
  nights: number
  al_days_required: number // AL days every member needs for this result
  per_member_flights: MemberFlight[]
  total_cost_gbp: number
  value_label: "great" | "good" | "standard"
}

// ── Guest session (localStorage) ─────────────────────────────────────────

export interface GuestSession {
  member_id: string
  trip_id: string
  expires_at: string // ISO datetime, 7 days from creation
}
