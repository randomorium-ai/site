// Football player pool — Top 5 European leagues + high-profile non-European players
// Stats are approximate career figures (as of 2024-25 season)

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF'
export type Position = 'GK' | 'DEF' | 'MID' | 'ATT'
export type StatKey = 'plAppearances' | 'clGoals' | 'careerGoals' | 'transferFeeM' | 'careerTrophies' | 'age' | 'internationalCaps'

export interface Player {
  id: string
  name: string
  nationality: string
  flag: string
  confederation: Confederation
  position: Position
  currentClub: string
  league: string
  age: number
  internationalCaps: number
  peakClub: string
  stats: {
    plAppearances: number    // Premier League appearances
    clGoals: number          // Champions League goals (career)
    careerGoals: number      // Total career goals
    transferFeeM: number     // Peak transfer fee (£M approx)
    careerTrophies: number   // Major honours
  }
}

export interface Theme {
  id: string
  label: string
  stat: StatKey
  unit: string
  targetMin: number
  targetMax: number
  description: string  // shown to player as hint
}

export const THEMES: Theme[] = [
  {
    id: 'pl_apps',
    label: 'Premier League appearances',
    stat: 'plAppearances',
    unit: 'apps',
    targetMin: 250,
    targetMax: 750,
    description: 'How many Premier League games have your 3 players appeared in — combined?',
  },
  {
    id: 'int_caps',
    label: 'International caps',
    stat: 'internationalCaps',
    unit: 'caps',
    targetMin: 200,
    targetMax: 480,
    description: 'Total international appearances across your 3 players.',
  },
  {
    id: 'cl_goals',
    label: 'Champions League goals',
    stat: 'clGoals',
    unit: 'goals',
    targetMin: 30,
    targetMax: 180,
    description: 'Career Champions League goals scored by your 3 players combined.',
  },
  {
    id: 'career_goals',
    label: 'Career goals',
    stat: 'careerGoals',
    unit: 'goals',
    targetMin: 200,
    targetMax: 900,
    description: 'Total career goals scored (all competitions) by your 3 players.',
  },
  {
    id: 'transfer_fee',
    label: 'Transfer fee (£M)',
    stat: 'transferFeeM',
    unit: '£M',
    targetMin: 60,
    targetMax: 280,
    description: 'Combined peak transfer fees (in millions £) for your 3 players.',
  },
  {
    id: 'trophies',
    label: 'Career trophies',
    stat: 'careerTrophies',
    unit: 'trophies',
    targetMin: 25,
    targetMax: 80,
    description: 'Major honours won across the careers of your 3 players.',
  },
  {
    id: 'age',
    label: 'Combined age',
    stat: 'age',
    unit: 'yrs',
    targetMin: 100,
    targetMax: 150,
    description: 'The sum of your 3 players\' current (or retirement) ages.',
  },
]

export function getStat(player: Player, stat: StatKey): number {
  if (stat === 'age') return player.age
  if (stat === 'internationalCaps') return player.internationalCaps
  return player.stats[stat as keyof Player['stats']]
}

export function getDailyPuzzle(): { theme: Theme; target: number; dateStr: string } {
  const d = new Date()
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  const seed = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()

  // LCG-based seeded random
  let s = seed
  const rand = () => {
    s = Math.imul(s, 1664525) + 1013904223 | 0
    return (s >>> 0) / 4294967296
  }

  const themeIdx = Math.floor(rand() * THEMES.length)
  const theme = THEMES[themeIdx]
  const target = Math.round(theme.targetMin + rand() * (theme.targetMax - theme.targetMin))

  return { theme, target, dateStr }
}

export function calcScore(total: number, target: number): number {
  if (total === target) return 1000
  const diff = Math.abs(total - target)
  return Math.max(0, Math.round(1000 * (1 - diff / target)))
}

export function scoreLabel(score: number): string {
  if (score === 1000) return 'PERFECT!'
  if (score >= 900) return 'Elite'
  if (score >= 700) return 'Class'
  if (score >= 500) return 'Decent'
  if (score >= 200) return 'Close-ish'
  return 'Swing and a miss'
}

