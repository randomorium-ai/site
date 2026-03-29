'use client'

import type { CardInstance } from '@/lib/bizaar/engine/types'
import { ROW_LABELS } from '@/lib/bizaar/engine/constants'
import CardPortrait, { getCardAccent } from '../cards/CardPortrait'
import AbilityIcon, { EmpireCrownIcon } from '../cards/AbilityIcon'

interface HandCardProps {
  card: CardInstance
  selected: boolean
  onClick: () => void
  index: number
  totalCards: number
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

export default function HandCard({ card, selected, onClick, index, totalCards }: HandCardProps) {
  const isEmpire = card.tags.includes('empire')
  const isDisruption = card.tags.includes('disruption')
  const accent = getCardAccent(card.definitionId)
  const abilityText = getAbilityShortText(card)

  // Fan spread
  const centerIndex = (totalCards - 1) / 2
  const offset = index - centerIndex
  const rotation = offset * 2.2
  const translateY = Math.abs(offset) * 2.5

  let cls = 'bzr-hcard'
  if (selected) cls += ' bzr-hcard--selected'
  if (isEmpire) cls += ' bzr-hcard--empire'
  if (isDisruption) cls += ' bzr-hcard--disruption'

  return (
    <div
      className={cls}
      onClick={onClick}
      style={{
        transform: `rotate(${rotation}deg) translateY(${translateY}px)${selected ? ' translateY(-16px)' : ''}`,
        zIndex: selected ? 50 : index,
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

      {/* Row ribbon */}
      <div className="bzr-hcard-row" style={{ background: accent }}>
        {ROW_LABELS[card.rowType]}
      </div>
    </div>
  )
}
