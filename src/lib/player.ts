// Master player type — the single source of truth for all football games.
// Populated by /scripts/build-player-db.ts (Wikipedia-sourced).

export interface CareerClub {
  club: string
  from: number
  to: number | null   // null = currently active at this club
  apps: number
  goals: number
}

export interface Player {
  id: string            // url-slug: "harry-kane"
  name: string          // "Harry Kane"
  nationality: string   // "England"
  confederation: string // "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC"
  dob: string           // "1993-07-28"
  age: number
  position: 'GK' | 'DEF' | 'MID' | 'ATT'
  current_club: string  // "" if retired
  retired: boolean
  career_clubs: CareerClub[]
  career_goals: number
  career_apps: number
  international_caps: number
  international_goals: number
  peak_club: string     // club with most career appearances
  popularity_score: number  // sum of Wikipedia pageviews 2016–2026
  wikipedia_url: string
}

// ── Utilities ──────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function normalise(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Map ISO 3166-1 alpha-3 (and common Wikipedia codes) → country name
export const ISO_TO_COUNTRY: Record<string, string> = {
  ENG: 'England', ESP: 'Spain', GER: 'Germany', FRA: 'France',
  ITA: 'Italy', POR: 'Portugal', NED: 'Netherlands', BEL: 'Belgium',
  BRA: 'Brazil', ARG: 'Argentina', URU: 'Uruguay', COL: 'Colombia',
  CHI: 'Chile', PAR: 'Paraguay', PER: 'Peru', ECU: 'Ecuador',
  VEN: 'Venezuela', BOL: 'Bolivia',
  USA: 'United States', MEX: 'Mexico', CAN: 'Canada',
  CRC: 'Costa Rica', JAM: 'Jamaica', TRI: 'Trinidad and Tobago',
  NGA: 'Nigeria', GHA: 'Ghana', SEN: 'Senegal', EGY: 'Egypt',
  CMR: 'Cameroon', MAR: 'Morocco', ALG: 'Algeria', TUN: 'Tunisia',
  CIV: 'Ivory Coast', MLI: 'Mali', COD: 'DR Congo', GAB: 'Gabon',
  JPN: 'Japan', KOR: 'South Korea', AUS: 'Australia', CHN: 'China',
  IRN: 'Iran', SAU: 'Saudi Arabia', UAE: 'United Arab Emirates',
  CRO: 'Croatia', POL: 'Poland', DEN: 'Denmark', SWE: 'Sweden',
  NOR: 'Norway', SCO: 'Scotland', WAL: 'Wales', NIR: 'Northern Ireland',
  IRL: 'Ireland', AUT: 'Austria', SUI: 'Switzerland', GRE: 'Greece',
  TUR: 'Turkey', RUS: 'Russia', UKR: 'Ukraine', CZE: 'Czech Republic',
  SVK: 'Slovakia', HUN: 'Hungary', ROU: 'Romania', BUL: 'Bulgaria',
  SRB: 'Serbia', MNE: 'Montenegro', ALB: 'Albania', BIH: 'Bosnia and Herzegovina',
  SVN: 'Slovenia', MKD: 'North Macedonia', KSV: 'Kosovo', ISL: 'Iceland',
  FIN: 'Finland', EST: 'Estonia', LAT: 'Latvia', LTU: 'Lithuania',
  LUX: 'Luxembourg', AND: 'Andorra', MLT: 'Malta',
}

