import { NextResponse } from "next/server"
import type { Player } from "@/lib/player"
import playersData from "@/data/players.json"
import { calculateClubOverlap, formatOverlapYears } from "@/lib/overlap"

const PLAYERS = playersData as unknown as Player[]
const playerMap = new Map<string, Player>(PLAYERS.map(p => [p.id, p]))

export interface OptimalPathStep {
  player: Player
  entity: string
  evidence: string
}

// ── Build adjacency graph at module load ──────────────────────────────────────
// Uses inverted club index to efficiently find all player pairs who share a club.

type Edge = { toId: string; entity: string; evidence: string }
const adj = new Map<string, Edge[]>()

function normClubSimple(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[–—-]/g, " ")
    .replace(/\./g, "")
    .replace(/\b(fc|afc|wfc|rfc|sc|bsc|cf|nk|sk|if|bk|fk|mk|us|as|ac|ss)\b/g, " ")
    .replace(/\s+(b|c|ii|2|castilla|atletic|reserves?|youth|u21|u23)\s*$/i, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

;(function buildGraph() {
  // Inverted index: normClub → playerIds
  const clubIndex = new Map<string, string[]>()
  for (const p of PLAYERS) {
    const seen = new Set<string>()
    for (const stint of (p.career_clubs ?? [])) {
      const key = normClubSimple(stint.club)
      if (seen.has(key)) continue
      seen.add(key)
      if (!clubIndex.has(key)) clubIndex.set(key, [])
      clubIndex.get(key)!.push(p.id)
    }
  }

  // For each club, build edges between all players who played there
  const seenPairs = new Set<string>()
  for (const playerIds of clubIndex.values()) {
    if (playerIds.length < 2) continue
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const aId = playerIds[i], bId = playerIds[j]
        const pairKey = aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`
        if (seenPairs.has(pairKey)) continue
        seenPairs.add(pairKey)

        const pA = playerMap.get(aId), pB = playerMap.get(bId)
        if (!pA || !pB) continue
        const overlap = calculateClubOverlap(pA, pB)
        if (!overlap) continue

        const seasons = formatOverlapYears(overlap.fromYear, overlap.toYear)
        const evidence = `Both at ${overlap.club}, ${seasons}${overlap.approximate ? "*" : ""}`
        const entity = overlap.club

        if (!adj.has(aId)) adj.set(aId, [])
        if (!adj.has(bId)) adj.set(bId, [])
        adj.get(aId)!.push({ toId: bId, entity, evidence })
        adj.get(bId)!.push({ toId: aId, entity, evidence })
      }
    }
  }
})()

// ── BFS ───────────────────────────────────────────────────────────────────────

function bfs(aId: string, bId: string): OptimalPathStep[] | null {
  if (aId === bId) return []
  const MAX_DEPTH = 6

  // parent map: playerId → { fromId, edge }
  const parent = new Map<string, { fromId: string; edge: Edge }>()
  const visited = new Set<string>([aId])
  let frontier = [aId]

  for (let depth = 0; depth < MAX_DEPTH && frontier.length > 0; depth++) {
    const next: string[] = []
    for (const nodeId of frontier) {
      for (const edge of (adj.get(nodeId) ?? [])) {
        if (visited.has(edge.toId)) continue
        visited.add(edge.toId)
        parent.set(edge.toId, { fromId: nodeId, edge })
        if (edge.toId === bId) {
          // Reconstruct path
          const path: OptimalPathStep[] = []
          let cur = bId
          while (cur !== aId) {
            const p = parent.get(cur)!
            const player = playerMap.get(cur)
            if (!player) return null
            path.unshift({ player, entity: p.edge.entity, evidence: p.edge.evidence })
            cur = p.fromId
          }
          return path
        }
        next.push(edge.toId)
      }
    }
    frontier = next
  }

  return null
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const aId = searchParams.get("aId")
  const bId = searchParams.get("bId")

  if (!aId || !bId) {
    return NextResponse.json({ error: "Missing aId or bId" }, { status: 400 })
  }

  if (!playerMap.has(aId) || !playerMap.has(bId)) {
    return NextResponse.json({ path: null })
  }

  const path = bfs(aId, bId)
  return NextResponse.json({ path })
}
