'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/lib/bizaar/stores/gameStore'
import { useAudioStore } from '@/lib/bizaar/stores/audioStore'
import { getAIMove } from '@/lib/bizaar/engine/ai'
import { scoreBoard } from '@/lib/bizaar/engine/scoring'
import { TOTAL_ROUNDS } from '@/lib/bizaar/engine/constants'
import { bazaarMusic } from '@/lib/bizaar/audio/BazaarMusic'
import * as sfx from '@/lib/bizaar/audio/SynthAudio'
import type { RowType, GamePhase } from '@/lib/bizaar/engine/types'
import Battlefield from '../board/Battlefield'
import Hand from '../hand/Hand'
import ScorePanel from '../hud/ScorePanel'
import TurnIndicator from '../hud/TurnIndicator'
import EmpireActivation from '../effects/EmpireActivation'
import RoundBanner from '../effects/RoundBanner'
import BoardAtmosphere from '../effects/BoardAtmosphere'

interface BattleScreenProps {
  onMatchEnd: () => void
}

export default function BattleScreen({ onMatchEnd }: BattleScreenProps) {
  const { state, startMatch, selectCard, playSelectedCard, playerPass, opponentPlayCard, opponentPass } =
    useGameStore()
  const { muted, toggleMute } = useAudioStore()
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPhaseRef = useRef<GamePhase>(state.phase)
  const prevHandLenRef = useRef(state.playerHand.length)

  // Screen shake ref
  const battleRef = useRef<HTMLDivElement>(null)
  const triggerShake = useCallback((heavy = false) => {
    if (!battleRef.current) return
    battleRef.current.classList.remove('bzr-shake', 'bzr-shake--heavy')
    void battleRef.current.offsetWidth
    battleRef.current.classList.add(heavy ? 'bzr-shake--heavy' : 'bzr-shake')
  }, [])

  // Start match on mount + music
  useEffect(() => {
    startMatch()
    sfx.matchStart()
    bazaarMusic.start('battle')
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
      bazaarMusic.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Phase-change audio
  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = state.phase

    if (prev === state.phase) return

    // Player's turn starts
    if (state.phase === 'TURN_PLAYER' && prev === 'TURN_OPPONENT') {
      sfx.turnStart()
    }

    // Round end
    if (state.phase === 'ROUND_END') {
      const lastRound = state.roundHistory[state.roundHistory.length - 1]
      if (lastRound?.winner === 'player') {
        sfx.roundWin()
      } else if (lastRound?.winner === 'opponent') {
        sfx.roundLose()
      }
    }

    // New round starting
    if (state.phase === 'TURN_PLAYER' && prev === 'ROUND_END') {
      sfx.roundStart()
      sfx.shuffle()
    }

    // Match end
    if (state.phase === 'MATCH_END') {
      bazaarMusic.stop()
      triggerShake(true)
      const pWon = state.playerRoundsWon
      const oWon = state.opponentRoundsWon
      if (pWon > oWon) sfx.matchWin()
      else if (oWon > pWon) sfx.matchLose()
    }
  }, [state.phase, state.roundHistory, state.playerRoundsWon, state.opponentRoundsWon, triggerShake])

  // Card draw sound (hand size increases)
  useEffect(() => {
    if (state.playerHand.length > prevHandLenRef.current && prevHandLenRef.current > 0) {
      sfx.cardDraw()
    }
    prevHandLenRef.current = state.playerHand.length
  }, [state.playerHand.length])

  // AI turn handler
  useEffect(() => {
    if (state.phase !== 'TURN_OPPONENT') return

    aiTimerRef.current = setTimeout(() => {
      const currentState = useGameStore.getState().state
      const move = getAIMove(currentState)

      if (move.action.type === 'PLAY_CARD') {
        const { cardInstanceId, targetRow } = move.action
        // Check if the card is a disruption
        const card = currentState.opponentHand.find(c => c.instanceId === cardInstanceId)
        opponentPlayCard(cardInstanceId, targetRow)
        if (card?.tags.includes('disruption')) {
          sfx.disruption()
          triggerShake()
        } else {
          sfx.opponentCardPlace()
        }
      } else {
        opponentPass()
        sfx.pass()
      }
    }, 600 + Math.random() * 400)

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
  }, [state.phase, state.turnCount, opponentPlayCard, opponentPass, triggerShake])

  // Match end detection
  useEffect(() => {
    if (state.phase === 'MATCH_END') {
      const timer = setTimeout(onMatchEnd, 2400) // Longer for banner
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
        // Check if card is disruption
        const card = state.playerHand.find(c => c.instanceId === state.selectedCardId)
        playSelectedCard(rowType)
        if (card?.tags.includes('disruption')) {
          sfx.disruption()
          triggerShake()
        } else {
          sfx.cardPlace()
        }
      }
    },
    [canPlayRow, playSelectedCard, state.playerHand, state.selectedCardId, triggerShake]
  )

  const handleSelectCard = useCallback(
    (cardInstanceId: string) => {
      if (state.selectedCardId === cardInstanceId) {
        selectCard(null)
        sfx.cardDeselect()
      } else {
        selectCard(cardInstanceId)
        sfx.cardSelect()
      }
    },
    [state.selectedCardId, selectCard]
  )

  const handlePass = useCallback(() => {
    playerPass()
    sfx.pass()
  }, [playerPass])

  const isPlayerTurn = state.phase === 'TURN_PLAYER' && !state.playerPassed

  return (
    <div ref={battleRef} className="bzr-battle bzr-screen-enter">
      {/* Atmospheric particles & vignette */}
      <BoardAtmosphere />

      {/* Mute toggle */}
      <button
        className="bzr-mute-btn"
        onClick={() => {
          toggleMute()
          sfx.uiClick()
          // Stop or restart music
          if (!muted) bazaarMusic.stop()
          else bazaarMusic.start('battle')
        }}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? '\u{1F507}' : '\u{1F509}'}
      </button>

      {/* Empire activation overlay */}
      <EmpireActivation empireStatuses={state.empireStatuses} />

      {/* Round transition banner (Gwent-style) */}
      <RoundBanner
        phase={state.phase}
        roundNumber={state.roundNumber}
        roundHistory={state.roundHistory}
      />

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
        onPass={handlePass}
        canAct={isPlayerTurn}
      />
    </div>
  )
}
