// Maps a formation string ("4-3-3") to 11 {x, y} positions on a virtual pitch.
// x: 0 (left) → 100 (right), y: 0 (top/attack) → 100 (bottom/GK end)

export interface PitchPosition {
  x: number  // 0–100 (% from left)
  y: number  // 0–100 (% from top, 0 = attacking end, 100 = GK)
}

// Parse "4-3-3" → [4, 3, 3] (outfield rows, front to back)
export function parseFormation(formation: string): number[] {
  return formation.split('-').map(Number).filter(n => !isNaN(n) && n > 0)
}

// Spread N players across a row, evenly spaced
function spreadRow(n: number, y: number): PitchPosition[] {
  if (n === 1) return [{ x: 50, y }]
  const positions: PitchPosition[] = []
  for (let i = 0; i < n; i++) {
    const x = 10 + (80 / (n - 1)) * i
    positions.push({ x: Math.round(x), y })
  }
  return positions
}

// Y positions for rows (from top/attack to bottom/defence, not including GK)
// Formation "4-3-3" → rows=[4,3,3], ri=0=DEF (y=bottom), ri=last=ATT (y=top)
function rowYPositions(numOutfieldRows: number): number[] {
  const top = 18   // attacker y%
  const bottom = 72  // defender y%
  if (numOutfieldRows === 1) return [45]
  const positions: number[] = []
  for (let ri = 0; ri < numOutfieldRows; ri++) {
    // ri=0 → defenders (y=bottom), ri=last → attackers (y=top)
    const y = bottom - ((bottom - top) / (numOutfieldRows - 1)) * ri
    positions.push(Math.round(y))
  }
  return positions
}

export function getFormationPositions(formation: string): PitchPosition[] {
  const rows = parseFormation(formation)

  // Validate: total outfield + GK = 11
  const outfieldTotal = rows.reduce((a, b) => a + b, 0)
  if (outfieldTotal !== 10) {
    // Fallback: treat as 4-3-3
    return getFormationPositions('4-3-3')
  }

  const positions: PitchPosition[] = []

  // GK at the bottom
  positions.push({ x: 50, y: 88 })

  // Outfield rows: formation is listed front-to-back (attack → defence)
  // rows[0] = attackers, rows[last] = defenders
  const yPositions = rowYPositions(rows.length)

  for (let ri = 0; ri < rows.length; ri++) {
    const rowPlayers = rows[ri]
    const y = yPositions[ri]
    const rowPositions = spreadRow(rowPlayers, y)
    positions.push(...rowPositions)
  }

  return positions
}

// Map lineup index (0-based, GK first) to a position group label.
// formationRows is in standard notation: [DEF, ...MID..., ATT] e.g. [4,3,3]
export function getPositionGroup(formationRows: number[], index: number): 'GK' | 'DEF' | 'MID' | 'ATT' {
  if (index === 0) return 'GK'
  let pos = 1
  for (let ri = 0; ri < formationRows.length; ri++) {
    if (index < pos + formationRows[ri]) {
      if (ri === 0) return 'DEF'
      if (ri === formationRows.length - 1) return 'ATT'
      return 'MID'
    }
    pos += formationRows[ri]
  }
  return 'MID'
}
