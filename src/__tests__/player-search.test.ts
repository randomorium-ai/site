// Tests for the new player-search layer.
//
// These tests verify that the searchPlayers function correctly finds players
// from players.json (populated by the build script). Until the build script
// has been run and players.json contains real data, these tests will be skipped
// if the dataset is empty.

import { searchPlayers, findPlayerById, findPlayerByName } from "@/lib/player-search"

// Skip all tests if players.json is empty (pre-build)
const PLAYERS_LOADED = searchPlayers("kane").length > 0

const maybeDescribe = PLAYERS_LOADED ? describe : describe.skip

// ── Iconic players ────────────────────────────────────────────────────────────

maybeDescribe("Iconic players", () => {
  test("Harry Kane found and has career goals", () => {
    const results = searchPlayers("harry kane")
    expect(results.length).toBeGreaterThan(0)
    const kane = results[0]
    expect(kane.name).toMatch(/harry kane/i)
    expect(kane.career_goals).toBeGreaterThan(150)
    expect(kane.career_apps).toBeGreaterThan(300)
    expect(kane.nationality).toBe("England")
  })

  test("Lionel Messi found", () => {
    const results = searchPlayers("messi")
    expect(results.length).toBeGreaterThan(0)
    const messi = results.find((p) => /messi/i.test(p.name))
    expect(messi).toBeDefined()
    expect(messi!.career_goals).toBeGreaterThan(500)
    expect(messi!.nationality).toBe("Argentina")
  })

  test("Cristiano Ronaldo found", () => {
    const results = searchPlayers("cristiano ronaldo")
    expect(results.length).toBeGreaterThan(0)
    const cr7 = results.find((p) => /ronaldo/i.test(p.name))
    expect(cr7).toBeDefined()
    expect(cr7!.career_goals).toBeGreaterThan(500)
    expect(cr7!.nationality).toBe("Portugal")
  })

  test("Erling Haaland found", () => {
    const results = searchPlayers("haaland")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/haaland/i)
    expect(results[0].nationality).toBe("Norway")
  })

  test("Kylian Mbappé found", () => {
    const results = searchPlayers("mbappe")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/mbapp/i)
    expect(results[0].nationality).toBe("France")
  })

  test("Luka Modrić found", () => {
    const results = searchPlayers("modric")
    expect(results.length).toBeGreaterThan(0)
    const modric = results.find((p) => /modri/i.test(p.name))
    expect(modric).toBeDefined()
    expect(modric!.nationality).toBe("Croatia")
    expect(modric!.international_caps).toBeGreaterThan(80)
  })

  test("Vinícius Júnior found", () => {
    const results = searchPlayers("vinicius")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].nationality).toBe("Brazil")
  })

  test("İlkay Gündoğan found", () => {
    const results = searchPlayers("gundogan")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/g[uü]ndo[gğ]an/i)
  })
})

// ── Alias resolution ──────────────────────────────────────────────────────────

maybeDescribe("Alias resolution", () => {
  test("cr7 → Cristiano Ronaldo", () => {
    const results = searchPlayers("cr7")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/cristiano ronaldo/i)
  })

  test("lewa → Robert Lewandowski", () => {
    const results = searchPlayers("lewa")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/lewandowski/i)
  })

  test("kdb → Kevin De Bruyne", () => {
    const results = searchPlayers("kdb")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/de bruyne/i)
  })

  test("vini jr → Vinícius Júnior", () => {
    const results = searchPlayers("vini jr")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/vin[ií]cius/i)
  })
})

// ── Recent breakouts ──────────────────────────────────────────────────────────

maybeDescribe("Recent breakouts", () => {
  test("Bukayo Saka found", () => {
    const results = searchPlayers("saka")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/saka/i)
    expect(results[0].nationality).toBe("England")
  })

  test("Jude Bellingham found", () => {
    const results = searchPlayers("bellingham")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/bellingham/i)
  })

  test("Florian Wirtz found", () => {
    const results = searchPlayers("wirtz")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/wirtz/i)
    expect(results[0].nationality).toBe("Germany")
  })

  test("Lamine Yamal found", () => {
    const results = searchPlayers("yamal")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/yamal/i)
    expect(results[0].nationality).toBe("Spain")
  })
})

// ── Semi-obscure current players ──────────────────────────────────────────────

