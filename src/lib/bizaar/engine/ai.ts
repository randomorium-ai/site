// ── Bizaar AI (v1 — simple heuristics) ──
// Evaluates all legal moves and picks the highest-scored one.
// No lookahead, no search tree — just greedy heuristics with noise.

import type { MatchState, CardInstance, RowType, AIMove } from './types'
import { ROW_TYPES } from './constants'
import { EMPIRE_DEFINITIONS } from './empires'
import { scoreBoard } from './scoring'

interface ScoredMove {
  card: CardInstance
  row: RowType
  score: number
  reasoning: string
}

function getEmpireProgress(
  state: MatchState,
  row: RowType,
  owner: 'player' | 'opponent'
): { empire: typeof EMPIRE_DEFINITIONS[0] | null; present: number; required: number } {
  const empire = EMPIRE_DEFINITIONS.find((e) => e.rowType === row)
  if (!empire) return { empire: null, present: 0, required: 0 }

  const cards = owner === 'player'
    ? state.board.rows[row].playerCards
    : state.board.rows[row].opponentCards
  const ids = new Set(cards.map((c) => c.definitionId))
  const present = empire.requiredCards.filter((id) => ids.has(id)).length

  return { empire, present, required: empire.requiredCards.length }
}

function evaluateMove(state: MatchState, card: CardInstance, row: RowType): ScoredMove {
  let score = card.baseStrength
  const reasons: string[] = [`base:${card.baseStrength}`]

  // Empire progress bonus
  const progress = getEmpireProgress(state, row, 'opponent')
  if (progress.empire) {
    const isEmpireCard = progress.empire.requiredCards.includes(card.definitionId)
    if (isEmpireCard) {
      if (progress.present === progress.required - 1) {
        score += 50
        reasons.push('completes empire!')
      } else if (progress.present >= 1) {
        score += 20
        reasons.push('empire progress')
      }
    }
  }

  // Adjacency value: bonus if placed next to friendly buffing cards
  const opponentCardsInRow = state.board.rows[row].opponentCards
  for (const existing of opponentCardsInRow) {
    if (existing.ability?.effect.type === 'adjacency_buff') {
      score += existing.ability.effect.value
      reasons.push(`adj buff from ${existing.name}`)
    }
  }

  // Row buff value: existing row_buff cards make new cards stronger
  for (const existing of opponentCardsInRow) {
    if (existing.ability?.effect.type === 'row_buff') {
      score += existing.ability.effect.value
      reasons.push(`row buff from ${existing.name}`)
    }
  }

  // Disruption bonus: Highwayman against player empire progress
  if (card.ability?.effect.type === 'suppress_row') {
    const playerProgress = getEmpireProgress(state, card.ability.effect.targetRow, 'player')
    if (playerProgress.present >= 2) {
      score += 30
      reasons.push('disrupts player empire')
    }
  }

  // Weaken bonus
  if (card.ability?.effect.type === 'weaken_strongest') {
    const playerCards = state.board.rows[row].playerCards
    if (playerCards.length > 0) {
      const strongest = Math.max(...playerCards.map((c) => c.currentStrength))
      score += Math.min(strongest, card.ability.effect.value) * 2
      reasons.push('weakens opponent')
    }
  }

  // Random noise to avoid predictability
  score += Math.random() * 6 - 3

  return { card, row, score, reasoning: reasons.join(', ') }
}

export function getAIMove(state: MatchState): AIMove {
  const hand = state.opponentHand

  // Generate all legal moves
  const moves: ScoredMove[] = []
  for (const card of hand) {
    // Cards can only go in their matching row
    if (ROW_TYPES.includes(card.rowType)) {
      moves.push(evaluateMove(state, card, card.rowType))
    }
  }

  // Pass decision
  const scored = scoreBoard(state.board.rows, state.suppressions)
  const opponentTotal = scored.opponentTotal
  const playerTotal = scored.playerTotal
  const leading = opponentTotal > playerTotal
  const leadMargin = opponentTotal - playerTotal

  const shouldPass =
    hand.length === 0 ||
    (leading && hand.length < state.playerHand.length && leadMargin > 5) ||
    (leading && leadMargin > 15 && state.playerPassed) ||
    (state.playerPassed && leading)

  if (shouldPass || moves.length === 0) {
    return {
      action: { type: 'PASS' },
      score: 0,
      reasoning: hand.length === 0 ? 'no cards' : 'strategic pass (winning)',
    }
  }

  // Pick best move
  moves.sort((a, b) => b.score - a.score)
  const best = moves[0]

  return {
    action: {
      type: 'PLAY_CARD',
      cardInstanceId: best.card.instanceId,
      targetRow: best.row,
    },
    score: best.score,
    reasoning: best.reasoning,
  }
}