// Nationality adjective → country name (for Wikipedia description parsing)
export const ADJECTIVE_TO_COUNTRY: Record<string, string> = {
  english: 'England', spanish: 'Spain', german: 'Germany', french: 'France',
  italian: 'Italy', portuguese: 'Portugal', dutch: 'Netherlands', belgian: 'Belgium',
  brazilian: 'Brazil', argentine: 'Argentina', argentinian: 'Argentina',
  uruguayan: 'Uruguay', colombian: 'Colombia', chilean: 'Chile',
  paraguayan: 'Paraguay', peruvian: 'Peru', ecuadorian: 'Ecuador', ecuadorean: 'Ecuador',
  venezuelan: 'Venezuela', bolivian: 'Bolivia',
  american: 'United States', mexican: 'Mexico', canadian: 'Canada',
  'costa rican': 'Costa Rica', jamaican: 'Jamaica',
  nigerian: 'Nigeria', ghanaian: 'Ghana', senegalese: 'Senegal', egyptian: 'Egypt',
  cameroonian: 'Cameroon', moroccan: 'Morocco', algerian: 'Algeria', tunisian: 'Tunisia',
  ivorian: 'Ivory Coast', malian: 'Mali', congolese: 'DR Congo', gabonese: 'Gabon',
  japanese: 'Japan', 'south korean': 'South Korea', korean: 'South Korea',
  australian: 'Australia', chinese: 'China', iranian: 'Iran', saudi: 'Saudi Arabia',
  croatian: 'Croatia', polish: 'Poland', danish: 'Denmark', swedish: 'Sweden',
  norwegian: 'Norway', scottish: 'Scotland', welsh: 'Wales', irish: 'Ireland',
  austrian: 'Austria', swiss: 'Switzerland', greek: 'Greece', turkish: 'Turkey',
  russian: 'Russia', ukrainian: 'Ukraine', czech: 'Czech Republic',
  slovak: 'Slovakia', hungarian: 'Hungary', romanian: 'Romania', bulgarian: 'Bulgaria',
  serbian: 'Serbia', montenegrin: 'Montenegro', albanian: 'Albania',
  bosnian: 'Bosnia and Herzegovina', slovenian: 'Slovenia', macedonian: 'North Macedonia',
  icelandic: 'Iceland', finnish: 'Finland',
}

// Country → confederation
export const COUNTRY_TO_CONFEDERATION: Record<string, string> = {
  England: 'UEFA', Spain: 'UEFA', Germany: 'UEFA', France: 'UEFA', Italy: 'UEFA',
  Portugal: 'UEFA', Netherlands: 'UEFA', Belgium: 'UEFA', Scotland: 'UEFA',
  Wales: 'UEFA', Ireland: 'UEFA', 'Northern Ireland': 'UEFA', Croatia: 'UEFA',
  Poland: 'UEFA', Denmark: 'UEFA', Sweden: 'UEFA', Norway: 'UEFA', Austria: 'UEFA',
  Switzerland: 'UEFA', Greece: 'UEFA', Turkey: 'UEFA', Russia: 'UEFA',
  Ukraine: 'UEFA', 'Czech Republic': 'UEFA', Slovakia: 'UEFA', Hungary: 'UEFA',
  Romania: 'UEFA', Bulgaria: 'UEFA', Serbia: 'UEFA', Montenegro: 'UEFA',
  Albania: 'UEFA', 'Bosnia and Herzegovina': 'UEFA', Slovenia: 'UEFA',
  'North Macedonia': 'UEFA', Kosovo: 'UEFA', Iceland: 'UEFA', Finland: 'UEFA',
  Estonia: 'UEFA', Latvia: 'UEFA', Lithuania: 'UEFA', Luxembourg: 'UEFA',
  Malta: 'UEFA', Andorra: 'UEFA',
  Brazil: 'CONMEBOL', Argentina: 'CONMEBOL', Uruguay: 'CONMEBOL', Colombia: 'CONMEBOL',
  Chile: 'CONMEBOL', Paraguay: 'CONMEBOL', Peru: 'CONMEBOL', Ecuador: 'CONMEBOL',
  Venezuela: 'CONMEBOL', Bolivia: 'CONMEBOL',
  'United States': 'CONCACAF', Mexico: 'CONCACAF', Canada: 'CONCACAF',
  'Costa Rica': 'CONCACAF', Jamaica: 'CONCACAF', 'Trinidad and Tobago': 'CONCACAF',
  Honduras: 'CONCACAF', Guatemala: 'CONCACAF', Panama: 'CONCACAF',
  Nigeria: 'CAF', Ghana: 'CAF', Senegal: 'CAF', Egypt: 'CAF', Cameroon: 'CAF',
  Morocco: 'CAF', Algeria: 'CAF', Tunisia: 'CAF', 'Ivory Coast': 'CAF', Mali: 'CAF',
  'DR Congo': 'CAF', Gabon: 'CAF', 'Sierra Leone': 'CAF', Liberia: 'CAF',
  Zimbabwe: 'CAF', Zambia: 'CAF', Kenya: 'CAF', Uganda: 'CAF', Ethiopia: 'CAF',
  Japan: 'AFC', 'South Korea': 'AFC', Australia: 'AFC', China: 'AFC',
  Iran: 'AFC', 'Saudi Arabia': 'AFC', 'United Arab Emirates': 'AFC',
  Qatar: 'AFC', Iraq: 'AFC', Jordan: 'AFC', Uzbekistan: 'AFC',
}
