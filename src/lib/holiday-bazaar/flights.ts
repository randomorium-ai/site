import type { MemberWithAvailability, FlightResult, MemberFlight, FlightLeg, ALPatternId } from "./types"

// ── Destination catalogue (~50 short-break destinations) ─────────────────────

const DESTINATIONS = [
  { iata: "BCN", name: "Barcelona",    country: "Spain",       flag: "🇪🇸" },
  { iata: "AMS", name: "Amsterdam",    country: "Netherlands", flag: "🇳🇱" },
  { iata: "LIS", name: "Lisbon",       country: "Portugal",    flag: "🇵🇹" },
  { iata: "RAK", name: "Marrakech",    country: "Morocco",     flag: "🇲🇦" },
  { iata: "PRG", name: "Prague",       country: "Czech Rep.",  flag: "🇨🇿" },
  { iata: "BUD", name: "Budapest",     country: "Hungary",     flag: "🇭🇺" },
  { iata: "VIE", name: "Vienna",       country: "Austria",     flag: "🇦🇹" },
  { iata: "FCO", name: "Rome",         country: "Italy",       flag: "🇮🇹" },
  { iata: "NAP", name: "Naples",       country: "Italy",       flag: "🇮🇹" },
  { iata: "VCE", name: "Venice",       country: "Italy",       flag: "🇮🇹" },
  { iata: "ATH", name: "Athens",       country: "Greece",      flag: "🇬🇷" },
  { iata: "SKG", name: "Thessaloniki", country: "Greece",      flag: "🇬🇷" },
  { iata: "HER", name: "Heraklion",   country: "Greece",      flag: "🇬🇷" },
  { iata: "RHO", name: "Rhodes",       country: "Greece",      flag: "🇬🇷" },
  { iata: "CFU", name: "Corfu",        country: "Greece",      flag: "🇬🇷" },
  { iata: "DBV", name: "Dubrovnik",    country: "Croatia",     flag: "🇭🇷" },
  { iata: "SPU", name: "Split",        country: "Croatia",     flag: "🇭🇷" },
  { iata: "MAD", name: "Madrid",       country: "Spain",       flag: "🇪🇸" },
  { iata: "PMI", name: "Palma",        country: "Spain",       flag: "🇪🇸" },
  { iata: "IBZ", name: "Ibiza",        country: "Spain",       flag: "🇪🇸" },
  { iata: "AGP", name: "Málaga",       country: "Spain",       flag: "🇪🇸" },
  { iata: "ALC", name: "Alicante",     country: "Spain",       flag: "🇪🇸" },
  { iata: "TFS", name: "Tenerife",     country: "Spain",       flag: "🇪🇸" },
  { iata: "LPA", name: "Gran Canaria", country: "Spain",       flag: "🇪🇸" },
  { iata: "FAO", name: "Faro",         country: "Portugal",    flag: "🇵🇹" },
  { iata: "OPO", name: "Porto",        country: "Portugal",    flag: "🇵🇹" },
  { iata: "FNC", name: "Funchal",      country: "Portugal",    flag: "🇵🇹" },
  { iata: "NCE", name: "Nice",         country: "France",      flag: "🇫🇷" },
  { iata: "MRS", name: "Marseille",    country: "France",      flag: "🇫🇷" },
  { iata: "GVA", name: "Geneva",       country: "Switzerland", flag: "🇨🇭" },
  { iata: "ZRH", name: "Zürich",       country: "Switzerland", flag: "🇨🇭" },
  { iata: "CPH", name: "Copenhagen",   country: "Denmark",     flag: "🇩🇰" },
  { iata: "ARN", name: "Stockholm",    country: "Sweden",      flag: "🇸🇪" },
  { iata: "OSL", name: "Oslo",         country: "Norway",      flag: "🇳🇴" },
  { iata: "HEL", name: "Helsinki",     country: "Finland",     flag: "🇫🇮" },
  { iata: "WAW", name: "Warsaw",       country: "Poland",      flag: "🇵🇱" },
  { iata: "KRK", name: "Krakow",       country: "Poland",      flag: "🇵🇱" },
  { iata: "SOF", name: "Sofia",        country: "Bulgaria",    flag: "🇧🇬" },
  { iata: "BEG", name: "Belgrade",     country: "Serbia",      flag: "🇷🇸" },
  { iata: "RIX", name: "Riga",         country: "Latvia",      flag: "🇱🇻" },
  { iata: "TLL", name: "Tallinn",      country: "Estonia",     flag: "🇪🇪" },
  { iata: "LCA", name: "Larnaca",      country: "Cyprus",      flag: "🇨🇾" },
  { iata: "PFO", name: "Paphos",       country: "Cyprus",      flag: "🇨🇾" },
  { iata: "MLA", name: "Malta",        country: "Malta",       flag: "🇲🇹" },
  { iata: "IST", name: "Istanbul",     country: "Turkey",      flag: "🇹🇷" },
  { iata: "AYT", name: "Antalya",      country: "Turkey",      flag: "🇹🇷" },
  { iata: "DLM", name: "Dalaman",      country: "Turkey",      flag: "🇹🇷" },
  { iata: "BJV", name: "Bodrum",       country: "Turkey",      flag: "🇹🇷" },
  { iata: "BRU", name: "Brussels",     country: "Belgium",     flag: "🇧🇪" },
  { iata: "CMN", name: "Casablanca",   country: "Morocco",     flag: "🇲🇦" },
]

