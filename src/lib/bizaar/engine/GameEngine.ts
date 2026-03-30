// ── Bizaar Game Engine ──
// Pure TypeScript state machine. No React imports.
//
// State flow:
//   MATCH_START → shuffle decks, draw 10 each
//     → ROUND_START → clear board, reset pass flags
//       → TURN_PLAYER → playCard() or pass()
//         → TURN_OPPONENT → AI decides
//           → (loop until both passed)
//       → ROUND_END → compare totals, award round, loser draws 1 extra
//         → if 2 rounds won → MATCH_END
//         → else → ROUND_START

import type {
  MatchState,
  PlayCardAction,
  Owner,
  RowType,
  BoardState,
  RowState,
  CardInstance,
  RoundResult,
} from './types'
import { CARD_DEFINITIONS } from './cards'
import { createDeck, drawCards, resetInstanceCounter } from './deck'
import { scoreBoard } from './scoring'
import { HAND_SIZE, ROW_TYPES, ROUNDS_TO_WIN, LOSER_BONUS_DRAW } from './constants'

function createEmptyBoard(): BoardState {
  const rows = {} as Record<RowType, RowState>
  for (const rowType of ROW_TYPES) {
    rows[rowType] = {
      rowType,
      playerCards: [],
      opponentCards: [],
      playerScore: 0,
      opponentScore: 0,
      suppressedBy: null,
    }
  }
  return { rows }
}

export class GameEngine {
  private state: MatchState

  constructor() {
    this.state = this.createInitialState()
  }

  private createInitialState(): MatchState {
    resetInstanceCounter()

    const playerDeckFull = createDeck(CARD_DEFINITIONS, 'player')
    const opponentDeckFull = createDeck(CARD_DEFINITIONS, 'opponent')

    const playerDraw = drawCards(playerDeckFull, HAND_SIZE)
    const opponentDraw = drawCards(opponentDeckFull, HAND_SIZE)

    return {
      phase: 'ROUND_START',
      roundNumber: 1,
      playerRoundsWon: 0,
      opponentRoundsWon: 0,
      board: createEmptyBoard(),
      playerHand: playerDraw.drawn,
      opponentHand: opponentDraw.drawn,
      playerDeck: playerDraw.remaining,
      opponentDeck: opponentDraw.remaining,
      playerDiscard: [],
      opponentDiscard: [],
      playerPassed: false,
      opponentPassed: false,
      suppressions: [],
      empireStatuses: [],
      roundHistory: [],
      turnCount: 0,
      selectedCardId: null,
    }
  }

  getState(): Readonly<MatchState> {
    return this.state
  }

  startMatch(): void {
    this.state = this.createInitialState()
    this.state.phase = 'TURN_PLAYER'
    this.recalcScores()
  }

  selectCard(cardInstanceId: string | null): void {
    this.state.selectedCardId = cardInstanceId
  }

  canPlayCard(cardInstanceId: string, targetRow: RowType): boolean {
    if (this.state.phase !== 'TURN_PLAYER') return false
    if (this.state.playerPassed) return false

    const card = this.state.playerHand.find((c) => c.instanceId === cardInstanceId)
    if (!card) return false

    // Cards can only be played to their matching row type
    return card.rowType === targetRow
  }

  playCard(action: PlayCardAction, owner: Owner = 'player'): boolean {
    const hand = owner === 'player' ? this.state.playerHand : this.state.opponentHand
    const cardIndex = hand.findIndex((c) => c.instanceId === action.cardInstanceId)
    if (cardIndex === -1) return false

    const card = hand[cardIndex]
    if (card.rowType !== action.targetRow) return false

    // Remove from hand
    const newHand = [...hand]
    newHand.splice(cardIndex, 1)
    if (owner === 'player') {
      this.state.playerHand = newHand
    } else {
      this.state.opponentHand = newHand
    }

    // Add to board row
    const row = this.state.board.rows[action.targetRow]
    if (owner === 'player') {
      row.playerCards = [...row.playerCards, card]
    } else {
      row.opponentCards = [...row.opponentCards, card]
    }

    // Handle on_play effects
    if (card.ability?.trigger === 'on_play') {
      this.resolveOnPlayEffect(card, action.targetRow, owner)
    }

    this.state.selectedCardId = null
    this.state.turnCount++
    this.recalcScores()

    return true
  }

  private resolveOnPlayEffect(card: CardInstance, rowType: RowType, owner: Owner): void {
    if (!card.ability) return
    const effect = card.ability.effect
    const opponent: Owner = owner === 'player' ? 'opponent' : 'player'

    switch (effect.type) {
      case 'suppress_row': {
        this.state.suppressions.push({
          source: card.instanceId,
          target: opponent,
          rowType: effect.targetRow,
        })
        break
      }

      case 'weaken_strongest': {
        const row = this.state.board.rows[rowType]
        const opponentCards =
          opponent === 'player' ? row.playerCards : row.opponentCards
        if (opponentCards.length === 0) break

        // Find strongest card (by currentStrength, break ties by position — last played)
        let strongest = opponentCards[0]
        for (const c of opponentCards) {
          if (c.currentStrength > strongest.currentStrength) {
            strongest = c
          }
        }
        // Reduce base strength so it persists through recalc
        strongest.baseStrength = Math.max(0, strongest.baseStrength - effect.value)
        break
      }
    }
  }

