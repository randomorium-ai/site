// ── Bizaar Game Store ──
// Zustand store wrapping the pure TS engine. Exposes reactive state + actions.

import { create } from 'zustand'
import { GameEngine } from '../engine/GameEngine'
import type { MatchState, RowType, Owner } from '../engine/types'

interface GameStore {
  state: Readonly<MatchState>
  engine: GameEngine

  // Actions
  startMatch: () => void
  selectCard: (cardInstanceId: string | null) => void
  playSelectedCard: (targetRow: RowType) => boolean
  playerPass: () => void
  opponentPlayCard: (cardInstanceId: string, targetRow: RowType) => boolean
  opponentPass: () => void
  endPlayerTurn: () => void
  endOpponentTurn: () => void
}

const engine = new GameEngine()

export const useGameStore = create<GameStore>((set, get) => ({
  state: engine.getState(),
  engine,

  startMatch: () => {
    engine.startMatch()
    set({ state: { ...engine.getState() } })
  },

  selectCard: (cardInstanceId) => {
    engine.selectCard(cardInstanceId)
    set({ state: { ...engine.getState() } })
  },

  playSelectedCard: (targetRow) => {
    const { state } = get()
    if (!state.selectedCardId) return false

    const success = engine.playCard(
      { type: 'PLAY_CARD', cardInstanceId: state.selectedCardId, targetRow },
      'player'
    )
    if (success) {
      engine.endPlayerTurn()
      set({ state: { ...engine.getState() } })
    }
    return success
  },

  playerPass: () => {
    engine.pass('player')
    set({ state: { ...engine.getState() } })
  },

  opponentPlayCard: (cardInstanceId, targetRow) => {
    const success = engine.playCard(
      { type: 'PLAY_CARD', cardInstanceId, targetRow },
      'opponent'
    )
    if (success) {
      engine.endOpponentTurn()
      set({ state: { ...engine.getState() } })
    }
    return success
  },

  opponentPass: () => {
    engine.pass('opponent')
    set({ state: { ...engine.getState() } })
  },

  endPlayerTurn: () => {
    engine.endPlayerTurn()
    set({ state: { ...engine.getState() } })
  },

  endOpponentTurn: () => {
    engine.endOpponentTurn()
    set({ state: { ...engine.getState() } })
  },
}))

// Helper to get total scores outside React
export function getScores(): { player: number; opponent: number } {
  const engine = useGameStore.getState().engine
  return {
    player: engine.getPlayerTotal(),
    opponent: engine.getOpponentTotal(),
  }
}

export function getMatchWinner(): Owner | 'draw' | null {
  return useGameStore.getState().engine.getMatchWinner()
}
