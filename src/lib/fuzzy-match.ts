// Fuzzy player name matching for football games.
// Matches full name, surname, or first name — no Levenshtein (too loose for guessing games).

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .trim()
}

function parts(name: string): string[] {
  return norm(name).split(/\s+/).filter(Boolean)
}

export function fuzzyMatchPlayer(guess: string, playerName: string): boolean {
  const g = norm(guess)
  const n = norm(playerName)
  const np = parts(playerName)

  // Full name match
  if (g === n) return true

  // Surname match (last word)
  if (np.length > 0 && g === np[np.length - 1]) return true

  // First name match (first word)
  if (np.length > 1 && g === np[0]) return true

  // Hyphenated surname: "van dijk" matches "virgil van dijk"
  if (np.length > 2) {
    const lastName = np.slice(1).join(' ')
    if (g === lastName) return true
  }

  return false
}

// For club names — strips suffixes and normalises
export function normClubForMatch(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[–—-]/g, ' ')
    .replace(/\./g, '')
    .replace(/\b(fc|afc|wfc|rfc|sc|bsc|cf|nk|sk|if|bk|fk|mk|us|as|ac|ss)\b/g, ' ')
    .replace(/\s+(b|c|ii|2|castilla|atletic|reserves?|youth|u21|u23)\s*$/i, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Common shorthands for clubs
const CLUB_ALIASES: Record<string, string> = {
  'man utd': 'manchester united',
  'man united': 'manchester united',
  'man u': 'manchester united',
  'manchester utd': 'manchester united',
  'man city': 'manchester city',
  'spurs': 'tottenham hotspur',
  'tottenham': 'tottenham hotspur',
  'arsenal': 'arsenal',
  'chelsea': 'chelsea',
  'liverpool': 'liverpool',
  'inter': 'internazionale',
  'inter milan': 'internazionale',
  'psg': 'paris saint germain',
  'paris sg': 'paris saint germain',
  'barca': 'barcelona',
  'atletico': 'atletico madrid',
  'atleti': 'atletico madrid',
  'real': 'real madrid',
  'juve': 'juventus',
  'milan': 'ac milan',
  'wolves': 'wolverhampton wanderers',
  'west ham': 'west ham united',
  'newcastle': 'newcastle united',
  'villa': 'aston villa',
  'palace': 'crystal palace',
  'forest': 'nottingham forest',
  'city': '',  // too ambiguous — ignore
  'united': '', // too ambiguous — ignore
}

export function fuzzyMatchClub(guess: string, clubName: string): boolean {
  const g = normClubForMatch(guess)
  const n = normClubForMatch(clubName)

  if (g === n) return true

  // Check alias
  const alias = CLUB_ALIASES[g]
  if (alias && alias !== '' && alias === n) return true

  // Check if alias of clubName
  const clubAlias = CLUB_ALIASES[n]
  if (clubAlias && clubAlias !== '' && clubAlias === g) return true

  return false
}
