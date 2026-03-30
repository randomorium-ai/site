'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence } from 'motion/react'
import type { CardInstance } from '@/lib/bizaar/engine/types'
import HandCard from './HandCard'

interface HandProps {
  cards: CardInstance[]
  selectedCardId: string | null
  onSelectCard: (cardInstanceId: string) => void
  deckCount: number
  discardCount?: number
  onPass: () => void
  canAct: boolean
  onInspectCard?: (card: CardInstance) => void
}

export default function Hand({
  cards,
  selectedCardId,
  onSelectCard,
  deckCount,
  discardCount = 0,
  onPass,
  canAct,
  onInspectCard,
}: HandProps) {
  const [confirmingPass, setConfirmingPass] = useState(false)

  const handlePassClick = useCallback(() => {
    if (!confirmingPass) {
      setConfirmingPass(true)
    } else {
      setConfirmingPass(false)
      onPass()
    }
  }, [confirmingPass, onPass])

  // Reset pass confirmation when a card is selected or played
  const handleSelectCard = useCallback((id: string) => {
    setConfirmingPass(false)
    onSelectCard(id)
  }, [onSelectCard])

  return (
    <div className="bzr-hand-area">
      {/* Deck pile */}
      <div className="bzr-hand-pile">
        <div className="bzr-pile-visual">
          <div className="bzr-pile-stack" />
          {deckCount > 0 && <div className="bzr-pile-stack bzr-pile-stack--2" />}
          {deckCount > 1 && <div className="bzr-pile-stack bzr-pile-stack--3" />}
        </div>
        <span className="bzr-pile-count">{deckCount}</span>
        <span className="bzr-pile-label">Deck</span>
      </div>

      {/* Hand cards */}
      <div className="bzr-hand-cards">
        <AnimatePresence mode="popLayout">
          {cards.map((card) => (
            <HandCard
              key={card.instanceId}
              card={card}
              selected={card.instanceId === selectedCardId}
              onClick={() => canAct && handleSelectCard(card.instanceId)}
              onLongPress={onInspectCard ? () => onInspectCard(card) : undefined}
            />
          ))}
        </AnimatePresence>
        {cards.length === 0 && (
          <span className="bzr-hand-empty">No cards remain</span>
        )}
      </div>

      {/* Pass button + discard */}
      <div className="bzr-hand-right">
        {canAct && (
          <button
            className={`bzr-pass-btn${confirmingPass ? ' bzr-pass-btn--confirm' : ''}`}
            onClick={handlePassClick}
          >
            <span className="bzr-pass-btn-text">{confirmingPass ? 'Confirm?' : 'Pass'}</span>
            <span className="bzr-pass-btn-sub">{confirmingPass ? 'Tap again' : 'End round'}</span>
          </button>
        )}
        {discardCount > 0 && (
          <div className="bzr-hand-pile bzr-hand-pile--discard">
            <div className="bzr-pile-visual bzr-pile-visual--discard">
              <div className="bzr-pile-stack bzr-pile-stack--discard" />
            </div>
            <span className="bzr-pile-count bzr-pile-count--discard">{discardCount}</span>
            <span className="bzr-pile-label">Used</span>
          </div>
        )}
      </div>
    </div>
  )
}
