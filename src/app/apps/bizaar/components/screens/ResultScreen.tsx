'use client'

import { useGameStore, getMatchWinner } from '@/lib/bizaar/stores/gameStore'
import SerpentSigil from '../shared/SerpentSigil'

interface ResultScreenProps {
  onPlayAgain: () => void
  onMenu: () => void
}

// Victory particles — golden sparkles falling
const VICTORY_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${5 + Math.random() * 90}%`,
  delay: `${Math.random() * 3}s`,
  duration: `${2 + Math.random() * 3}s`,
  size: `${1.5 + Math.random() * 2}px`,
}))

export default function ResultScreen({ onPlayAgain, onMenu }: ResultScreenProps) {
  const { state } = useGameStore()
  const winner = getMatchWinner()

  const titleText =
    winner === 'player'
      ? 'Victory'
      : winner === 'opponent'
        ? 'Defeat'
        : 'Draw'

  const titleClass =
    winner === 'player'
      ? 'bzr-result-title--win'
      : winner === 'opponent'
        ? 'bzr-result-title--lose'
        : 'bzr-result-title--draw'

  const subtitle =
    winner === 'player'
      ? 'The bazaar bows to you, merchant.'
      : winner === 'opponent'
        ? 'The serpent coils in satisfaction. Try again.'
        : 'An honourable stalemate between merchants.'

  return (
    <div className="bzr-result bzr-fade-in bzr-screen-enter">
      {/* Victory sparkle particles */}
      {winner === 'player' && (
        <div className="bzr-result-particles" aria-hidden="true">
          {VICTORY_PARTICLES.map(p => (
            <div
              key={p.id}
              className="bzr-result-sparkle"
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                width: p.size,
                height: p.size,
              }}
            />
          ))}
        </div>
      )}

      <div className="bzr-result-sigil">
        <SerpentSigil size={48} />
      </div>

      <h1 className={`bzr-result-title ${titleClass}`}>{titleText}</h1>
      <p className="bzr-result-subtitle">{subtitle}</p>

      <div className="bzr-result-rounds">
        {state.roundHistory.map((round) => {
          const won = round.winner === 'player'
          const lost = round.winner === 'opponent'
          return (
            <div
              key={round.roundNumber}
              className={`bzr-result-round ${won ? 'bzr-result-round--won' : ''} ${lost ? 'bzr-result-round--lost' : ''}`}
              style={{ animationDelay: `${0.3 + round.roundNumber * 0.15}s` }}
            >
              <div className="bzr-result-round-label">
                Round {round.roundNumber}
              </div>
              <div className="bzr-result-round-scores">
                <span className={`bzr-result-round-player ${won ? 'bzr-result-round-score--win' : ''}`}>
                  {round.playerTotal}
                </span>
                <span className="bzr-result-round-dash">&ndash;</span>
                <span className={`bzr-result-round-opp ${lost ? 'bzr-result-round-score--win' : ''}`}>
                  {round.opponentTotal}
                </span>
              </div>
              <div className="bzr-result-round-verdict">
                {won ? 'Won' : lost ? 'Lost' : 'Draw'}
              </div>
            </div>
          )
        })}
      </div>

      {winner === 'player' && (
        <p className="bzr-result-hat">
          A true merchant of the bazaar. The serpent approves.
          Perhaps a hat to celebrate &rarr;{' '}
          <a href="https://shop.randomorium.ai" target="_blank" rel="noopener noreferrer">
            shop.randomorium.ai
          </a>
        </p>
      )}

      <div className="bzr-menu-actions">
        <button className="bzr-btn bzr-btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="bzr-btn bzr-btn-secondary" onClick={onMenu}>
          Main Menu
        </button>
      </div>
    </div>
  )
}