  pass(owner: Owner = 'player'): void {
    if (owner === 'player') {
      this.state.playerPassed = true
    } else {
      this.state.opponentPassed = true
    }

    if (this.state.playerPassed && this.state.opponentPassed) {
      this.endRound()
    } else {
      this.advanceTurn()
    }
  }

  private advanceTurn(): void {
    if (this.state.phase === 'TURN_PLAYER') {
      this.state.phase = this.state.opponentPassed ? 'TURN_PLAYER' : 'TURN_OPPONENT'
    } else if (this.state.phase === 'TURN_OPPONENT') {
      this.state.phase = this.state.playerPassed ? 'TURN_OPPONENT' : 'TURN_PLAYER'
    }
  }

  endPlayerTurn(): void {
    this.advanceTurn()
  }

  endOpponentTurn(): void {
    this.advanceTurn()
  }

  private endRound(): void {
    this.recalcScores()

    const scored = scoreBoard(this.state.board.rows, this.state.suppressions)
    const playerTotal = scored.playerTotal
    const opponentTotal = scored.opponentTotal

    const winner: Owner | 'draw' =
      playerTotal > opponentTotal ? 'player' : opponentTotal > playerTotal ? 'opponent' : 'draw'

    const roundResult: RoundResult = {
      roundNumber: this.state.roundNumber,
      playerTotal,
      opponentTotal,
      winner,
      rowResults: ROW_TYPES.map((rowType) => {
        const row = scored.rows[rowType]
        return {
          rowType,
          playerScore: row.playerScore,
          opponentScore: row.opponentScore,
          winner:
            row.playerScore > row.opponentScore
              ? ('player' as const)
              : row.opponentScore > row.playerScore
                ? ('opponent' as const)
                : ('draw' as const),
        }
      }),
    }

    this.state.roundHistory.push(roundResult)

    if (winner === 'player') this.state.playerRoundsWon++
    else if (winner === 'opponent') this.state.opponentRoundsWon++

    // Check for match end
    if (
      this.state.playerRoundsWon >= ROUNDS_TO_WIN ||
      this.state.opponentRoundsWon >= ROUNDS_TO_WIN ||
      this.state.roundNumber >= 3
    ) {
      this.state.phase = 'MATCH_END'
      return
    }

    // Loser draws 1 extra card
    if (winner === 'player' && this.state.opponentDeck.length > 0) {
      const draw = drawCards(this.state.opponentDeck, LOSER_BONUS_DRAW)
      this.state.opponentHand.push(...draw.drawn)
      this.state.opponentDeck = draw.remaining
    } else if (winner === 'opponent' && this.state.playerDeck.length > 0) {
      const draw = drawCards(this.state.playerDeck, LOSER_BONUS_DRAW)
      this.state.playerHand.push(...draw.drawn)
      this.state.playerDeck = draw.remaining
    } else if (winner === 'draw') {
      // Both draw 1 on tie
      if (this.state.playerDeck.length > 0) {
        const draw = drawCards(this.state.playerDeck, LOSER_BONUS_DRAW)
        this.state.playerHand.push(...draw.drawn)
        this.state.playerDeck = draw.remaining
      }
      if (this.state.opponentDeck.length > 0) {
        const draw = drawCards(this.state.opponentDeck, LOSER_BONUS_DRAW)
        this.state.opponentHand.push(...draw.drawn)
        this.state.opponentDeck = draw.remaining
      }
    }

    this.startNewRound()
  }

  private startNewRound(): void {
    // Discard all cards on the board
    for (const rowType of ROW_TYPES) {
      const row = this.state.board.rows[rowType]
      this.state.playerDiscard.push(...row.playerCards)
      this.state.opponentDiscard.push(...row.opponentCards)
    }

    // Clear board
    this.state.board = createEmptyBoard()
    this.state.suppressions = []
    this.state.empireStatuses = []
    this.state.playerPassed = false
    this.state.opponentPassed = false
    this.state.roundNumber++
    this.state.turnCount = 0
    this.state.selectedCardId = null
    this.state.phase = 'TURN_PLAYER'

    this.recalcScores()
  }

  private recalcScores(): void {
    const scored = scoreBoard(this.state.board.rows, this.state.suppressions)
    this.state.board.rows = scored.rows
    this.state.empireStatuses = scored.empireStatuses
  }

  getMatchWinner(): Owner | 'draw' | null {
    if (this.state.phase !== 'MATCH_END') return null
    if (this.state.playerRoundsWon > this.state.opponentRoundsWon) return 'player'
    if (this.state.opponentRoundsWon > this.state.playerRoundsWon) return 'opponent'
    return 'draw'
  }

  getPlayerTotal(): number {
    const scored = scoreBoard(this.state.board.rows, this.state.suppressions)
    return scored.playerTotal
  }

  getOpponentTotal(): number {
    const scored = scoreBoard(this.state.board.rows, this.state.suppressions)
    return scored.opponentTotal
  }
}
