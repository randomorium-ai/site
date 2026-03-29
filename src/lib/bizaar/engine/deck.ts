// ── Deck Operations ──
// Shuffle, draw, and card instance creation. Pure functions.

import type { CardDefinition, CardInstance, Owner } from './types'

let instanceCounter = 0

export function createCardInstance(def: CardDefinition, owner: Owner): CardInstance {
  instanceCounter++
  return {
    instanceId: `${owner}-${def.id}-${instanceCounter}`,
    definitionId: def.id,
    owner,
    currentStrength: def.baseStrength,
    baseStrength: def.baseStrength,
    rowType: def.rowType,
    ability: def.ability,
    name: def.name,
    tags: def.tags,
  }
}

export function resetInstanceCounter(): void {
  instanceCounter = 0
}

export function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function createDeck(definitions: CardDefinition[], owner: Owner): CardInstance[] {
  return shuffle(definitions.map((def) => createCardInstance(def, owner)))
}

export function drawCards(
  deck: CardInstance[],
  count: number
): { drawn: CardInstance[]; remaining: CardInstance[] } {
  const drawn = deck.slice(0, count)
  const remaining = deck.slice(count)
  return { drawn, remaining }
}
