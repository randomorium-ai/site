'use client'

import type { Owner } from '@/lib/bizaar/engine/types'

interface ScorePanelProps {
  side: Owner
  score: number
  roundsWon: number
  totalRounds: number
  passed: boolean
  label: string
  handCount?: number
}

export default function ScorePanel({
  side,
  score,
  roundsWon,
  totalRounds,
  passed,
  label,
  handCount,
}: ScorePanelProps) {
  const hudClass = side === 'opponent' ? 'bzr-hud-opponent' : 'bzr-hud-player'

  return (
    <div className={`bzr-hud ${hudClass}`}>
      <div className="bzr-hud-info">
        <span className="bzr-hud-name">{label}</span>
        {passed && <span className="bzr-hud-status">Passed</span>}
        {handCount !== undefined && (
          <span className="bzr-hud-hand-count">{handCount} cards</span>
        )}
      </div>

      <span className="bzr-hud-score">{score}</span>

      <div className="bzr-hud-rounds">
        {Array.from({ length: totalRounds }, (_, i) => (
          <span
            key={i}
            className={`bzr-round-gem ${i < roundsWon ? 'bzr-round-gem--won' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
