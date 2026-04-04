// Game themes for The Number — stat categories players compete on.
// Uses the new Player type from player.ts (no API-Football dependency).

import type { Player } from "@/lib/player"

export interface GameTheme {
  id: string
  label: string
  unit: string
  targetMin: number
  targetMax: number
  getStat: (p: Player) => number
}

export const GAME_THEMES: GameTheme[] = [
  {
    id: "goals",
    label: "Career goals",
    unit: "goals",
    targetMin: 50,
    targetMax: 400,
    getStat: (p) => p.career_goals,
  },
  {
    id: "appearances",
    label: "Career appearances",
    unit: "apps",
    targetMin: 200,
    targetMax: 650,
    getStat: (p) => p.career_apps,
  },
  {
    id: "caps",
    label: "International caps",
    unit: "caps",
    targetMin: 60,
    targetMax: 200,
    getStat: (p) => p.international_caps,
  },
]
