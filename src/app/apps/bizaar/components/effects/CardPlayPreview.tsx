'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { CardInstance } from '@/lib/bizaar/engine/types'
import { ROW_LABELS, ROW_ICONS } from '@/lib/bizaar/engine/constants'
import CardPortrait, { getCardAccent } from '../cards/CardPortrait'

interface CardPlayPreviewProps {
  card: CardInstance | null
  side: 'player' | 'opponent'
  onComplete: () => void
}

function getAbilityText(card: CardInstance): string | null {
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

export default function CardPlayPreview({ card, side, onComplete }: CardPlayPreviewProps) {
  useEffect(() => {
    if (!card) return
    const timer = setTimeout(onComplete, 1000)
    return () => clearTimeout(timer)
  }, [card, onComplete])

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          className="bzr-card-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="bzr-card-preview-backdrop" />
          <motion.div
            className="bzr-card-preview-content"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="bzr-card-preview-label">
              {side === 'player' ? 'You play...' : 'Serpent plays...'}
            </div>
            <div
              className="bzr-card-preview-card"
              style={{ '--card-accent': getCardAccent(card.definitionId) } as React.CSSProperties}
            >
              <div className="bzr-card-preview-strength">
                {card.baseStrength}
              </div>
              <div className="bzr-card-preview-portrait">
                <CardPortrait cardId={card.definitionId} size="lg" />
              </div>
              <div className="bzr-card-preview-name">{card.name}</div>
              {getAbilityText(card) && (
                <div className="bzr-card-preview-ability">{getAbilityText(card)}</div>
              )}
              <div className="bzr-card-preview-row">
                <span>{ROW_ICONS[card.rowType]}</span>
                <span>{ROW_LABELS[card.rowType]}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
