import { NextRequest, NextResponse } from "next/server"
import { findPlayerById } from "@/lib/player-search"
import {
  calculateClubOverlap,
  calculateSharedManagerOverlap,
  formatOverlapYears,
  type ManagerRecord,
} from "@/lib/overlap"
import managersData from "@/data/managers.json"
import type { Player } from "@/lib/player"

const MANAGERS = managersData as unknown as ManagerRecord[]

function findManager(id: string): ManagerRecord | undefined {
  return MANAGERS.find(m => m.id === id || m.name.toLowerCase() === id.toLowerCase())
}

function wasActiveInYear(player: Player, year: number): boolean {
  if (!player.career_clubs || player.career_clubs.length === 0) return false
  return player.career_clubs.some(c => c.from <= year && (c.to === null || c.to >= year))
}

interface RequestBody {
  playerAId: string
  playerBId: string
  linkType: "club" | "international" | "manager"
  entity: string  // club name | country | manager id/name
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { playerAId, playerBId, linkType, entity } = body

  // ── International: both must be same nationality + active in tournament year ─
  if (linkType === "international") {
    const playerA = findPlayerById(playerAId)
    const playerB = findPlayerById(playerBId)
    if (!playerA || !playerB) {
      return NextResponse.json({ valid: true, evidence: null })
    }

    // Parse tournament year from entity string e.g. "World Cup 2018" → 2018
    const yearMatch = entity.match(/(\d{4})/)
    const tournamentYear = yearMatch ? parseInt(yearMatch[1]) : null

    // Both must share the same nationality
    if (playerA.nationality !== playerB.nationality) {
      return NextResponse.json({
        valid: false,
        evidence: null,
        reason: `${playerA.name} (${playerA.nationality}) and ${playerB.name} (${playerB.nationality}) play for different national teams`,
      })
    }

    // Both must have been active in the tournament year
    if (tournamentYear) {
      const aActive = wasActiveInYear(playerA, tournamentYear)
      const bActive = wasActiveInYear(playerB, tournamentYear)
      if (!aActive) {
        return NextResponse.json({
          valid: false,
          evidence: null,
          reason: `${playerA.name} wasn't active in ${tournamentYear}`,
        })
      }
      if (!bActive) {
        return NextResponse.json({
          valid: false,
          evidence: null,
          reason: `${playerB.name} wasn't active in ${tournamentYear}`,
        })
      }
    }

    return NextResponse.json({
      valid: true,
      evidence: `Both played for ${playerA.nationality} at ${entity}`,
    })
  }

  // ── Manager: both players managed by entity at same club/time ─────────────
  if (linkType === "manager") {
    const playerA = findPlayerById(playerAId)
    const playerB = findPlayerById(playerBId)
    if (!playerA || !playerB) {
      return NextResponse.json({ valid: true, evidence: null })
    }

    const manager = findManager(entity)
    if (!manager) {
      // Unknown manager — honor system
      return NextResponse.json({
        valid: true,
        evidence: `Both managed by ${entity} (unverified)`,
      })
    }

    const overlap = calculateSharedManagerOverlap(playerA, playerB, manager)
    if (overlap) {
      const seasons = formatOverlapYears(overlap.fromYear, overlap.toYear)
      return NextResponse.json({
        valid: true,
        evidence: `Both at ${overlap.club} under ${manager.name}, ${seasons}${overlap.approximate ? '*' : ''}`,
      })
    }

    return NextResponse.json({
      valid: false,
      evidence: null,
      reason: `${playerA.name} and ${playerB.name} were never at the same club under ${manager.name} at the same time`,
    })
  }

  // ── Club: must have shared a club with year overlap ────────────────────────
  if (linkType === "club") {
    const playerA = findPlayerById(playerAId)
    const playerB = findPlayerById(playerBId)

    if (!playerA || !playerB) {
      // Unknown player — accept on honor system
      return NextResponse.json({ valid: true, evidence: null })
    }

    const targetClub = entity || undefined
    const overlap = calculateClubOverlap(playerA, playerB, targetClub)

    if (overlap) {
      const seasons = formatOverlapYears(overlap.fromYear, overlap.toYear)
      return NextResponse.json({
        valid: true,
        evidence: `Both at ${overlap.club}, ${seasons}${overlap.approximate ? '*' : ''}`,
      })
    }

    const reason = targetClub
      ? `${playerA.name} and ${playerB.name} never played at ${targetClub} at the same time`
      : `${playerA.name} and ${playerB.name} never played at the same club`

    return NextResponse.json({ valid: false, evidence: null, reason })
  }

  return NextResponse.json({ error: "Unknown link type" }, { status: 400 })
}
