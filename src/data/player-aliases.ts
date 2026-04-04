// Player nicknames and aliases — maps a normalised alias to the canonical
// name used in players.json. Extend this file as new nicknames emerge.
//
// Keys must be lowercase with accents stripped (normalised).
// Values must exactly match a `name` field in players.json.

export const PLAYER_ALIASES: Record<string, string> = {
  // ── Cristiano Ronaldo ─────────────────────────────────────────────────
  "cr7":            "Cristiano Ronaldo",
  "siuuu":          "Cristiano Ronaldo",
  "cr":             "Cristiano Ronaldo",

  // ── Robert Lewandowski ────────────────────────────────────────────────
  "lewa":           "Robert Lewandowski",
  "lewandowski":    "Robert Lewandowski",

  // ── Kevin De Bruyne ───────────────────────────────────────────────────
  "kdb":            "Kevin De Bruyne",
  "de bruyne":      "Kevin De Bruyne",

  // ── Vinícius Júnior ───────────────────────────────────────────────────
  "vini":           "Vinicius Junior",
  "vini jr":        "Vinicius Junior",
  "vinicius":       "Vinicius Junior",
  "vinicius jr":    "Vinicius Junior",

  // ── Lionel Messi ──────────────────────────────────────────────────────
  "goat":           "Lionel Messi",
  "leo":            "Lionel Messi",
  "leo messi":      "Lionel Messi",

  // ── Erling Haaland ────────────────────────────────────────────────────
  "haaland":        "Erling Haaland",
  "erling":         "Erling Haaland",

  // ── Kylian Mbappé ─────────────────────────────────────────────────────
  "mbappe":         "Kylian Mbappe",
  "kylian":         "Kylian Mbappe",

  // ── Luka Modrić ───────────────────────────────────────────────────────
  "modric":         "Luka Modric",
  "luka":           "Luka Modric",

  // ── Mohamed Salah ─────────────────────────────────────────────────────
  "mo salah":       "Mohamed Salah",
  "salah":          "Mohamed Salah",

  // ── Neymar ────────────────────────────────────────────────────────────
  "neymar jr":      "Neymar",
  "ney":            "Neymar",

  // ── Ronaldo (Brazilian) ───────────────────────────────────────────────
  "r9":             "Ronaldo",
  "ronaldo nazario":"Ronaldo",
  "el fenomeno":    "Ronaldo",

  // ── Ronaldinho ────────────────────────────────────────────────────────
  "dinho":          "Ronaldinho",
  "gaucho":         "Ronaldinho",

  // ── Karim Benzema ─────────────────────────────────────────────────────
  "benzema":        "Karim Benzema",
  "benz":           "Karim Benzema",

  // ── Harry Kane ────────────────────────────────────────────────────────
  "kane":           "Harry Kane",
  "harry":          "Harry Kane",

  // ── Sadio Mané ────────────────────────────────────────────────────────
  "mane":           "Sadio Mane",
  "sadio":          "Sadio Mane",

  // ── Mohamed Salah (already above) ────────────────────────────────────

  // ── Jude Bellingham ───────────────────────────────────────────────────
  "bellingham":     "Jude Bellingham",
  "jude":           "Jude Bellingham",

  // ── Son Heung-min ─────────────────────────────────────────────────────
  "sonny":          "Son Heung-min",
  "son":            "Son Heung-min",

  // ── Thomas Müller ─────────────────────────────────────────────────────
  "muller":         "Thomas Muller",
  "muller thomas":  "Thomas Muller",

  // ── Ilkay Gündoğan ───────────────────────────────────────────────────
  "gundo":          "Ilkay Gundogan",
  "gundogan":       "Ilkay Gundogan",

  // ── Bukayo Saka ───────────────────────────────────────────────────────
  "saka":           "Bukayo Saka",

  // ── Phil Foden ────────────────────────────────────────────────────────
  "foden":          "Phil Foden",

  // ── Declan Rice ───────────────────────────────────────────────────────
  "dec":            "Declan Rice",
  "declan":         "Declan Rice",

  // ── Rodri ─────────────────────────────────────────────────────────────
  "rodri":          "Rodri",

  // ── Toni Kroos ────────────────────────────────────────────────────────
  "kroos":          "Toni Kroos",

  // ── Thierry Henry ─────────────────────────────────────────────────────
  "henry":          "Thierry Henry",
  "titi":           "Thierry Henry",

  // ── Zinedine Zidane ───────────────────────────────────────────────────
  "zizou":          "Zinedine Zidane",
  "zidane":         "Zinedine Zidane",
}
