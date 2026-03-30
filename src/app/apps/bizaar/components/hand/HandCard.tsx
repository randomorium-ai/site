'use client'

import { useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import type { CardInstance } from '@/lib/bizaar/engine/types'
import { ROW_LABELS } from '@/lib/bizaar/engine/constants'
import * as sfx from '@/lib/bizaar/audio/SynthAudio'
import CardPortrait, { getCardAccent } from '../cards/CardPortrait'
import AbilityIcon, { EmpireCrownIcon } from '../cards/AbilityIcon'

interface HandCardProps {
  card: CardInstance
  selected: boolean
  onClick: () => void
  onLongPress?: () => void
}

function getAbilityShortText(card: CardInstance): string | null {
  if (!card.ability) return null
  const e = card.ability.effect
  switch (e.type) {
    case 'adjacency_buff': return `+${e.value} to neighbours`
    case 'row_buff': return `+${e.value} to row`
    case 'self_buff_per_ally': return `+${e.value} per ally`
    case 'suppress_row': return `Suppress ${ROW_LABELS[e.targetRow]}`
    case 'weaken_strongest': return `-${e.value} to strongest`
    case 'self_buff_if_losing': return `+${e.value} if losing`
    case 'burst_at_threshold': return `+${e.value} at ${e.threshold}+ cards`
    default: return null
  }
}

export default function HandCard({ card, selected, onClick, onLongPress }: HandCardProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      onLongPress?.()
    }, 300)
  }, [onLongPress])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!didLongPress.current) {
      onClick()
    }
  }, [onClick])

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])
  const isEmpire = card.tags.includes('empire')
  const isDisruption = card.tags.includes('disruption')
  const accent = getCardAccent(card.definitionId)
  const abilityText = getAbilityShortText(card)

  let cls = 'bzr-hcard'
  if (selected) cls += ' bzr-hcard--selected'
  if (isEmpire) cls += ' bzr-hcard--empire'
  if (isDisruption) cls += ' bzr-hcard--disruption'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: -30 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div
        className={cls}
        onPointerDown={onLongPress ? handlePointerDown : undefined}
        onPointerUp={onLongPress ? handlePointerUp : undefined}
        onPointerLeave={onLongPress ? handlePointerLeave : undefined}
        onClick={onLongPress ? undefined : onClick}
        onMouseEnter={() => {
          if (window.matchMedia('(hover: hover)').matches) sfx.uiHover()
        }}
        style={{
          '--card-accent': accent,
        } as React.CSSProperties}
      >
        {/* Strength badge — prominent top-left */}
        <div className="bzr-hcard-str">
          {card.baseStrength}
        </div>

        {/* Type badge — top right */}
        <div className="bzr-hcard-type">
          {isEmpire && <EmpireCrownIcon size={11} />}
          {card.ability && <AbilityIcon effect={card.ability.effect} size={11} />}
        </div>

        {/* Portrait */}
        <div className="bzr-hcard-portrait">
          <CardPortrait cardId={card.definitionId} size="md" />
        </div>

        {/* Name */}
        <div className="bzr-hcard-name">{card.name}</div>

        {/* Ability text */}
        {abilityText && (
          <div className="bzr-hcard-ability">{abilityText}</div>
        )}

        {/* Ornamental corner filigree */}
        <svg className="bzr-hcard-corner bzr-hcard-corner--tl" width="16" height="16" viewBox="0 0 12 12">
          <path d="M1 11V4a3 3 0 013-3h7" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.35" />
          <path d="M1 8V5a2 2 0 012-2h3" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.2" />
        </svg>
        <svg className="bzr-hcard-corner bzr-hcard-corner--tr" width="16" height="16" viewBox="0 0 12 12">
          <path d="M11 11V4a3 3 0 00-3-3H1" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.35" />
          <path d="M11 8V5a2 2 0 00-2-2H6" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.2" />
        </svg>
        <svg className="bzr-hcard-corner bzr-hcard-corner--bl" width="16" height="16" viewBox="0 0 12 12">
          <path d="M1 1v7a3 3 0 003 3h7" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.35" />
        </svg>
        <svg className="bzr-hcard-corner bzr-hcard-corner--br" width="16" height="16" viewBox="0 0 12 12">
          <path d="M11 1v7a3 3 0 01-3 3H1" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.35" />
        </svg>

        {/* Row ribbon */}
        <div className="bzr-hcard-row" style={{ background: accent }}>
          {ROW_LABELS[card.rowType]}
        </div>
      </div>
    </motion.div>
  )
}
