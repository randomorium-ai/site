// ── Bizaar Empire Definitions ──
// An empire activates when all required cards are placed in their row by the same player.
// Activation applies a 1.5× multiplier to that row's score.
// Suppression (e.g., Highwayman) prevents the multiplier but doesn't affect card strength.

import type { EmpireDefinition } from './types'

export const EMPIRE_DEFINITIONS: EmpireDefinition[] = [
  {
    id: 'textile-empire',
    name: 'Textile Empire',
    requiredCards: ['cloth-merchant', 'wool-merchant', 'rug-seller'],
    rowType: 'textiles',
    multiplier: 1.5,
    description: 'Unite the weavers. Command the loom.',
  },
  {
    id: 'treasure-empire',
    name: 'Treasure Empire',
    requiredCards: ['ruby-trader', 'gold-curator', 'relic-broker'],
    rowType: 'treasures',
    multiplier: 1.5,
    description: 'Hoard the jewels. Rule the vault.',
  },
  {
    id: 'spice-empire',
    name: 'Spice Empire',
    requiredCards: ['saffron-merchant', 'herb-peddler', 'pepper-seller'],
    rowType: 'spices',
    multiplier: 1.5,
    description: 'Control the spice. Control the bazaar.',
  },
]

export const EMPIRE_MAP = new Map(EMPIRE_DEFINITIONS.map((e) => [e.id, e]))
