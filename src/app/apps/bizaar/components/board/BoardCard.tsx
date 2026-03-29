'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import type { CardInstance } from '@/lib/bizaar/engine/types'
import CardPortrait, { getCardAccent } from '../cards/CardPortrait'
import AbilityIcon, { EmpireCrownIcon } from '../cards/AbilityIcon'
import StrengthPopup from '../effects/StrengthPopup'

interface BoardCardProps {
  card: CardInstance
  style?: React.CSSProperties
}

export default function BoardCard({ card, style }: BoardCardProps) {
  const isBuffed = card.currentStrength > card.baseStrength
  const isDebuffed = card.currentStrength < card.baseStrength
  const isEmpire = card.tags.includes('empire')
  const isDisruption = card.tags.includes('disruption')
  const accent = getCardAccent(card.definitionId)

  // Landing flash — plays once on mount
  const flashRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (flashRef.current) {
      flashRef.current.classList.add('bzr-bcard-flash--active')
    }
  }, [])

  let strCls = 'bzr-bcard-str'
  if (isBuffed) strCls += ' bzr-bcard-str--buffed'
  if (isDebuffed) strCls += ' bzr-bcard-str--debuffed'

  let cls = 'bzr-bcard'
  if (card.owner === 'player') cls += ' bzr-bcard--player'
  else cls += ' bzr-bcard--opponent'
  if (isEmpire) cls += ' bzr-bcard--empire'
  if (isDisruption) cls += ' bzr-bcard--disruption'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: card.owner === 'player' ? 20 : -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      style={style}
    >
      <div
        className={cls}
        title={`${card.name}${card.ability ? ' — ' + card.ability.description : ''}`}
      >
        {/* Landing flash */}
        <div ref={flashRef} className="bzr-bcard-flash" style={{ '--flash-color': accent } as React.CSSProperties} />

        {/* Strength — top left */}
        <div className={strCls}>{card.currentStrength}</div>

        {/* Strength change popup */}
        <StrengthPopup currentStrength={card.currentStrength} />

        {/* Type badge — top right */}
        <div className="bzr-bcard-type">
          {isEmpire && <EmpireCrownIcon size={8} />}
          {card.ability && <AbilityIcon effect={card.ability.effect} size={8} />}
        </div>

        {/* Mini portrait */}
        <CardPortrait cardId={card.definitionId} size="sm" />

        {/* Name */}
        <span className="bzr-bcard-name">{card.name}</span>
      </div>
    </motion.div>
  )
}
