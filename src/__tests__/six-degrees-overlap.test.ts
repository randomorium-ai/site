// Tests for Six Degrees of Separation — overlap calculation and validation.
// Uses mock Player data so tests are deterministic and don't depend on players.json.

import {
  normClub,
  calculateClubOverlap,
  calculateSharedManagerOverlap,
  formatOverlapYears,
  seasonStr,
  type ManagerRecord,
} from '@/lib/overlap'
import type { Player } from '@/lib/player'

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function mockPlayer(
  name: string,
  clubs: Array<{ club: string; from: number; to: number | null }>
): Player {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    nationality: 'England',
    confederation: 'UEFA',
    dob: '1980-01-01',
    age: 44,
    position: 'ATT',
    current_club: clubs[clubs.length - 1]?.club ?? '',
    retired: false,
    career_clubs: clubs.map(c => ({ ...c, apps: 0, goals: 0 })),
    career_goals: 0,
    career_apps: 0,
    international_caps: 0,
    international_goals: 0,
    peak_club: clubs[0]?.club ?? '',
    popularity_score: 1_000_000,
    wikipedia_url: 'https://en.wikipedia.org/wiki/Test',
  }
}

const WENGER: ManagerRecord = {
  id: 'arsene-wenger',
  name: 'Arsène Wenger',
  stints: [{ club: 'Arsenal', from: 1996, to: 2018 }],
}

const GUARDIOLA: ManagerRecord = {
  id: 'pep-guardiola',
  name: 'Pep Guardiola',
  stints: [
    { club: 'Barcelona', from: 2008, to: 2012 },
    { club: 'Bayern Munich', from: 2013, to: 2016 },
    { club: 'Manchester City', from: 2016, to: null },
  ],
}

const ZIDANE: ManagerRecord = {
  id: 'zinedine-zidane',
  name: 'Zinedine Zidane',
  stints: [
    { club: 'Real Madrid', from: 2016, to: 2018 },
    { club: 'Real Madrid', from: 2019, to: 2021 },
  ],
}

// ─── normClub ─────────────────────────────────────────────────────────────────

describe('normClub', () => {
  test('strips F.C. suffix', () => {
    expect(normClub('Arsenal F.C.')).toBe('arsenal')
  })

  test('strips A.C. prefix', () => {
    expect(normClub('A.C. Milan')).toBe('milan')
    expect(normClub('AC Milan')).toBe('milan')
  })

  test('strips FC prefix', () => {
    expect(normClub('FC Barcelona')).toBe('barcelona')
  })

  test('strips CF suffix', () => {
    expect(normClub('Real Madrid CF')).toBe('real madrid')
  })

  test('handles hyphens', () => {
    expect(normClub('Paris Saint-Germain F.C.')).toBe('paris saint germain')
    expect(normClub('Paris Saint-Germain FC')).toBe('paris saint germain')
  })

  test('strips parentheticals including (loan)', () => {
    expect(normClub('Inter Milan (loan)')).toBe('inter milan')
    expect(normClub('Arsenal (on loan)')).toBe('arsenal')
  })

  test('strips B / reserve team suffixes', () => {
    expect(normClub('FC Barcelona B')).toBe('barcelona')
    expect(normClub('Real Madrid Castilla')).toBe('real madrid')
  })

  test('strips diacritics', () => {
    expect(normClub('Atlético Madrid')).toBe('atletico madrid')
  })

  test('strips → loan arrow prefix', () => {
    expect(normClub('→ Arsenal F.C.')).toBe('arsenal')
  })

  test('same club different formats match', () => {
    expect(normClub('Arsenal F.C.')).toBe(normClub('Arsenal'))
    expect(normClub('A.C. Milan')).toBe(normClub('AC Milan'))
    expect(normClub('Real Madrid CF')).toBe(normClub('Real Madrid'))
    expect(normClub('Manchester City F.C.')).toBe(normClub('Manchester City'))
    expect(normClub('Juventus FC')).toBe(normClub('Juventus'))
  })
})

// ─── calculateClubOverlap ─────────────────────────────────────────────────────

