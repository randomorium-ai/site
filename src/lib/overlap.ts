// Club overlap calculation for Six Degrees of Separation.
// Single source of truth for all year-range logic.

import type { Player } from './player'

const CURRENT_YEAR = 2025

// ── Club name normalisation ────────────────────────────────────────────────────
// Strips suffixes (F.C., A.C., CF, etc.), parentheticals, diacritics, and
// reserve-team indicators so "Arsenal F.C." matches "Arsenal".

export function normClub(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')          // strip diacritics
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')               // remove (loan), (on loan), etc.
    .replace(/[–—-]/g, ' ')                   // hyphens/dashes → space
    .replace(/\./g, '')                        // remove dots: F.C. → FC, A.C. → AC
    .replace(/\b(fc|afc|wfc|rfc|sc|bsc|cf|nk|sk|if|bk|fk|mk|us|as|ac|ss)\b/g, ' ')
    .replace(/\s+(b|c|ii|2|castilla|atletic|atlètic|reserves?|youth|u21|u23)\s*$/i, ' ')
    .replace(/[^a-z0-9\s]/g, '')              // strip remaining punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Overlap types ──────────────────────────────────────────────────────────────

export interface ClubOverlap {
  club: string       // display name (from playerA's career data)
  fromYear: number   // first year of overlap
  toYear: number     // exclusive end year (overlap is [from, to))
  seasons: number    // number of seasons
  approximate: boolean  // true if either player is still at the club (to=null)
}

function effectiveTo(to: number | null): number {
  return to ?? CURRENT_YEAR
}

// ── Club teammate overlap ──────────────────────────────────────────────────────
// Returns the longest period both players were at the same club.
// If targetClub is provided, only that club is checked.

export function calculateClubOverlap(
  playerA: Player,
  playerB: Player,
  targetClub?: string,
): ClubOverlap | null {
  const normTarget = targetClub ? normClub(targetClub) : null
  let bestOverlap: ClubOverlap | null = null

  for (const clubA of playerA.career_clubs) {
    const normA = normClub(clubA.club)
    if (normTarget && normA !== normTarget) continue
    // Skip reserve/B/youth teams
    if (/\b(b|c|ii|2|castilla|atletic|reserves?|youth|u21|u23)\b/.test(normA)) continue

    for (const clubB of playerB.career_clubs) {
      if (normClub(clubB.club) !== normA) continue

      const fromYear = Math.max(clubA.from, clubB.from)
      const toYear = Math.min(effectiveTo(clubA.to), effectiveTo(clubB.to))
      if (fromYear >= toYear) continue

      const seasons = toYear - fromYear
      if (!bestOverlap || seasons > bestOverlap.seasons) {
        bestOverlap = {
          club: clubA.club,
          fromYear,
          toYear,
          seasons,
          approximate: clubA.to === null || clubB.to === null,
        }
      }
    }
  }

  return bestOverlap
}

// ── Manager stint type (mirrors managers.json schema) ─────────────────────────

export interface ManagerStint {
  club: string
  from: number
  to: number | null
}

export interface ManagerRecord {
  id: string
  name: string
  stints: ManagerStint[]
}

// ── Shared-manager overlap ─────────────────────────────────────────────────────
// Returns the longest period both players were at the same club under the
// same manager.

export function calculateSharedManagerOverlap(
  playerA: Player,
  playerB: Player,
  manager: ManagerRecord,
): ClubOverlap | null {
  let bestOverlap: ClubOverlap | null = null

  for (const stint of manager.stints) {
    const normStintClub = normClub(stint.club)
    const stintTo = effectiveTo(stint.to)

    const clubA = playerA.career_clubs.find(c => normClub(c.club) === normStintClub)
    const clubB = playerB.career_clubs.find(c => normClub(c.club) === normStintClub)
    if (!clubA || !clubB) continue

    // 3-way overlap: playerA ∩ playerB ∩ manager stint
    const fromYear = Math.max(clubA.from, clubB.from, stint.from)
    const toYear = Math.min(effectiveTo(clubA.to), effectiveTo(clubB.to), stintTo)
    if (fromYear >= toYear) continue

    const seasons = toYear - fromYear
    if (!bestOverlap || seasons > bestOverlap.seasons) {
      bestOverlap = {
        club: stint.club,
        fromYear,
        toYear,
        seasons,
        approximate: clubA.to === null || clubB.to === null || stint.to === null,
      }
    }
  }

  return bestOverlap
}

// ── Format helpers ─────────────────────────────────────────────────────────────

export function seasonStr(year: number): string {
  return `${year}/${String(year + 1).slice(-2)}`
}

// Formats [fromYear, toYear) as "2002/03" or "2002/03–2005/06"
export function formatOverlapYears(from: number, to: number): string {
  if (to - from === 1) return seasonStr(from)
  return `${seasonStr(from)}–${seasonStr(to - 1)}`
}
