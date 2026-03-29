'use client'

import { useRef, useState, useEffect } from 'react'
import type { RowState, Owner, EmpireStatus, SuppressionRecord } from '@/lib/bizaar/engine/types'
import { ROW_LABELS, ROW_ICONS } from '@/lib/bizaar/engine/constants'
import { getCardVisibleWidth, getCardOffset } from '@/lib/bizaar/utils/cardLayout'
import { EMPIRE_DEFINITIONS } from '@/lib/bizaar/engine/empires'
import BoardCard from './BoardCard'

interface BoardRowProps {
  row: RowState
  side: Owner
  canPlay: boolean
  onRowClick: () => void
  empireStatuses: EmpireStatus[]
  suppressions: SuppressionRecord[]
}

const CARD_WIDTH = 55

export default function BoardRow({ row, side, canPlay, onRowClick, empireStatuses, suppressions }: BoardRowProps) {
  const cardsRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(300)

  const cards = side === 'player' ? row.playerCards : row.opponentCards
  const score = side === 'player' ? row.playerScore : row.opponentScore
  const otherScore = side === 'player' ? row.opponentScore : row.playerScore

  // Check empire status for this row + side
  const empire = EMPIRE_DEFINITIONS.find(e => e.rowType === row.rowType)
  const empireStatus = empire
    ? empireStatuses.find(es => es.empireId === empire.id && es.owner === side)
    : null
  const empireActive = empireStatus?.active ?? false
  const empireProgress = empireStatus ? `${empireStatus.cardsPresent}/${empireStatus.cardsRequired}` : null

  // Check suppression
  const isSuppressed = suppressions.some(
    s => s.rowType === row.rowType && s.target === side
  )

  const scoreClass = score > otherScore
    ? 'bzr-row-score--winning'
    : score < otherScore
      ? 'bzr-row-score--losing'
      : ''

  useEffect(() => {
    if (!cardsRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(cardsRef.current)
    return () => observer.disconnect()
  }, [])

  const visibleWidth = getCardVisibleWidth(containerWidth, CARD_WIDTH, cards.length)
  const useAbsolute = cards.length > 5

  let rowClasses = `bzr-row bzr-row--${row.rowType}`
  if (canPlay) rowClasses += ' bzr-row--can-play'
  if (empireActive) rowClasses += ' bzr-row--empire-active'
  if (isSuppressed) rowClasses += ' bzr-row--suppressed'

  return (
    <div className={rowClasses} onClick={canPlay ? onRowClick : undefined}>
      {/* Row label with icon */}
      <div className="bzr-row-label">
        <div className="bzr-row-label-inner">
          <span className="bzr-row-icon">{ROW_ICONS[row.rowType]}</span>
          <span className="bzr-row-label-text">{ROW_LABELS[row.rowType]}</span>
        </div>
      </div>

      {/* Cards */}
      <div
        className="bzr-row-cards"
        ref={cardsRef}
        style={useAbsolute ? { height: 54 } : undefined}
      >
        {cards.length === 0 && canPlay && (
          <span className="bzr-row-empty">Play here</span>
        )}
        {cards.map((card, i) => (
          <BoardCard
            key={card.instanceId}
            card={card}
            style={useAbsolute ? {
              position: 'absolute',
              left: `${getCardOffset(i, visibleWidth)}px`,
              zIndex: i,
            } : { zIndex: i }}
          />
        ))}
      </div>

      {/* Score + card count */}
      <div className="bzr-row-score-area">
        <div className={`bzr-row-score ${scoreClass}`}>
          {score}
        </div>
        {cards.length > 0 && (
          <span className="bzr-row-card-count">{cards.length} cards</span>
        )}
        {/* Empire progress indicator */}
        {empireProgress && empireStatus && empireStatus.cardsPresent > 0 && !empireActive && (
          <span className="bzr-row-empire-progress">{empireProgress}</span>
        )}
      </div>

      {/* Empire banner */}
      {empireActive && empire && (
        <div className="bzr-empire-banner">
          {empire.name} &times;{empire.multiplier}
        </div>
      )}
    </div>
  )
}
