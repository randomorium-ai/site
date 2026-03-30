// ── Bizaar Game Constants ──

import type { RowType } from './types'

export const ROW_TYPES: RowType[] = ['textiles', 'spices', 'treasures']

export const ROW_LABELS: Record<RowType, string> = {
  textiles: 'Textiles',
  spices: 'Spices',
  treasures: 'Treasures',
}

export const ROW_ICONS: Record<RowType, string> = {
  textiles: '🧵',
  spices: '🌶',
  treasures: '💎',
}

// Game config
export const HAND_SIZE = 10
export const DECK_SIZE = 18
export const ROUNDS_TO_WIN = 2
export const TOTAL_ROUNDS = 3
export const EMPIRE_MULTIPLIER = 1.5
export const LOSER_BONUS_DRAW = 1

// Board layout (opponent rows mirrored)
export const PLAYER_ROW_ORDER: RowType[] = ['textiles', 'spices', 'treasures']
export const OPPONENT_ROW_ORDER: RowType[] = ['treasures', 'spices', 'textiles']
