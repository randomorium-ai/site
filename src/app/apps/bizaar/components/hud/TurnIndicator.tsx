'use client'

import type { GamePhase } from '@/lib/bizaar/engine/types'

interface TurnIndicatorProps {
  phase: GamePhase
  playerPassed: boolean
  opponentPassed: boolean
  roundNumber: number
}

export default function TurnIndicator({
  phase,
  playerPassed,
  opponentPassed,
  roundNumber,
}: TurnIndicatorProps) {
  let text = ''
  let subtext = ''
  let className = 'bzr-turn'

  switch (phase) {
    case 'TURN_PLAYER':
      if (playerPassed) {
        text = 'You passed'
        subtext = 'Waiting for opponent...'
        className += ' bzr-turn--passed'
      } else {
        text = 'Your turn'
        subtext = 'Select a card, then choose a row'
        className += ' bzr-turn--player'
      }
      break
    case 'TURN_OPPONENT':
      if (opponentPassed) {
        text = 'Opponent passed'
        className += ' bzr-turn--passed'
      } else {
        text = 'Serpent is thinking...'
        className += ' bzr-turn--opponent'
      }
      break
    case 'ROUND_END':
      text = `Round ${roundNumber} complete`
      break
    case 'MATCH_END':
      text = 'Match over'
      break
    default:
      text = `Round ${roundNumber}`
  }

  return (
    <div className={className}>
      <span className="bzr-turn-text">{text}</span>
      {subtext && <span className="bzr-turn-sub">{subtext}</span>}
    </div>
  )
}
