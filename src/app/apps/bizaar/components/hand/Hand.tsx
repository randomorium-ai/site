'use client'

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
}

export default function Hand({
  cards,
  selectedCardId,
  onSelectCard,
  deckCount,
  discardCount = 0,
  onPass,
  canAct,
}: HandProps) {
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
        {cards.map((card, i) => (
          <HandCard
            key={card.instanceId}
            card={card}
            selected={card.instanceId === selectedCardId}
            onClick={() => canAct && onSelectCard(card.instanceId)}
            index={i}
            totalCards={cards.length}
          />
        ))}
        {cards.length === 0 && (
          <span className="bzr-hand-empty">No cards remain</span>
        )}
      </div>

      {/* Pass button + discard */}
      <div className="bzr-hand-right">
        {canAct && (
          <button className="bzr-pass-btn" onClick={onPass}>
            <span className="bzr-pass-btn-text">Pass</span>
            <span className="bzr-pass-btn-sub">End round</span>
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
