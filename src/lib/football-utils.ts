// Shared utilities for Football Games

// ── Nationality → flag emoji ───────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  Afghanistan: "🇦🇫", Albania: "🇦🇱", Algeria: "🇩🇿", Argentina: "🇦🇷",
  Armenia: "🇦🇲", Australia: "🇦🇺", Austria: "🇦🇹", Belgium: "🇧🇪",
  Bolivia: "🇧🇴", Bosnia: "🇧🇦", "Bosnia and Herzegovina": "🇧🇦",
  Brazil: "🇧🇷", Bulgaria: "🇧🇬", Cameroon: "🇨🇲", Canada: "🇨🇦",
  Chile: "🇨🇱", China: "🇨🇳", Colombia: "🇨🇴", "Costa Rica": "🇨🇷",
  Croatia: "🇭🇷", Cuba: "🇨🇺", "Czech Republic": "🇨🇿", Denmark: "🇩🇰",
  Ecuador: "🇪🇨", Egypt: "🇪🇬", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Estonia: "🇪🇪",
  Ethiopia: "🇪🇹", Finland: "🇫🇮", France: "🇫🇷", Gabon: "🇬🇦",
  Georgia: "🇬🇪", Germany: "🇩🇪", Ghana: "🇬🇭", Greece: "🇬🇷",
  Guinea: "🇬🇳", "Guinea-Bissau": "🇬🇼", Honduras: "🇭🇳",
  Hungary: "🇭🇺", Iceland: "🇮🇸", India: "🇮🇳", Indonesia: "🇮🇩",
  Iran: "🇮🇷", Iraq: "🇮🇶", Ireland: "🇮🇪", Israel: "🇮🇱",
  Italy: "🇮🇹", "Ivory Coast": "🇨🇮", Jamaica: "🇯🇲", Japan: "🇯🇵",
  Jordan: "🇯🇴", Kazakhstan: "🇰🇿", Kenya: "🇰🇪", Kosovo: "🇽🇰",
  Latvia: "🇱🇻", Lebanon: "🇱🇧", Liberia: "🇱🇷", Libya: "🇱🇾",
  Lithuania: "🇱🇹", Luxembourg: "🇱🇺", Mali: "🇲🇱", Malta: "🇲🇹",
  Mexico: "🇲🇽", Moldova: "🇲🇩", Montenegro: "🇲🇪", Morocco: "🇲🇦",
  Mozambique: "🇲🇿", Namibia: "🇳🇦", Netherlands: "🇳🇱",
  "New Zealand": "🇳🇿", Nicaragua: "🇳🇮", Nigeria: "🇳🇬", Norway: "🇳🇴",
  Panama: "🇵🇦", Paraguay: "🇵🇾", Peru: "🇵🇪", Poland: "🇵🇱",
  Portugal: "🇵🇹", Romania: "🇷🇴", Russia: "🇷🇺", "Saudi Arabia": "🇸🇦",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Senegal: "🇸🇳", Serbia: "🇷🇸",
  "Sierra Leone": "🇸🇱", Slovakia: "🇸🇰", Slovenia: "🇸🇮",
  Somalia: "🇸🇴", "South Korea": "🇰🇷", Spain: "🇪🇸", Sudan: "🇸🇩",
  Sweden: "🇸🇪", Switzerland: "🇨🇭", Tanzania: "🇹🇿", "Trinidad and Tobago": "🇹🇹",
  Tunisia: "🇹🇳", Turkey: "🇹🇷", Uganda: "🇺🇬", Ukraine: "🇺🇦",
  "United States": "🇺🇸", Uruguay: "🇺🇾", Venezuela: "🇻🇪",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", Zambia: "🇿🇲", Zimbabwe: "🇿🇼",
}

export function nationalityFlag(nationality: string): string {
  return FLAG_MAP[nationality] ?? "🏳️"
}

// ── Position colours ───────────────────────────────────────────────────────

export const POS_COLOR: Record<string, string> = {
  GK:  "bg-amber-500 text-white",
  DEF: "bg-blue-600 text-white",
  MID: "bg-[#1a7a3e] text-white",
  ATT: "bg-red-600 text-white",
}

// ── Themed score tiers ─────────────────────────────────────────────────────
// score 0-1000, 5 tiers: <250 / 250-499 / 500-749 / 750-949 / 950+

const SCORE_TIERS: Record<string, [string, string, string, string, string]> = {
  goals: [
    "Tap-in merchant",
    "Poacher's return",
    "20-a-season man",
    "Golden Boot contender",
    "Smashing goalscoring records",
  ],
  assists: [
    "Hoofed it forward",
    "Lucky deflection",
    "Pulling strings",
    "Vizier of the final third",
    "Cesc would be proud",
  ],
  appearances: [
    "Sunday League sub",
    "League Two journeyman",
    "Premier League regular",
    "One-club legend",
    "You've forgotten more caps than most earn",
  ],
  minutes: [
    "Injury-prone winger",
    "Rotated heavily",
    "Solid squad player",
    "Never misses a minute",
    "Physio's nightmare, manager's dream",
  ],
  caps: [
    "Didn't make the squad",
    "One-cap wonder",
    "Regular starter",
    "Vice captain material",
    "First name on the teamsheet",
  ],
  clean_sheets: [
    "Sieve",
    "Dodgy on crosses",
    "Solid enough",
    "Commands his area",
    "Wondersave",
  ],
}

const FALLBACK_TIERS: [string, string, string, string, string] = [
  "Sunday League",
  "Could've Gone Pro",
  "Lower Leagues",
  "Championship Standard",
  "Premier League Quality",
]

export function scoreLabel(score: number, themeId: string): string {
  const tiers = SCORE_TIERS[themeId] ?? FALLBACK_TIERS
  if (score >= 950) return tiers[4]
  if (score >= 750) return tiers[3]
  if (score >= 500) return tiers[2]
  if (score >= 250) return tiers[1]
  return tiers[0]
}