// ─── Player pool ──────────────────────────────────────────────────────────────

export const players: Player[] = [
  // GOALKEEPERS
  { id: 'neuer', name: 'Manuel Neuer', nationality: 'German', flag: '🇩🇪', confederation: 'UEFA', position: 'GK', currentClub: 'Bayern Munich', league: 'Bundesliga', age: 38, internationalCaps: 124, peakClub: 'Bayern Munich', stats: { plAppearances: 0, clGoals: 0, careerGoals: 3, transferFeeM: 0, careerTrophies: 29 } },
  { id: 'degea', name: 'David De Gea', nationality: 'Spanish', flag: '🇪🇸', confederation: 'UEFA', position: 'GK', currentClub: 'Fiorentina', league: 'Serie A', age: 34, internationalCaps: 45, peakClub: 'Manchester United', stats: { plAppearances: 367, clGoals: 0, careerGoals: 2, transferFeeM: 19, careerTrophies: 5 } },
  { id: 'buffon', name: 'Gianluigi Buffon', nationality: 'Italian', flag: '🇮🇹', confederation: 'UEFA', position: 'GK', currentClub: 'Retired', league: 'Retired', age: 46, internationalCaps: 176, peakClub: 'Juventus', stats: { plAppearances: 0, clGoals: 0, careerGoals: 0, transferFeeM: 33, careerTrophies: 26 } },
  { id: 'alisson', name: 'Alisson Becker', nationality: 'Brazilian', flag: '🇧🇷', confederation: 'CONMEBOL', position: 'GK', currentClub: 'Liverpool', league: 'Premier League', age: 32, internationalCaps: 72, peakClub: 'Liverpool', stats: { plAppearances: 238, clGoals: 1, careerGoals: 7, transferFeeM: 65, careerTrophies: 12 } },
  { id: 'courtois', name: 'Thibaut Courtois', nationality: 'Belgian', flag: '🇧🇪', confederation: 'UEFA', position: 'GK', currentClub: 'Real Madrid', league: 'La Liga', age: 32, internationalCaps: 103, peakClub: 'Real Madrid', stats: { plAppearances: 204, clGoals: 0, careerGoals: 1, transferFeeM: 35, careerTrophies: 18 } },

  // DEFENDERS
  { id: 'vandijk', name: 'Virgil van Dijk', nationality: 'Dutch', flag: '🇳🇱', confederation: 'UEFA', position: 'DEF', currentClub: 'Liverpool', league: 'Premier League', age: 33, internationalCaps: 65, peakClub: 'Liverpool', stats: { plAppearances: 260, clGoals: 6, careerGoals: 50, transferFeeM: 75, careerTrophies: 8 } },
  { id: 'ramos', name: 'Sergio Ramos', nationality: 'Spanish', flag: '🇪🇸', confederation: 'UEFA', position: 'DEF', currentClub: 'Sevilla', league: 'La Liga', age: 38, internationalCaps: 180, peakClub: 'Real Madrid', stats: { plAppearances: 0, clGoals: 13, careerGoals: 101, transferFeeM: 0, careerTrophies: 22 } },
  { id: 'thiagosilva', name: 'Thiago Silva', nationality: 'Brazilian', flag: '🇧🇷', confederation: 'CONMEBOL', position: 'DEF', currentClub: 'Fluminense', league: 'Other', age: 40, internationalCaps: 107, peakClub: 'PSG', stats: { plAppearances: 78, clGoals: 4, careerGoals: 52, transferFeeM: 0, careerTrophies: 22 } },
  { id: 'maldini', name: 'Paolo Maldini', nationality: 'Italian', flag: '🇮🇹', confederation: 'UEFA', position: 'DEF', currentClub: 'Retired', league: 'Retired', age: 56, internationalCaps: 126, peakClub: 'AC Milan', stats: { plAppearances: 0, clGoals: 5, careerGoals: 33, transferFeeM: 0, careerTrophies: 17 } },
  { id: 'robertocarlos', name: 'Roberto Carlos', nationality: 'Brazilian', flag: '🇧🇷', confederation: 'CONMEBOL', position: 'DEF', currentClub: 'Retired', league: 'Retired', age: 51, internationalCaps: 125, peakClub: 'Real Madrid', stats: { plAppearances: 0, clGoals: 7, careerGoals: 113, transferFeeM: 0, careerTrophies: 11 } },
  { id: 'lahm', name: 'Philipp Lahm', nationality: 'German', flag: '🇩🇪', confederation: 'UEFA', position: 'DEF', currentClub: 'Retired', league: 'Retired', age: 41, internationalCaps: 113, peakClub: 'Bayern Munich', stats: { plAppearances: 0, clGoals: 5, careerGoals: 36, transferFeeM: 0, careerTrophies: 18 } },
  { id: 'terry', name: 'John Terry', nationality: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', position: 'DEF', currentClub: 'Retired', league: 'Retired', age: 44, internationalCaps: 78, peakClub: 'Chelsea', stats: { plAppearances: 717, clGoals: 5, careerGoals: 67, transferFeeM: 0, careerTrophies: 17 } },
  { id: 'ferdinand', name: 'Rio Ferdinand', nationality: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', position: 'DEF', currentClub: 'Retired', league: 'Retired', age: 46, internationalCaps: 81, peakClub: 'Manchester United', stats: { plAppearances: 504, clGoals: 7, careerGoals: 18, transferFeeM: 30, careerTrophies: 16 } },
  { id: 'nesta', name: 'Alessandro Nesta', nationality: 'Italian', flag: '🇮🇹', confederation: 'UEFA', position: 'DEF', currentClub: 'Retired', league: 'Retired', age: 49, internationalCaps: 78, peakClub: 'AC Milan', stats: { plAppearances: 0, clGoals: 3, careerGoals: 23, transferFeeM: 30, careerTrophies: 12 } },
  { id: 'marcelo', name: 'Marcelo', nationality: 'Brazilian', flag: '🇧🇷', confederation: 'CONMEBOL', position: 'DEF', currentClub: 'Retired', league: 'Retired', age: 36, internationalCaps: 58, peakClub: 'Real Madrid', stats: { plAppearances: 0, clGoals: 5, careerGoals: 34, transferFeeM: 0, careerTrophies: 9 } },

  // MIDFIELDERS
  { id: 'modric', name: 'Luka Modrić', nationality: 'Croatian', flag: '🇭🇷', confederation: 'UEFA', position: 'MID', currentClub: 'Real Madrid', league: 'La Liga', age: 39, internationalCaps: 180, peakClub: 'Real Madrid', stats: { plAppearances: 159, clGoals: 18, careerGoals: 130, transferFeeM: 30, careerTrophies: 25 } },
  { id: 'xavi', name: 'Xavi Hernández', nationality: 'Spanish', flag: '🇪🇸', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 44, internationalCaps: 133, peakClub: 'Barcelona', stats: { plAppearances: 0, clGoals: 8, careerGoals: 87, transferFeeM: 0, careerTrophies: 25 } },
  { id: 'iniesta', name: 'Andrés Iniesta', nationality: 'Spanish', flag: '🇪🇸', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 40, internationalCaps: 131, peakClub: 'Barcelona', stats: { plAppearances: 0, clGoals: 12, careerGoals: 59, transferFeeM: 0, careerTrophies: 27 } },
  { id: 'kante', name: "N'Golo Kanté", nationality: 'French', flag: '🇫🇷', confederation: 'UEFA', position: 'MID', currentClub: 'Al-Ittihad', league: 'Saudi Pro League', age: 33, internationalCaps: 53, peakClub: 'Chelsea', stats: { plAppearances: 271, clGoals: 0, careerGoals: 19, transferFeeM: 32, careerTrophies: 12 } },
  { id: 'debruyne', name: 'Kevin De Bruyne', nationality: 'Belgian', flag: '🇧🇪', confederation: 'UEFA', position: 'MID', currentClub: 'Manchester City', league: 'Premier League', age: 33, internationalCaps: 103, peakClub: 'Manchester City', stats: { plAppearances: 279, clGoals: 16, careerGoals: 122, transferFeeM: 76, careerTrophies: 17 } },
  { id: 'gerrard', name: 'Steven Gerrard', nationality: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 44, internationalCaps: 114, peakClub: 'Liverpool', stats: { plAppearances: 504, clGoals: 21, careerGoals: 186, transferFeeM: 0, careerTrophies: 9 } },
  { id: 'lampard', name: 'Frank Lampard', nationality: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 46, internationalCaps: 106, peakClub: 'Chelsea', stats: { plAppearances: 609, clGoals: 23, careerGoals: 268, transferFeeM: 11, careerTrophies: 11 } },
  { id: 'vieira', name: 'Patrick Vieira', nationality: 'French', flag: '🇫🇷', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 48, internationalCaps: 107, peakClub: 'Arsenal', stats: { plAppearances: 307, clGoals: 5, careerGoals: 57, transferFeeM: 30, careerTrophies: 14 } },
  { id: 'zidane', name: 'Zinedine Zidane', nationality: 'French', flag: '🇫🇷', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 52, internationalCaps: 108, peakClub: 'Real Madrid', stats: { plAppearances: 0, clGoals: 6, careerGoals: 95, transferFeeM: 46, careerTrophies: 19 } },
  { id: 'beckham', name: 'David Beckham', nationality: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 49, internationalCaps: 115, peakClub: 'Manchester United', stats: { plAppearances: 265, clGoals: 15, careerGoals: 128, transferFeeM: 25, careerTrophies: 19 } },
  { id: 'scholes', name: 'Paul Scholes', nationality: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 50, internationalCaps: 66, peakClub: 'Manchester United', stats: { plAppearances: 499, clGoals: 24, careerGoals: 155, transferFeeM: 0, careerTrophies: 25 } },
  { id: 'keane', name: 'Roy Keane', nationality: 'Irish', flag: '🇮🇪', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 53, internationalCaps: 67, peakClub: 'Manchester United', stats: { plAppearances: 366, clGoals: 5, careerGoals: 51, transferFeeM: 4, careerTrophies: 19 } },
  { id: 'xabialonso', name: 'Xabi Alonso', nationality: 'Spanish', flag: '🇪🇸', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 43, internationalCaps: 114, peakClub: 'Real Madrid', stats: { plAppearances: 209, clGoals: 7, careerGoals: 53, transferFeeM: 30, careerTrophies: 18 } },
  { id: 'ribery', name: 'Franck Ribéry', nationality: 'French', flag: '🇫🇷', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 41, internationalCaps: 81, peakClub: 'Bayern Munich', stats: { plAppearances: 0, clGoals: 10, careerGoals: 124, transferFeeM: 25, careerTrophies: 22 } },
  { id: 'ozil', name: 'Mesut Özil', nationality: 'German', flag: '🇩🇪', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 36, internationalCaps: 92, peakClub: 'Real Madrid/Arsenal', stats: { plAppearances: 254, clGoals: 6, careerGoals: 97, transferFeeM: 42, careerTrophies: 20 } },
  { id: 'fabregas', name: 'Cesc Fàbregas', nationality: 'Spanish', flag: '🇪🇸', confederation: 'UEFA', position: 'MID', currentClub: 'Retired', league: 'Retired', age: 37, internationalCaps: 110, peakClub: 'Arsenal/Barcelona', stats: { plAppearances: 350, clGoals: 5, careerGoals: 114, transferFeeM: 35, careerTrophies: 15 } },

  // ATTACKERS
  { id: 'messi', name: 'Lionel Messi', nationality: 'Argentine', flag: '🇦🇷', confederation: 'CONMEBOL', position: 'ATT', currentClub: 'Inter Miami', league: 'MLS', age: 37, internationalCaps: 191, peakClub: 'Barcelona', stats: { plAppearances: 0, clGoals: 129, careerGoals: 858, transferFeeM: 0, careerTrophies: 44 } },
  { id: 'ronaldo', name: 'Cristiano Ronaldo', nationality: 'Portuguese', flag: '🇵🇹', confederation: 'UEFA', position: 'ATT', currentClub: 'Al-Nassr', league: 'Saudi Pro League', age: 40, internationalCaps: 213, peakClub: 'Real Madrid', stats: { plAppearances: 295, clGoals: 140, careerGoals: 918, transferFeeM: 80, careerTrophies: 34 } },
  { id: 'ronaldonazario', name: 'Ronaldo Nazário', nationality: 'Brazilian', flag: '🇧🇷', confederation: 'CONMEBOL', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 48, internationalCaps: 98, peakClub: 'Barcelona/Real Madrid', stats: { plAppearances: 0, clGoals: 8, careerGoals: 415, transferFeeM: 0, careerTrophies: 11 } },
  { id: 'henry', name: 'Thierry Henry', nationality: 'French', flag: '🇫🇷', confederation: 'UEFA', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 47, internationalCaps: 123, peakClub: 'Arsenal', stats: { plAppearances: 254, clGoals: 26, careerGoals: 411, transferFeeM: 23, careerTrophies: 15 } },
  { id: 'drogba', name: 'Didier Drogba', nationality: 'Ivorian', flag: '🇨🇮', confederation: 'CAF', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 47, internationalCaps: 105, peakClub: 'Chelsea', stats: { plAppearances: 254, clGoals: 36, careerGoals: 385, transferFeeM: 24, careerTrophies: 15 } },
  { id: 'etoo', name: "Samuel Eto'o", nationality: 'Cameroonian', flag: '🇨🇲', confederation: 'CAF', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 43, internationalCaps: 118, peakClub: 'Barcelona', stats: { plAppearances: 0, clGoals: 30, careerGoals: 473, transferFeeM: 0, careerTrophies: 17 } },
  { id: 'zlatan', name: 'Zlatan Ibrahimović', nationality: 'Swedish', flag: '🇸🇪', confederation: 'UEFA', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 43, internationalCaps: 122, peakClub: 'PSG', stats: { plAppearances: 33, clGoals: 48, careerGoals: 619, transferFeeM: 70, careerTrophies: 31 } },
  { id: 'rooney', name: 'Wayne Rooney', nationality: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 39, internationalCaps: 120, peakClub: 'Manchester United', stats: { plAppearances: 491, clGoals: 30, careerGoals: 310, transferFeeM: 27, careerTrophies: 16 } },
  { id: 'torres', name: 'Fernando Torres', nationality: 'Spanish', flag: '🇪🇸', confederation: 'UEFA', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 41, internationalCaps: 110, peakClub: 'Liverpool/Chelsea', stats: { plAppearances: 225, clGoals: 18, careerGoals: 295, transferFeeM: 50, careerTrophies: 10 } },
  { id: 'shevchenko', name: 'Andriy Shevchenko', nationality: 'Ukrainian', flag: '🇺🇦', confederation: 'UEFA', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 48, internationalCaps: 111, peakClub: 'AC Milan', stats: { plAppearances: 77, clGoals: 48, careerGoals: 400, transferFeeM: 30, careerTrophies: 13 } },
  { id: 'benzema', name: 'Karim Benzema', nationality: 'French', flag: '🇫🇷', confederation: 'UEFA', position: 'ATT', currentClub: 'Al-Ittihad', league: 'Saudi Pro League', age: 37, internationalCaps: 97, peakClub: 'Real Madrid', stats: { plAppearances: 0, clGoals: 90, careerGoals: 586, transferFeeM: 35, careerTrophies: 25 } },
  { id: 'mbappe', name: 'Kylian Mbappé', nationality: 'French', flag: '🇫🇷', confederation: 'UEFA', position: 'ATT', currentClub: 'Real Madrid', league: 'La Liga', age: 26, internationalCaps: 84, peakClub: 'Real Madrid', stats: { plAppearances: 0, clGoals: 49, careerGoals: 330, transferFeeM: 180, careerTrophies: 14 } },
  { id: 'haaland', name: 'Erling Haaland', nationality: 'Norwegian', flag: '🇳🇴', confederation: 'UEFA', position: 'ATT', currentClub: 'Manchester City', league: 'Premier League', age: 24, internationalCaps: 35, peakClub: 'Manchester City', stats: { plAppearances: 93, clGoals: 50, careerGoals: 193, transferFeeM: 51, careerTrophies: 7 } },
  { id: 'kane', name: 'Harry Kane', nationality: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', position: 'ATT', currentClub: 'Bayern Munich', league: 'Bundesliga', age: 31, internationalCaps: 97, peakClub: 'Tottenham/Bayern', stats: { plAppearances: 320, clGoals: 32, careerGoals: 310, transferFeeM: 96, careerTrophies: 0 } },
  { id: 'salah', name: 'Mohamed Salah', nationality: 'Egyptian', flag: '🇪🇬', confederation: 'CAF', position: 'ATT', currentClub: 'Liverpool', league: 'Premier League', age: 32, internationalCaps: 100, peakClub: 'Liverpool', stats: { plAppearances: 260, clGoals: 46, careerGoals: 250, transferFeeM: 42, careerTrophies: 10 } },
  { id: 'neymar', name: 'Neymar', nationality: 'Brazilian', flag: '🇧🇷', confederation: 'CONMEBOL', position: 'ATT', currentClub: 'Santos', league: 'Other', age: 33, internationalCaps: 128, peakClub: 'Barcelona/PSG', stats: { plAppearances: 0, clGoals: 43, careerGoals: 450, transferFeeM: 198, careerTrophies: 18 } },
  { id: 'suarez', name: 'Luis Suárez', nationality: 'Uruguayan', flag: '🇺🇾', confederation: 'CONMEBOL', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 38, internationalCaps: 142, peakClub: 'Liverpool/Barcelona', stats: { plAppearances: 133, clGoals: 14, careerGoals: 568, transferFeeM: 65, careerTrophies: 21 } },
  { id: 'bale', name: 'Gareth Bale', nationality: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', confederation: 'UEFA', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 35, internationalCaps: 111, peakClub: 'Real Madrid', stats: { plAppearances: 234, clGoals: 21, careerGoals: 226, transferFeeM: 85, careerTrophies: 14 } },
  { id: 'hazard', name: 'Eden Hazard', nationality: 'Belgian', flag: '🇧🇪', confederation: 'UEFA', position: 'ATT', currentClub: 'Retired', league: 'Retired', age: 34, internationalCaps: 126, peakClub: 'Chelsea', stats: { plAppearances: 352, clGoals: 9, careerGoals: 191, transferFeeM: 88, careerTrophies: 12 } },
  { id: 'griezmann', name: 'Antoine Griezmann', nationality: 'French', flag: '🇫🇷', confederation: 'UEFA', position: 'ATT', currentClub: 'Atletico Madrid', league: 'La Liga', age: 33, internationalCaps: 139, peakClub: 'Atletico Madrid', stats: { plAppearances: 0, clGoals: 20, careerGoals: 282, transferFeeM: 107, careerTrophies: 16 } },
  { id: 'mane', name: 'Sadio Mané', nationality: 'Senegalese', flag: '🇸🇳', confederation: 'CAF', position: 'ATT', currentClub: 'Al-Nassr', league: 'Saudi Pro League', age: 32, internationalCaps: 99, peakClub: 'Liverpool', stats: { plAppearances: 221, clGoals: 38, careerGoals: 198, transferFeeM: 34, careerTrophies: 9 } },
  { id: 'lewandowski', name: 'Robert Lewandowski', nationality: 'Polish', flag: '🇵🇱', confederation: 'UEFA', position: 'ATT', currentClub: 'Barcelona', league: 'La Liga', age: 36, internationalCaps: 155, peakClub: 'Bayern Munich', stats: { plAppearances: 0, clGoals: 91, careerGoals: 650, transferFeeM: 45, careerTrophies: 29 } },
  { id: 'muller', name: 'Thomas Müller', nationality: 'German', flag: '🇩🇪', confederation: 'UEFA', position: 'ATT', currentClub: 'Bayern Munich', league: 'Bundesliga', age: 35, internationalCaps: 131, peakClub: 'Bayern Munich', stats: { plAppearances: 0, clGoals: 57, careerGoals: 233, transferFeeM: 25, careerTrophies: 28 } },
]