maybeDescribe("Semi-obscure current players", () => {
  test("Reece James found", () => {
    const results = searchPlayers("reece james")
    expect(results.length).toBeGreaterThan(0)
    const reece = results.find((p) => /reece.*james/i.test(p.name))
    expect(reece).toBeDefined()
    expect(reece!.nationality).toBe("England")
  })

  test("Che Adams found", () => {
    const results = searchPlayers("che adams")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/adams/i)
  })

  test("Daniel James found", () => {
    const results = searchPlayers("daniel james")
    expect(results.length).toBeGreaterThan(0)
    const dj = results.find((p) => /daniel.*james/i.test(p.name))
    expect(dj).toBeDefined()
  })

  test("Maxwel Cornet found", () => {
    const results = searchPlayers("cornet")
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((p) => /cornet/i.test(p.name))).toBe(true)
  })

  test("Josh Maja found", () => {
    const results = searchPlayers("maja")
    expect(results.some((p) => /maja/i.test(p.name))).toBe(true)
  })
})

// ── Retired legends ───────────────────────────────────────────────────────────

maybeDescribe("Retired legends", () => {
  test("Ronaldo (Brazilian) found", () => {
    const results = searchPlayers("ronaldo")
    expect(results.length).toBeGreaterThan(0)
    const r9 = results.find((p) => p.nationality === "Brazil" && /ronaldo/i.test(p.name) && p.retired)
    expect(r9).toBeDefined()
  })

  test("Emile Heskey found", () => {
    const results = searchPlayers("heskey")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/heskey/i)
    expect(results[0].nationality).toBe("England")
    expect(results[0].retired).toBe(true)
  })

  test("Jonjo Shelvey found", () => {
    const results = searchPlayers("shelvey")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/shelvey/i)
  })

  test("Patrick Vieira found", () => {
    const results = searchPlayers("vieira")
    expect(results.length).toBeGreaterThan(0)
    const vieira = results.find((p) => /patrick.*vieira/i.test(p.name))
    expect(vieira).toBeDefined()
    expect(vieira!.nationality).toBe("France")
  })

  test("Ruud van Nistelrooy found", () => {
    const results = searchPlayers("van nistelrooy")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/nistelrooy/i)
  })

  test("Michael Owen found", () => {
    const results = searchPlayers("michael owen")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toMatch(/michael.*owen/i)
    expect(results[0].nationality).toBe("England")
  })
})

// ── Player schema ─────────────────────────────────────────────────────────────

maybeDescribe("Player schema completeness", () => {
  test("Player has all required fields", () => {
    const results = searchPlayers("kane")
    const p = results[0]
    expect(p.id).toBeTruthy()
    expect(p.name).toBeTruthy()
    expect(p.nationality).toBeTruthy()
    expect(p.confederation).toMatch(/^(UEFA|CONMEBOL|CONCACAF|CAF|AFC|OFC)$/)
    expect(typeof p.age).toBe("number")
    expect(p.position).toMatch(/^(GK|DEF|MID|ATT)$/)
    expect(typeof p.retired).toBe("boolean")
    expect(Array.isArray(p.career_clubs)).toBe(true)
    expect(typeof p.career_goals).toBe("number")
    expect(typeof p.career_apps).toBe("number")
    expect(typeof p.popularity_score).toBe("number")
    expect(p.popularity_score).toBeGreaterThan(0)
    expect(p.wikipedia_url).toMatch(/^https:\/\/en\.wikipedia\.org/)
  })

  test("Career clubs have correct shape", () => {
    const results = searchPlayers("harry kane")
    const kane = results[0]
    expect(kane.career_clubs.length).toBeGreaterThan(0)
    const club = kane.career_clubs[0]
    expect(club.club).toBeTruthy()
    expect(typeof club.from).toBe("number")
    expect(club.from).toBeGreaterThan(2000)
  })

  test("Popularity ranking: Ronaldo/Messi above obscure players", () => {
    const ronaldo = searchPlayers("cristiano ronaldo")[0]
    const heskey = searchPlayers("heskey")[0]
    if (ronaldo && heskey) {
      expect(ronaldo.popularity_score).toBeGreaterThan(heskey.popularity_score)
    }
  })
})

// ── Lookups ───────────────────────────────────────────────────────────────────

maybeDescribe("Lookups", () => {
  test("findPlayerById works", () => {
    const results = searchPlayers("harry kane")
    if (results.length === 0) return
    const kane = results[0]
    const found = findPlayerById(kane.id)
    expect(found).toBeDefined()
    expect(found!.name).toBe(kane.name)
  })

  test("findPlayerByName works", () => {
    const results = searchPlayers("messi")
    if (results.length === 0) return
    const messi = results[0]
    const found = findPlayerByName(messi.name)
    expect(found).toBeDefined()
    expect(found!.id).toBe(messi.id)
  })
})

// ── Empty dataset graceful degradation ───────────────────────────────────────

describe("Empty dataset (pre-build safety)", () => {
  test("searchPlayers returns empty array for short queries", () => {
    const results = searchPlayers("x")
    expect(results).toEqual([])
  })

  test("findPlayerById returns undefined for unknown id", () => {
    const result = findPlayerById("totally-unknown-player-id-xyz")
    expect(result).toBeUndefined()
  })
})
