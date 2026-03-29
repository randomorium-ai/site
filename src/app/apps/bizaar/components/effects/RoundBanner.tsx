'use client'

import { useState, useEffect, useRef } from 'react'
import type { GamePhase, RoundResult } from '@/lib/bizaar/engine/types'

interface RoundBannerProps {
  phase: GamePhase
  roundNumber: number
  roundHistory: RoundResult[]
}

interface BannerState {
  text: string
  subtext: string
  type: 'round-start' | 'round-won' | 'round-lost' | 'round-draw' | 'match-start'
  key: number
}

export default function RoundBanner({ phase, roundNumber, roundHistory }: RoundBannerProps) {
  const [banner, setBanner] = useState<BannerState | null>(null)
  const prevPhaseRef = useRef<GamePhase>(phase)
  const keyRef = useRef(0)

  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = phase

    if (prev === phase) return

    // Match start
    if (phase === 'TURN_PLAYER' && prev === 'MATCH_START') {
      keyRef.current++
      setBanner({
        text: 'Round 1',
        subtext: 'Choose wisely, merchant',
        type: 'match-start',
        key: keyRef.current,
      })
    }

    // Round end — show result
    if (phase === 'ROUND_END' && roundHistory.length > 0) {
      const lastRound = roundHistory[roundHistory.length - 1]
      keyRef.current++
      if (lastRound.winner === 'player') {
        setBanner({
          text: 'Round Won',
          subtext: `${lastRound.playerTotal} — ${lastRound.opponentTotal}`,
          type: 'round-won',
          key: keyRef.current,
        })
      } else if (lastRound.winner === 'opponent') {
        setBanner({
          text: 'Round Lost',
          subtext: `${lastRound.playerTotal} — ${lastRound.opponentTotal}`,
          type: 'round-lost',
          key: keyRef.current,
        })
      } else {
        setBanner({
          text: 'Draw',
          subtext: `${lastRound.playerTotal} — ${lastRound.opponentTotal}`,
          type: 'round-draw',
          key: keyRef.current,
        })
      }
    }

    // New round start
    if (phase === 'TURN_PLAYER' && prev === 'ROUND_END') {
      setTimeout(() => {
        keyRef.current++
        setBanner({
          text: `Round ${roundNumber}`,
          subtext: 'The bazaar stirs again',
          type: 'round-start',
          key: keyRef.current,
        })
      }, 1800) // After round result banner fades
    }
  }, [phase, roundNumber, roundHistory])

  useEffect(() => {
    if (!banner) return
    const timer = setTimeout(() => setBanner(null), 1600)
    return () => clearTimeout(timer)
  }, [banner])

  if (!banner) return null

  return (
    <div key={banner.key} className={`bzr-round-banner bzr-round-banner--${banner.type}`}>
      <div className="bzr-round-banner-line" />
      <div className="bzr-round-banner-content">
        <div className="bzr-round-banner-text">{banner.text}</div>
        <div className="bzr-round-banner-sub">{banner.subtext}</div>
      </div>
      <div className="bzr-round-banner-line" />
    </div>
  )
}
