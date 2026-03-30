'use client'

import { useRef, useEffect, useState } from 'react'
import type { RowState, Owner, EmpireStatus, SuppressionRecord, CardInstance } from '@/lib/bizaar/engine/types'
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
  onInspectCard?: (card: CardInstance) => void
}

const CARD_WIDTH = 55

export default function BoardRow({ row, side, canPlay, onRowClick, empireStatuses, suppressions, onInspectCard }: BoardRowProps) {
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

  // Check suppression
  const isSuppressed = suppressions.some(
    s => s.rowType === row.rowType && s.target === side
  )

  // Score pulse + delta: detect when score changes
  const prevScoreRef = useRef(score)
  const scoreElRef = useRef<HTMLDivElement>(null)
  const rowElRef = useRef<HTMLDivElement>(null)
  const [scoreDelta, setScoreDelta] = useState(0)
  const [showDelta, setShowDelta] = useState(false)

  useEffect(() => {
    if (score !== prevScoreRef.current && prevScoreRef.current !== 0) {
      const delta = score - prevScoreRef.current
      setScoreDelta(delta)
      setShowDelta(true)

      const el = scoreElRef.current
      if (el) {
        el.classList.remove('bzr-row-score--pulse')
        void el.offsetWidth
        el.classList.add('bzr-row-score--pulse')
      }

      // Flash row on big impacts
      if (Math.abs(delta) >= 3 && rowElRef.current) {
        rowElRef.current.classList.remove('bzr-row--flash')
        void rowElRef.current.offsetWidth
        rowElRef.current.classList.add('bzr-row--flash')
      }

      const timer = setTimeout(() => setShowDelta(false), 1200)
      prevScoreRef.current = score
      return () => clearTimeout(timer)
    }
    prevScoreRef.current = score
  }, [score])

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

  // Dominating = winning by 10+ points in a row
  const isDominating = score > otherScore && (score - otherScore) >= 10

  let rowClasses = `bzr-row bzr-row--${row.rowType}`
  if (canPlay) rowClasses += ' bzr-row--can-play'
  if (empireActive) rowClasses += ' bzr-row--empire-active'
  if (isSuppressed) rowClasses += ' bzr-row--suppressed'
  if (isDominating) rowClasses += ' bzr-row--dominating'

  return (
    <div ref={rowElRef} className={rowClasses} onClick={canPlay ? onRowClick : undefined}>
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
            onInspect={onInspectCard ? () => onInspectCard(card) : undefined}
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
        <div ref={scoreElRef} className={`bzr-row-score ${scoreClass}`}>
          {score}
        </div>
        {showDelta && scoreDelta !== 0 && (
          <span className={`bzr-score-delta ${scoreDelta > 0 ? 'bzr-score-delta--positive' : 'bzr-score-delta--negative'}`}>
            {scoreDelta > 0 ? '+' : ''}{scoreDelta}
          </span>
        )}
        {cards.length > 0 && (
          <span className="bzr-row-card-count">{cards.length} cards</span>
        )}
        {/* Empire progress dots */}
        {empire && empireStatus && empireStatus.cardsPresent > 0 && !empireActive && (
          <div className="bzr-row-empire-dots">
            {Array.from({ length: empireStatus.cardsRequired }, (_, i) => (
              <span
                key={i}
                className={`bzr-empire-dot${i < empireStatus.cardsPresent ? ' bzr-empire-dot--filled' : ''}`}
              />
            ))}
            <span className="bzr-row-empire-name">{empire.name.replace(' Empire', '')}</span>
          </div>
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