describe('calculateClubOverlap', () => {
  const henry = mockPlayer('Thierry Henry', [
    { club: 'Arsenal F.C.', from: 1999, to: 2007 },
    { club: 'FC Barcelona', from: 2007, to: 2010 },
  ])

  const pires = mockPlayer('Robert Pires', [
    { club: 'Arsenal F.C.', from: 2000, to: 2006 },
  ])

  const ronaldoCR = mockPlayer('Cristiano Ronaldo', [
    { club: 'Manchester United F.C.', from: 2003, to: 2009 },
    { club: 'Real Madrid CF', from: 2009, to: 2018 },
  ])

  test('Henry + Arsenal + Pires — valid overlap', () => {
    const overlap = calculateClubOverlap(henry, pires, 'Arsenal')
    expect(overlap).not.toBeNull()
    expect(overlap!.fromYear).toBe(2000)
    expect(overlap!.toYear).toBe(2006)
    expect(overlap!.seasons).toBe(6)
    expect(overlap!.approximate).toBe(false)
  })

  test('Henry + Pires — valid overlap without target club', () => {
    const overlap = calculateClubOverlap(henry, pires)
    expect(overlap).not.toBeNull()
    expect(normClub(overlap!.club)).toBe('arsenal')
  })

  test('Henry + Ronaldo — no shared club → rejected', () => {
    const overlap = calculateClubOverlap(henry, ronaldoCR)
    expect(overlap).toBeNull()
  })

  test('Henry + Ronaldo — wrong target club → rejected', () => {
    const overlap = calculateClubOverlap(henry, ronaldoCR, 'Real Madrid')
    expect(overlap).toBeNull()
  })

  test('currently active player (to=null) gives approximate overlap', () => {
    const current = mockPlayer('Active Player', [
      { club: 'Arsenal F.C.', from: 2020, to: null },
    ])
    const recent = mockPlayer('Recent Joiner', [
      { club: 'Arsenal F.C.', from: 2022, to: null },
    ])
    const overlap = calculateClubOverlap(current, recent)
    expect(overlap).not.toBeNull()
    expect(overlap!.approximate).toBe(true)
    expect(overlap!.fromYear).toBe(2022)
  })

  test('adjacent stints (no actual overlap) → rejected', () => {
    const playerA = mockPlayer('Player A', [{ club: 'Chelsea', from: 2010, to: 2015 }])
    const playerB = mockPlayer('Player B', [{ club: 'Chelsea', from: 2015, to: 2020 }])
    // from 2015 === to 2015 — no overlap (exclusive end year)
    const overlap = calculateClubOverlap(playerA, playerB)
    expect(overlap).toBeNull()
  })

  test('gerrard + Liverpool + carragher — long overlap', () => {
    const gerrard = mockPlayer('Steven Gerrard', [
      { club: 'Liverpool F.C.', from: 1998, to: 2015 },
    ])
    const carragher = mockPlayer('Jamie Carragher', [
      { club: 'Liverpool F.C.', from: 1996, to: 2013 },
    ])
    const overlap = calculateClubOverlap(gerrard, carragher)
    expect(overlap).not.toBeNull()
    expect(overlap!.seasons).toBe(15)
    expect(overlap!.fromYear).toBe(1998)
    expect(overlap!.toYear).toBe(2013)
  })
})

// ─── calculateSharedManagerOverlap ───────────────────────────────────────────

