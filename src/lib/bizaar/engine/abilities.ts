// ── Ability Resolution Pipeline ──
// Runs on every board change. Always resolves from scratch (no incremental state).
//
// Pipeline:
//   1. RESET — Strip all modifiers, set currentStrength = baseStrength
//   2. PASSIVE ABILITIES — Apply buffs based on board state
//   3. ON_PLAY EFFECTS — Already applied when card was played (suppression flags, weaken)
//   4. Return modified cards (scoring + empires handled separately)

import type { CardInstance, RowState, Owner, SuppressionRecord } from './types'
import { ROW_TYPES } from './constants'
import type { RowType } from './types'

interface BoardSnapshot {
  rows: Record<RowType, RowState>
  suppressions: SuppressionRecord[]
}

function getCardsForOwner(row: RowState, owner: Owner): CardInstance[] {
  return owner === 'player' ? row.playerCards : row.opponentCards
}

function getOpponent(owner: Owner): Owner {
  return owner === 'player' ? 'opponent' : 'player'
}

function getTotalScore(rows: Record<RowType, RowState>, owner: Owner): number {
  let total = 0
  for (const rowType of ROW_TYPES) {
    const cards = getCardsForOwner(rows[rowType], owner)
    for (const card of cards) {
      total += card.currentStrength
    }
  }
  return total
}

export function resolveAbilities(board: BoardSnapshot): BoardSnapshot {
  const rows = structuredClone(board.rows)

  // ── Step 1: RESET all cards to base strength ──
  for (const rowType of ROW_TYPES) {
    for (const card of rows[rowType].playerCards) {
      card.currentStrength = card.baseStrength
    }
    for (const card of rows[rowType].opponentCards) {
      card.currentStrength = card.baseStrength
    }
  }

  // ── Step 2: Apply ON_PLAY weaken effects (persisted on the target cards) ──
  // weaken_strongest is applied at play time and reduces baseStrength on the target.
  // We already track this by modifying the target's baseStrength in GameEngine.playCard().
  // So after reset, weakened cards already have their reduced baseStrength.

  // ── Step 3: PASSIVE ABILITIES ──
  for (const rowType of ROW_TYPES) {
    const row = rows[rowType]
    for (const owner of ['player', 'opponent'] as Owner[]) {
      const friendlyCards = getCardsForOwner(row, owner)

      for (let i = 0; i < friendlyCards.length; i++) {
        const card = friendlyCards[i]
        if (!card.ability || card.ability.trigger !== 'passive') continue

        const effect = card.ability.effect

        switch (effect.type) {
          case 'adjacency_buff': {
            // +N to cards at position ±1 in same row, same owner
            if (i > 0) friendlyCards[i - 1].currentStrength += effect.value
            if (i < friendlyCards.length - 1) friendlyCards[i + 1].currentStrength += effect.value
            break
          }

          case 'row_buff': {
            // +N to all friendly cards in same row (including self)
            for (const target of friendlyCards) {
              if (target.instanceId !== card.instanceId) {
                target.currentStrength += effect.value
              }
            }
            break
          }

          case 'self_buff_per_ally': {
            // +N × (friendly count in row, excluding self)
            const allyCount = friendlyCards.length - 1
            card.currentStrength += effect.value * allyCount
            break
          }

          case 'self_buff_if_losing': {
            // +N if owner is currently losing on total score
            // We need to compute totals without this buff first, so we do a preliminary check
            const ownerTotal = getTotalScore(rows, owner)
            const oppTotal = getTotalScore(rows, getOpponent(owner))
            if (ownerTotal <= oppTotal) {
              card.currentStrength += effect.value
            }
            break
          }

          case 'burst_at_threshold': {
            // +N when threshold+ friendly cards in this row
            if (friendlyCards.length >= effect.threshold) {
              card.currentStrength += effect.value
            }
            break
          }
        }
      }
    }
  }

  // Ensure no card goes below 0 strength
  for (const rowType of ROW_TYPES) {
    for (const card of rows[rowType].playerCards) {
      card.currentStrength = Math.max(0, card.currentStrength)
    }
    for (const card of rows[rowType].opponentCards) {
      card.currentStrength = Math.max(0, card.currentStrength)
    }
  }

  return { rows, suppressions: board.suppressions }
}
