// ── Bizaar AI (v2 — round-aware heuristics) ──
// Evaluates all legal moves and picks the highest-scored one.
// No lookahead, no search tree — greedy heuristics with round awareness and reduced noise.

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

// Determine round strategy based on history
function getRoundStrategy(state: MatchState): 'conservative' | 'aggressive' | 'normal' {
  if (state.roundHistory.length === 0) return 'normal' // Round 1
  const lastRound = state.roundHistory[state.roundHistory.length - 1]
  if (lastRound.winner === 'opponent') {
    // AI won round 1 → play conservatively round 2
    return 'conservative'
  } else if (lastRound.winner === 'player') {
    // AI lost round 1 → commit harder round 2
    return 'aggressive'
  }
  return 'normal'
}

function evaluateMove(state: MatchState, card: CardInstance, row: RowType, strategy: string): ScoredMove {
  let score = card.baseStrength
  const reasons: string[] = [`base:${card.baseStrength}`]

  // Empire progress bonus
  const progress = getEmpireProgress(state, row, 'opponent')
  if (progress.empire) {
    const isEmpireCard = progress.empire.requiredCards.includes(card.definitionId)
    if (isEmpireCard) {
      if (progress.present === progress.required - 1) {
        // Completing empire — high priority, especially in aggressive mode
        const bonus = strategy === 'aggressive' ? 60 : 50
        score += bonus
        reasons.push('completes empire!')
      } else if (progress.present >= 1) {
        score += 25
        reasons.push('empire progress')
      } else {
        // Starting an empire — slight bonus
        score += 8
        reasons.push('empire start')
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

  // Card's own ability value
  if (card.ability) {
    const eff = card.ability.effect
    if (eff.type === 'row_buff') {
      // Row buff is more valuable with more allies
      score += eff.value * opponentCardsInRow.length
      reasons.push(`own row buff (${opponentCardsInRow.length} allies)`)
    } else if (eff.type === 'self_buff_per_ally') {
      score += eff.value * opponentCardsInRow.length
      reasons.push(`per-ally buff (${opponentCardsInRow.length} allies)`)
    } else if (eff.type === 'burst_at_threshold') {
      if (opponentCardsInRow.length >= eff.threshold - 1) {
        score += eff.value
        reasons.push('burst threshold met')
      }
    } else if (eff.type === 'self_buff_if_losing') {
      const scored = scoreBoard(state.board.rows, state.suppressions)
      if (scored.opponentTotal <= scored.playerTotal) {
        score += eff.value
        reasons.push('losing buff active')
      }
    }
  }

  // Disruption bonus: Highwayman against player empire progress
  if (card.ability?.effect.type === 'suppress_row') {
    const playerProgress = getEmpireProgress(state, card.ability.effect.targetRow, 'player')
    if (playerProgress.present >= 2) {
      score += 35
      reasons.push('disrupts player empire')
    } else if (playerProgress.present >= 1) {
      score += 10
      reasons.push('early disruption')
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

  // Strategy modifier
  if (strategy === 'conservative') {
    // Prefer lower-strength cards (save strong ones)
    score -= card.baseStrength * 0.3
    reasons.push('conservative round')
  } else if (strategy === 'aggressive') {
    score += card.baseStrength * 0.2
    reasons.push('aggressive round')
  }

  // Reduced random noise (±1 instead of ±3) for more consistent play
  score += Math.random() * 2 - 1

  return { card, row, score, reasoning: reasons.join(', ') }
}

export function getAIMove(state: MatchState): AIMove {
  const hand = state.opponentHand
  const strategy = getRoundStrategy(state)

  // Generate all legal moves
  const moves: ScoredMove[] = []
  for (const card of hand) {
    // Cards can only go in their matching row
    if (ROW_TYPES.includes(card.rowType)) {
      moves.push(evaluateMove(state, card, card.rowType, strategy))
    }
  }

  // Pass decision
  const scored = scoreBoard(state.board.rows, state.suppressions)
  const opponentTotal = scored.opponentTotal
  const playerTotal = scored.playerTotal
  const leading = opponentTotal > playerTotal
  const leadMargin = opponentTotal - playerTotal

  // Smarter pass logic
  const shouldPass =
    hand.length === 0 ||
    // Player passed and AI ahead → pass immediately (don't waste cards)
    (state.playerPassed && leading) ||
    // Leading comfortably with fewer cards → pass to save cards
    (leading && hand.length < state.playerHand.length && leadMargin > 5) ||
    // Leading by a lot and opponent passed → definitely pass
    (leading && leadMargin > 15 && state.playerPassed) ||
    // Conservative strategy: pass early if ahead
    (strategy === 'conservative' && leading && leadMargin > 3 && state.playerPassed)

  if (shouldPass || moves.length === 0) {
    return {
      action: { type: 'PASS' },
      score: 0,
      reasoning: hand.length === 0 ? 'no cards' : `strategic pass (${strategy}, leading by ${leadMargin})`,
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
