import { NextRequest, NextResponse } from "next/server"
import { findPlayerById } from "@/lib/player-search"
import {
  calculateClubOverlap,
  calculateSharedManagerOverlap,
  formatOverlapYears,
  type ManagerRecord,
} from "@/lib/overlap"
import managersData from "@/data/managers.json"

const MANAGERS = managersData as unknown as ManagerRecord[]

function findManager(id: string): ManagerRecord | undefined {
  return MANAGERS.find(m => m.id === id || m.name.toLowerCase() === id.toLowerCase())
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

  // ── International: both must share the same nationality ───────────────────
  if (linkType === "international") {
    const playerA = findPlayerById(playerAId)
    const playerB = findPlayerById(playerBId)
    if (!playerA || !playerB) {
      // Unknown players — accept on honor system
      return NextResponse.json({ valid: true, evidence: null })
    }

    const normNat = (s: string) => s.toLowerCase().trim()
    const target = normNat(entity)

    const aMatch = normNat(playerA.nationality) === target
    const bMatch = normNat(playerB.nationality) === target

    if (aMatch && bMatch) {
      return NextResponse.json({
        valid: true,
        evidence: `Both played for ${entity}`,
      })
    }

    // If either player isn't in the DB, honor system
    const reason = !aMatch
      ? `${playerA.name} plays for ${playerA.nationality}, not ${entity}`
      : `${playerB.name} plays for ${playerB.nationality}, not ${entity}`

    return NextResponse.json({ valid: false, evidence: null, reason })
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
