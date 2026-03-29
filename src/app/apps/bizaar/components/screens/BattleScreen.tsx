'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/lib/bizaar/stores/gameStore'
import { getAIMove } from '@/lib/bizaar/engine/ai'
import { scoreBoard } from '@/lib/bizaar/engine/scoring'
import { TOTAL_ROUNDS } from '@/lib/bizaar/engine/constants'
import type { RowType } from '@/lib/bizaar/engine/types'
import Battlefield from '../board/Battlefield'
import Hand from '../hand/Hand'
import ScorePanel from '../hud/ScorePanel'
import TurnIndicator from '../hud/TurnIndicator'

interface BattleScreenProps {
  onMatchEnd: () => void
}

export default function BattleScreen({ onMatchEnd }: BattleScreenProps) {
  const { state, startMatch, selectCard, playSelectedCard, playerPass, opponentPlayCard, opponentPass } =
    useGameStore()
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Start match on mount
  useEffect(() => {
    startMatch()
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // AI turn handler
  useEffect(() => {
    if (state.phase !== 'TURN_OPPONENT') return

    aiTimerRef.current = setTimeout(() => {
      const currentState = useGameStore.getState().state
      const move = getAIMove(currentState)

      if (move.action.type === 'PLAY_CARD') {
        opponentPlayCard(move.action.cardInstanceId, move.action.targetRow)
      } else {
        opponentPass()
      }
    }, 600 + Math.random() * 400) // 600-1000ms delay for feel

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
  }, [state.phase, state.turnCount, opponentPlayCard, opponentPass])

  // Match end detection
  useEffect(() => {
    if (state.phase === 'MATCH_END') {
      const timer = setTimeout(onMatchEnd, 1200)
      return () => clearTimeout(timer)
    }
  }, [state.phase, onMatchEnd])

  const scored = scoreBoard(state.board.rows, state.suppressions)

  const canPlayRow = useCallback(
    (rowType: RowType): boolean => {
      if (state.phase !== 'TURN_PLAYER' || state.playerPassed || !state.selectedCardId) return false
      const card = state.playerHand.find((c) => c.instanceId === state.selectedCardId)
      return card?.rowType === rowType
    },
    [state.phase, state.playerPassed, state.selectedCardId, state.playerHand]
  )

  const handleRowClick = useCallback(
    (rowType: RowType) => {
      if (canPlayRow(rowType)) {
        playSelectedCard(rowType)
      }
    },
    [canPlayRow, playSelectedCard]
  )

  const handleSelectCard = useCallback(
    (cardInstanceId: string) => {
      if (state.selectedCardId === cardInstanceId) {
        selectCard(null)
      } else {
        selectCard(cardInstanceId)
      }
    },
    [state.selectedCardId, selectCard]
  )

  const isPlayerTurn = state.phase === 'TURN_PLAYER' && !state.playerPassed

  return (
    <div className="bzr-battle">
      {/* Opponent HUD */}
      <ScorePanel
        side="opponent"
        score={scored.opponentTotal}
        roundsWon={state.opponentRoundsWon}
        totalRounds={TOTAL_ROUNDS}
        passed={state.opponentPassed}
        label="Serpent"
        handCount={state.opponentHand.length}
      />

      {/* Turn indicator */}
      <TurnIndicator
        phase={state.phase}
        playerPassed={state.playerPassed}
        opponentPassed={state.opponentPassed}
        roundNumber={state.roundNumber}
      />

      {/* Board */}
      <Battlefield
        board={state.board}
        canPlayRow={canPlayRow}
        onRowClick={handleRowClick}
        empireStatuses={state.empireStatuses}
        suppressions={state.suppressions}
        playerTotal={scored.playerTotal}
        opponentTotal={scored.opponentTotal}
      />

      {/* Player HUD */}
      <ScorePanel
        side="player"
        score={scored.playerTotal}
        roundsWon={state.playerRoundsWon}
        totalRounds={TOTAL_ROUNDS}
        passed={state.playerPassed}
        label="You"
      />

      {/* Hand */}
      <Hand
        cards={state.playerHand}
        selectedCardId={state.selectedCardId}
        onSelectCard={handleSelectCard}
        deckCount={state.playerDeck.length}
        discardCount={state.playerDiscard.length}
        onPass={playerPass}
        canAct={isPlayerTurn}
      />
    </div>
  )
}
