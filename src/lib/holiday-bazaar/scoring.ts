import type { MemberWithAvailability, DateWindow } from "./types"

// ── AL Patterns (spec Section 6.1) ───────────────────────────────────────────
// depart_day: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

const AL_PATTERNS = [
  { id: "SAT_SUN",      al_days: 0, nights: 2, depart_day: 6, return_day: 0 },
  { id: "THU_EVE_SUN",  al_days: 1, nights: 3, depart_day: 4, return_day: 0 },
  { id: "FRI_MORN_SUN", al_days: 1, nights: 2, depart_day: 5, return_day: 0 },
  { id: "FRI_EVE_MON",  al_days: 1, nights: 3, depart_day: 5, return_day: 1 },
  { id: "WED_EVE_SUN",  al_days: 2, nights: 4, depart_day: 3, return_day: 0 },
  { id: "THU_EVE_MON",  al_days: 2, nights: 4, depart_day: 4, return_day: 1 },
  { id: "FRI_MORN_MON", al_days: 2, nights: 3, depart_day: 5, return_day: 1 },
  { id: "WED_EVE_MON",  al_days: 3, nights: 5, depart_day: 3, return_day: 1 },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function toISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function dayOfWeek(date: Date): number {
  return date.getDay() // 0=Sun…6=Sat
}

function isMemberAvailable(
  member: MemberWithAvailability,
  start: Date,
  end: Date
): boolean {
  const s = toISO(start)
  const e = toISO(end)
  return member.date_ranges.some(
    (r) => r.start_date <= s && r.end_date >= e
  )
}

// ── Best AL pattern for a member given a depart date ─────────────────────────

function bestPatternForMember(
  member: MemberWithAvailability,
  departDate: Date
): { al_days: number; nights: number } | null {
  const budget = member.al_budget ?? 0
  const dow = dayOfWeek(departDate)

  // Find all patterns that match the depart day of week and fit within budget
  const candidates = AL_PATTERNS.filter(
    (p) => p.depart_day === dow && p.al_days <= budget
  )

  if (candidates.length === 0) return null

  // Pick the one with most nights (best value)
  const best = candidates.reduce((a, b) => (a.nights >= b.nights ? a : b))
  return { al_days: best.al_days, nights: best.nights }
}

// ── Candidate depart dates within a member's availability ────────────────────

function candidateDepartDates(
  member: MemberWithAvailability,
  fromDate: Date,
  toDate: Date
): Date[] {
  const dates: Date[] = []
  const budget = member.al_budget ?? 0
  const validDows = new Set(
    AL_PATTERNS.filter((p) => p.al_days <= budget).map((p) => p.depart_day)
  )

  const cursor = new Date(fromDate)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(toDate)
  end.setHours(0, 0, 0, 0)

  while (cursor <= end) {
    if (validDows.has(dayOfWeek(cursor) as 3 | 4 | 5 | 6)) {
      dates.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

// ── Score all possible windows for a group ────────────────────────────────────

export function scoreWindows(
  members: MemberWithAvailability[],
  lookAheadDays = 180
): DateWindow[] {
  const submitted = members.filter(
    (m) =>
      m.date_ranges.length > 0 &&
      m.al_budget !== null &&
      m.departure_airports.length > 0
  )

  if (submitted.length < 2) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const horizon = addDays(today, lookAheadDays)

  // Collect all candidate windows across all members
  const windowMap = new Map<string, DateWindow>()

  for (const member of submitted) {
    for (const range of member.date_ranges) {
      const rangeStart = new Date(range.start_date)
      const rangeEnd = new Date(range.end_date)
      if (rangeEnd < today || rangeStart > horizon) continue

      const effectiveStart = rangeStart < today ? today : rangeStart

      // For each valid depart date in this member's range
      const departs = candidateDepartDates(member, effectiveStart, rangeEnd)

      for (const depart of departs) {
        const pattern = bestPatternForMember(member, depart)
        if (!pattern) continue

        const returnDate = addDays(depart, pattern.nights)
        if (returnDate > horizon) continue

        const windowKey = `${toISO(depart)}__${toISO(returnDate)}`

        if (!windowMap.has(windowKey)) {
          // Score this window against all submitted members
          const availableIds: string[] = []
          const unavailableIds: string[] = []
          let minAlDays = Infinity

          for (const m of submitted) {
            if (isMemberAvailable(m, depart, returnDate)) {
              availableIds.push(m.id)
              const p = bestPatternForMember(m, depart)
              const alUsed = p?.al_days ?? 0
              if (alUsed < minAlDays) minAlDays = alUsed
            } else {
              unavailableIds.push(m.id)
            }
          }

          const attendeeCount = availableIds.length
          const ratio = attendeeCount / submitted.length
          const quorum: DateWindow["quorum"] =
            ratio >= 0.8 ? "full" : ratio >= 0.5 ? "majority" : "minority"

          if (quorum === "minority") continue // spec: only surface >= 50%

          windowMap.set(windowKey, {
            start_date: toISO(depart),
            end_date: toISO(returnDate),
            day_count: pattern.nights + 1,
            available_member_ids: availableIds,
            unavailable_member_ids: unavailableIds,
            al_days_required: minAlDays === Infinity ? 0 : minAlDays,
            attendee_count: attendeeCount,
            quorum,
          })
        }
      }
    }
  }

  // Sort: most attendees first, then fewest AL days required, then earliest
  const windows = Array.from(windowMap.values())
  windows.sort((a, b) => {
    if (b.attendee_count !== a.attendee_count)
      return b.attendee_count - a.attendee_count
    if (a.al_days_required !== b.al_days_required)
      return a.al_days_required - b.al_days_required
    return a.start_date.localeCompare(b.start_date)
  })

  // Deduplicate: only keep the best window per weekend block
  // (same return date but different depart days can produce near-duplicate windows)
  const seen = new Set<string>()
  const deduped: DateWindow[] = []
  for (const w of windows) {
    // Key on return date + attendee set to collapse overlapping windows
    const dedupeKey = `${w.end_date}__${w.available_member_ids.sort().join(",")}`
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey)
      deduped.push(w)
    }
  }

  return deduped.slice(0, 20) // cap at 20 suggestions
}

// ── Format helpers for the UI ─────────────────────────────────────────────────

export function formatWindowDates(w: DateWindow): string {
  const start = new Date(w.start_date)
  const end = new Date(w.end_date)
  const startStr = start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  const endStr = end.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  return `${startStr} → ${endStr}`
}

export function windowNightsLabel(w: DateWindow): string {
  const n = w.day_count - 1
  return `${n} night${n === 1 ? "" : "s"}`
}
