'use client'

import type { CardInstance } from '@/lib/bizaar/engine/types'
import CardPortrait from '../cards/CardPortrait'
import AbilityIcon, { EmpireCrownIcon } from '../cards/AbilityIcon'

interface BoardCardProps {
  card: CardInstance
  style?: React.CSSProperties
}

export default function BoardCard({ card, style }: BoardCardProps) {
  const isBuffed = card.currentStrength > card.baseStrength
  const isDebuffed = card.currentStrength < card.baseStrength
  const isEmpire = card.tags.includes('empire')
  const isDisruption = card.tags.includes('disruption')

  let strCls = 'bzr-bcard-str'
  if (isBuffed) strCls += ' bzr-bcard-str--buffed'
  if (isDebuffed) strCls += ' bzr-bcard-str--debuffed'

  let cls = 'bzr-bcard'
  if (card.owner === 'player') cls += ' bzr-bcard--player'
  else cls += ' bzr-bcard--opponent'
  if (isEmpire) cls += ' bzr-bcard--empire'
  if (isDisruption) cls += ' bzr-bcard--disruption'

  return (
    <div
      className={cls}
      style={style}
      title={`${card.name}${card.ability ? ' — ' + card.ability.description : ''}`}
    >
      {/* Strength — top left */}
      <div className={strCls}>{card.currentStrength}</div>

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
  )
}