// ── AL patterns (mirrors scoring.ts) ─────────────────────────────────────────

const AL_PATTERNS = [
  { id: "SAT_SUN"      as ALPatternId, al_days: 0, nights: 2, depart_day: 6, return_day: 0 },
  { id: "THU_EVE_SUN"  as ALPatternId, al_days: 1, nights: 3, depart_day: 4, return_day: 0 },
  { id: "FRI_MORN_SUN" as ALPatternId, al_days: 1, nights: 2, depart_day: 5, return_day: 0 },
  { id: "FRI_EVE_SUN"  as ALPatternId, al_days: 0, nights: 2, depart_day: 5, return_day: 0 },
  { id: "FRI_EVE_MON"  as ALPatternId, al_days: 1, nights: 3, depart_day: 5, return_day: 1 },
  { id: "WED_EVE_SUN"  as ALPatternId, al_days: 2, nights: 4, depart_day: 3, return_day: 0 },
  { id: "THU_EVE_MON"  as ALPatternId, al_days: 2, nights: 4, depart_day: 4, return_day: 1 },
  { id: "FRI_MORN_MON" as ALPatternId, al_days: 2, nights: 3, depart_day: 5, return_day: 1 },
  { id: "WED_EVE_MON"  as ALPatternId, al_days: 3, nights: 5, depart_day: 3, return_day: 1 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

// Seeded pseudo-random — deterministic per (dep, dest, date) so results don't
// shuffle on every render.
function seededRand(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h ^= h << 13
    h ^= h >> 17
    h ^= h << 5
    return (h >>> 0) / 0xffffffff
  }
}

function randomPrice(rand: () => number, min: number, max: number): number {
  return Math.round((min + rand() * (max - min)) * 100) / 100
}

function formatTime(date: Date, hour: number, minute: number): string {
  const d = new Date(date)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// ── Mock flight leg generator ─────────────────────────────────────────────────

function mockLeg(
  dep: string,
  arr: string,
  date: Date,
  departHour: number,
  durationHours: number,
  price: number,
  flightNum: string
): FlightLeg {
  const depTime = formatTime(date, departHour, 0)
  const arrDate = new Date(date)
  arrDate.setHours(departHour + durationHours, 30, 0, 0)
  return {
    flight_number: flightNum,
    departure_iata: dep,
    arrival_iata: arr,
    departure_time: depTime,
    arrival_time: arrDate.toISOString(),
    price_gbp: price,
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface FlightSearchParams {
  window_start: string // YYYY-MM-DD
  window_end: string
  members: MemberWithAvailability[]
}

export function mockFlightSearch(params: FlightSearchParams): FlightResult[] {
  const { window_start, members } = params
  const departDate = new Date(window_start)
  const dow = departDate.getDay()

  const submitted = members.filter(
    m => m.date_ranges.length > 0 && m.al_budget !== null && m.departure_airports.length > 0
  )

  if (submitted.length === 0) return []

  // All patterns whose depart day matches and every member can afford
  const eligiblePatterns = AL_PATTERNS.filter(
    p => p.depart_day === dow && submitted.every(m => (m.al_budget ?? 0) >= p.al_days)
  )

  const results: FlightResult[] = []

  for (const pattern of eligiblePatterns) {
    const returnDate = new Date(departDate)
    returnDate.setDate(returnDate.getDate() + pattern.nights)
    const window_end = returnDate.toISOString().split('T')[0]

    for (const dest of DESTINATIONS) {
      const memberFlights: MemberFlight[] = []
      let totalCost = 0

      for (const member of submitted) {
        const depAirport = member.departure_airports[0]
        const seed = `${depAirport}-${dest.iata}-${window_start}-${member.id}-${pattern.id}`
        const rand = seededRand(seed)

        const isLongHaul = ["TFS", "LPA", "FNC", "CMN", "RAK", "AGA", "AYT", "DLM", "BJV", "IST", "LCA", "PFO"].includes(dest.iata)
        const isMedium = ["ATH", "SKG", "HER", "RHO", "CFU", "DBV", "SPU", "SOF", "BEG"].includes(dest.iata)

        const baseMin = isLongHaul ? 120 : isMedium ? 80 : 45
        const baseMax = isLongHaul ? 320 : isMedium ? 200 : 140

        const outPrice = randomPrice(rand, baseMin, baseMax)
        const inPrice = randomPrice(rand, baseMin * 0.9, baseMax * 0.9)
        const legPrice = outPrice + inPrice

        const durationHours = isLongHaul ? 4 : isMedium ? 3 : 2
        const departHour = pattern.id.includes("EVE") ? 19 : 7
        const airlines = ["FR", "U2", "BA", "EZY", "VY", "W6"]
        const airline = airlines[Math.floor(rand() * airlines.length)]
        const flightNum = `${airline}${Math.floor(1000 + rand() * 8999)}`
        const returnFlightNum = `${airline}${Math.floor(1000 + rand() * 8999)}`

        const outbound = mockLeg(depAirport, dest.iata, departDate, departHour, durationHours, outPrice, flightNum)
        const inbound = mockLeg(dest.iata, depAirport, returnDate, 14, durationHours, inPrice, returnFlightNum)

        memberFlights.push({
          member_id: member.id,
          outbound,
          inbound,
          al_days_used: pattern.al_days,
          price_gbp: legPrice,
          al_pattern: pattern.id,
        })

        totalCost += legPrice
      }

      results.push({
        destination_iata: dest.iata,
        destination_name: dest.name,
        destination_country: dest.country,
        destination_flag: dest.flag,
        window_start,
        window_end,
        nights: pattern.nights,
        al_days_required: pattern.al_days,
        per_member_flights: memberFlights,
        total_cost_gbp: Math.round(totalCost * 100) / 100,
        value_label: "standard",
      })
    }
  }

  // Value labels based on price percentiles
  const prices = results.map(r => r.total_cost_gbp).sort((a, b) => a - b)
  const p25 = prices[Math.floor(prices.length * 0.25)] ?? Infinity
  const p50 = prices[Math.floor(prices.length * 0.5)] ?? Infinity

  for (const r of results) {
    if (r.total_cost_gbp <= p25) r.value_label = "great"
    else if (r.total_cost_gbp <= p50) r.value_label = "good"
  }

  // Sort by price ascending
  results.sort((a, b) => a.total_cost_gbp - b.total_cost_gbp)

  return results
}
