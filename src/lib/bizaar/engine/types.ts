// ── Bizaar Game Types ──
// Pure type definitions. No runtime code, no React imports.

export type RowType = 'textiles' | 'spices' | 'treasures'

export type GamePhase =
  | 'MATCH_START'
  | 'ROUND_START'
  | 'TURN_PLAYER'
  | 'TURN_OPPONENT'
  | 'ROUND_END'
  | 'MATCH_END'

export type Owner = 'player' | 'opponent'

// ── Abilities ──

export type AbilityTrigger = 'passive' | 'on_play'

export type AbilityEffect =
  | { type: 'adjacency_buff'; value: number }
  | { type: 'row_buff'; value: number }
  | { type: 'self_buff_per_ally'; value: number }
  | { type: 'suppress_row'; targetRow: RowType }
  | { type: 'weaken_strongest'; value: number }
  | { type: 'self_buff_if_losing'; value: number }
  | { type: 'burst_at_threshold'; threshold: number; value: number }

export interface Ability {
  trigger: AbilityTrigger
  effect: AbilityEffect
  description: string
}

// ── Cards ──

export interface CardDefinition {
  id: string
  name: string
  baseStrength: number
  rowType: RowType
  ability: Ability | null
  flavourText: string
  tags: string[]
}

export interface CardInstance {
  instanceId: string
  definitionId: string
  owner: Owner
  currentStrength: number
  baseStrength: number
  rowType: RowType
  ability: Ability | null
  name: string
  tags: string[]
}

// ── Board ──

export interface RowState {
  rowType: RowType
  playerCards: CardInstance[]
  opponentCards: CardInstance[]
  playerScore: number
  opponentScore: number
  suppressedBy: { source: string; target: Owner } | null
}

export interface BoardState {
  rows: Record<RowType, RowState>
}

// ── Empires ──

export interface EmpireDefinition {
  id: string
  name: string
  requiredCards: string[] // card definition IDs
  rowType: RowType
  multiplier: number
  description: string
}

export interface EmpireStatus {
  empireId: string
  owner: Owner
  active: boolean
  suppressed: boolean
  cardsPresent: number
  cardsRequired: number
}

// ── Suppression ──

export interface SuppressionRecord {
  source: string // card instance ID that caused it
  target: Owner
  rowType: RowType
}

// ── Round ──

export interface RoundResult {
  roundNumber: number
  playerTotal: number
  opponentTotal: number
  winner: Owner | 'draw'
  rowResults: {
    rowType: RowType
    playerScore: number
    opponentScore: number
    winner: Owner | 'draw'
  }[]
}

// ── Match ──

export interface MatchState {
  phase: GamePhase
  roundNumber: number
  playerRoundsWon: number
  opponentRoundsWon: number
  board: BoardState
  playerHand: CardInstance[]
  opponentHand: CardInstance[]
  playerDeck: CardInstance[]
  opponentDeck: CardInstance[]
  playerDiscard: CardInstance[]
  opponentDiscard: CardInstance[]
  playerPassed: boolean
  opponentPassed: boolean
  suppressions: SuppressionRecord[]
  empireStatuses: EmpireStatus[]
  roundHistory: RoundResult[]
  turnCount: number
  selectedCardId: string | null
}

// ── Actions ──

export interface PlayCardAction {
  type: 'PLAY_CARD'
  cardInstanceId: string
  targetRow: RowType
}

export interface PassAction {
  type: 'PASS'
}

export type GameAction = PlayCardAction | PassAction

// ── AI Move ──

export interface AIMove {
  action: GameAction
  score: number
  reasoning: string
}
