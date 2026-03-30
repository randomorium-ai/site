'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { CardInstance } from '@/lib/bizaar/engine/types'
import { ROW_LABELS } from '@/lib/bizaar/engine/constants'
import { CARD_MAP } from '@/lib/bizaar/engine/cards'
import { EMPIRE_DEFINITIONS } from '@/lib/bizaar/engine/empires'
import CardPortrait, { getCardAccent } from './CardPortrait'

interface CardDetailProps {
  card: CardInstance | null
  onClose: () => void
}

function getAbilityFullText(card: CardInstance): string | null {
  return card.ability?.description ?? null
}

function getEmpireName(card: CardInstance): string | null {
  if (!card.tags.includes('empire')) return null
  const empire = EMPIRE_DEFINITIONS.find(e => e.requiredCards.includes(card.definitionId))
  return empire?.name ?? null
}

function getFlavourText(card: CardInstance): string | null {
  const def = CARD_MAP.get(card.definitionId)
  return def?.flavourText ?? null
}

export default function CardDetail({ card, onClose }: CardDetailProps) {
  // Close on Escape key
  useEffect(() => {
    if (!card) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [card, onClose])

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          className="bzr-card-detail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="bzr-card-detail"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ '--card-detail-accent': getCardAccent(card.definitionId) } as React.CSSProperties}
          >
            {/* Close button */}
            <button className="bzr-card-detail-close" onClick={onClose}>&times;</button>

            {/* Large portrait */}
            <div className="bzr-card-detail-portrait">
              <CardPortrait cardId={card.definitionId} size="lg" />
            </div>

            {/* Card name */}
            <h2 className="bzr-card-detail-name">{card.name}</h2>

            {/* Stats row */}
            <div className="bzr-card-detail-stats">
              <span className="bzr-card-detail-str">{card.baseStrength}</span>
              <span className="bzr-card-detail-row" style={{ background: getCardAccent(card.definitionId) }}>
                {ROW_LABELS[card.rowType]}
              </span>
              {getEmpireName(card) && (
                <span className="bzr-card-detail-empire">{getEmpireName(card)}</span>
              )}
            </div>

            {/* Ability description */}
            {getAbilityFullText(card) && (
              <p className="bzr-card-detail-ability">{getAbilityFullText(card)}</p>
            )}

            {/* Flavour text */}
            {getFlavourText(card) && (
              <p className="bzr-card-detail-flavour">&ldquo;{getFlavourText(card)}&rdquo;</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
