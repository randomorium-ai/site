// ── Scoring ──
// Computes row scores and totals after abilities are resolved.
// Handles empire multiplier and suppression.

import type { RowState, Owner, EmpireStatus, SuppressionRecord } from './types'
import type { RowType } from './types'
import { ROW_TYPES, EMPIRE_MULTIPLIER } from './constants'
import { EMPIRE_DEFINITIONS } from './empires'
import { resolveAbilities } from './abilities'

interface ScoredBoard {
  rows: Record<RowType, RowState>
  empireStatuses: EmpireStatus[]
  playerTotal: number
  opponentTotal: number
}

function getCardsForOwner(row: RowState, owner: Owner) {
  return owner === 'player' ? row.playerCards : row.opponentCards
}

function detectEmpires(
  rows: Record<RowType, RowState>,
  suppressions: SuppressionRecord[]
): EmpireStatus[] {
  const statuses: EmpireStatus[] = []

  for (const empire of EMPIRE_DEFINITIONS) {
    for (const owner of ['player', 'opponent'] as Owner[]) {
      const cards = getCardsForOwner(rows[empire.rowType], owner)
      const presentIds = new Set(cards.map((c) => c.definitionId))
      const cardsPresent = empire.requiredCards.filter((id) => presentIds.has(id)).length

      const suppressed = suppressions.some(
        (s) => s.rowType === empire.rowType && s.target === owner
      )

      statuses.push({
        empireId: empire.id,
        owner,
        active: cardsPresent === empire.requiredCards.length && !suppressed,
        suppressed,
        cardsPresent,
        cardsRequired: empire.requiredCards.length,
      })
    }
  }

  return statuses
}

export function scoreBoard(
  rows: Record<RowType, RowState>,
  suppressions: SuppressionRecord[]
): ScoredBoard {
  // Step 1: Resolve all abilities from scratch
  const resolved = resolveAbilities({ rows, suppressions })
  const resolvedRows = resolved.rows

  // Step 2: Detect empires
  const empireStatuses = detectEmpires(resolvedRows, suppressions)

  // Step 3: Calculate row scores
  let playerTotal = 0
  let opponentTotal = 0

  for (const rowType of ROW_TYPES) {
    const row = resolvedRows[rowType]
    let pScore = 0
    let oScore = 0

    for (const card of row.playerCards) {
      pScore += card.currentStrength
    }
    for (const card of row.opponentCards) {
      oScore += card.currentStrength
    }

    // Apply empire multiplier
    const playerEmpire = empireStatuses.find(
      (e) => e.owner === 'player' && e.empireId === getEmpireForRow(rowType)?.id && e.active
    )
    const opponentEmpire = empireStatuses.find(
      (e) => e.owner === 'opponent' && e.empireId === getEmpireForRow(rowType)?.id && e.active
    )

    if (playerEmpire) pScore = Math.floor(pScore * EMPIRE_MULTIPLIER)
    if (opponentEmpire) oScore = Math.floor(oScore * EMPIRE_MULTIPLIER)

    row.playerScore = pScore
    row.opponentScore = oScore
    playerTotal += pScore
    opponentTotal += oScore
  }

  return {
    rows: resolvedRows,
    empireStatuses,
    playerTotal,
    opponentTotal,
  }
}

function getEmpireForRow(rowType: RowType) {
  return EMPIRE_DEFINITIONS.find((e) => e.rowType === rowType) ?? null
}