describe('calculateSharedManagerOverlap', () => {
  const henry = mockPlayer('Thierry Henry', [
    { club: 'Arsenal F.C.', from: 1999, to: 2007 },
  ])

  const vieira = mockPlayer('Patrick Vieira', [
    { club: 'Arsenal F.C.', from: 1996, to: 2005 },
  ])

  const debruyne = mockPlayer('Kevin De Bruyne', [
    { club: 'Manchester City F.C.', from: 2015, to: null },
  ])

  const haaland = mockPlayer('Erling Haaland', [
    { club: 'Manchester City F.C.', from: 2022, to: null },
  ])

  const beckham = mockPlayer('David Beckham', [
    { club: 'Manchester City F.C.', from: 2000, to: 2003 },
  ])

  test('Wenger + Arsenal: Henry + Vieira overlap', () => {
    const overlap = calculateSharedManagerOverlap(henry, vieira, WENGER)
    expect(overlap).not.toBeNull()
    expect(normClub(overlap!.club)).toBe('arsenal')
    expect(overlap!.fromYear).toBe(1999)
    expect(overlap!.toYear).toBe(2005)
    expect(overlap!.seasons).toBe(6)
  })

  test('Guardiola + Man City: De Bruyne + Haaland overlap', () => {
    const overlap = calculateSharedManagerOverlap(debruyne, haaland, GUARDIOLA)
    expect(overlap).not.toBeNull()
    expect(overlap!.fromYear).toBe(2022)
  })

  test('Players never under same manager → rejected', () => {
    // Beckham at Man City 2000-03, but Guardiola managed Man City from 2016
    const overlap = calculateSharedManagerOverlap(beckham, debruyne, GUARDIOLA)
    expect(overlap).toBeNull()
  })

  test('Zidane + Real Madrid: requires actual Real Madrid stint', () => {
    const benzema = mockPlayer('Karim Benzema', [
      { club: 'Real Madrid', from: 2009, to: 2023 },
    ])
    const modric = mockPlayer('Luka Modrić', [
      { club: 'Real Madrid', from: 2012, to: null },
    ])
    const overlap = calculateSharedManagerOverlap(benzema, modric, ZIDANE)
    expect(overlap).not.toBeNull()
    // Zidane managed 2016-18 and 2019-21. Benzema and Modrić both there throughout.
    // Best overlap: 2016-2018 or 2019-2021 (both 2 seasons), first found wins
    expect(overlap!.fromYear).toBeGreaterThanOrEqual(2016)
  })
})

// ─── formatOverlapYears / seasonStr ───────────────────────────────────────────

describe('formatOverlapYears', () => {
  test('single season', () => {
    expect(formatOverlapYears(2002, 2003)).toBe('2002/03')
  })

  test('multi season', () => {
    expect(formatOverlapYears(1999, 2007)).toBe('1999/00–2006/07')
  })

  test('two seasons', () => {
    expect(formatOverlapYears(2015, 2017)).toBe('2015/16–2016/17')
  })
})

describe('seasonStr', () => {
  test('formats single season', () => {
    expect(seasonStr(2002)).toBe('2002/03')
    expect(seasonStr(1999)).toBe('1999/00')
    expect(seasonStr(2023)).toBe('2023/24')
  })
})

// ─── Real data smoke tests ────────────────────────────────────────────────────

describe('Real players.json smoke tests', () => {
  // Only run if players.json is populated
  let henry: Player | undefined
  let vieira: Player | undefined
  let debruyne: Player | undefined
  let haaland: Player | undefined

  beforeAll(async () => {
    const { findPlayerByName } = await import('@/lib/player-search')
    henry = findPlayerByName('Thierry Henry')
    vieira = findPlayerByName('Patrick Vieira')
    debruyne = findPlayerByName('Kevin De Bruyne')
    haaland = findPlayerByName('Erling Haaland')
  })

  test('Henry + Vieira overlap at Arsenal (real data)', () => {
    if (!henry || !vieira) return
    const overlap = calculateClubOverlap(henry, vieira)
    expect(overlap).not.toBeNull()
    expect(normClub(overlap!.club)).toBe('arsenal')
    expect(overlap!.fromYear).toBe(1999)
    expect(overlap!.toYear).toBe(2005)
  })

  test('Henry + Vieira under Wenger (real data)', () => {
    if (!henry || !vieira) return
    const overlap = calculateSharedManagerOverlap(henry, vieira, WENGER)
    expect(overlap).not.toBeNull()
    expect(overlap!.seasons).toBeGreaterThan(0)
  })

  test('De Bruyne + Haaland under Guardiola (real data)', () => {
    if (!debruyne || !haaland) return
    const overlap = calculateSharedManagerOverlap(debruyne, haaland, GUARDIOLA)
    expect(overlap).not.toBeNull()
    expect(overlap!.fromYear).toBeGreaterThanOrEqual(2022)
  })
})
