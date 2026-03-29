import { searchLocal } from "@/lib/football-search"

// ── Helpers ────────────────────────────────────────────────────────────────

function findByName(results: ReturnType<typeof searchLocal>, name: string) {
  const normName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return results.find(p => {
    const normResult = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return normResult === normName || normResult.includes(normName) || normName.includes(normResult)
  })
}

// ── Core test players ──────────────────────────────────────────────────────
// All of these must return a match on first AND subsequent calls.

describe("searchLocal — core players", () => {
  const testCases: [string, string][] = [
    ["harry kane",      "Harry Kane"],
    ["lionel messi",    "Lionel Messi"],
    ["reece james",     "Reece James"],
    ["erling haaland",  "Erling Haaland"],
    ["kylian mbappe",   "Kylian Mbappe"],
    ["luka modric",     "Luka Modric"],
    ["vinicius junior", "Vinicius Junior"],
    ["ilkay gundogan",  "Ilkay Gundogan"],
  ]

  test.each(testCases)('"%s" finds %s', (query, expectedName) => {
    const results = searchLocal(query)
    expect(results.length).toBeGreaterThan(0)
    const match = findByName(results, expectedName)
    expect(match).toBeDefined()
  })

  // Subsequent call — module-level singleton must remain populated
  test.each(testCases)('"%s" finds %s on second call', (query, expectedName) => {
    const results = searchLocal(query)
    expect(results.length).toBeGreaterThan(0)
    const match = findByName(results, expectedName)
    expect(match).toBeDefined()
  })
})

// ── Alias / nickname searches ──────────────────────────────────────────────

describe("searchLocal — aliases and nicknames", () => {
  test("cr7 → Cristiano Ronaldo", () => {
    const results = searchLocal("cr7")
    const match = findByName(results, "Cristiano Ronaldo")
    expect(match).toBeDefined()
  })

  test("lewa → Robert Lewandowski", () => {
    const results = searchLocal("lewa")
    const match = findByName(results, "Robert Lewandowski")
    expect(match).toBeDefined()
  })

  test("kdb → Kevin De Bruyne", () => {
    const results = searchLocal("kdb")
    const match = findByName(results, "Kevin De Bruyne")
    expect(match).toBeDefined()
  })

  test("vini → Vinicius Junior", () => {
    const results = searchLocal("vini")
    const match = findByName(results, "Vinicius Junior")
    expect(match).toBeDefined()
  })

  test("vini jr → Vinicius Junior", () => {
    const results = searchLocal("vini jr")
    const match = findByName(results, "Vinicius Junior")
    expect(match).toBeDefined()
  })
})

// ── Accent normalisation ──────────────────────────────────────────────────

describe("searchLocal — accent normalisation", () => {
  test("modric (no accent) finds Luka Modrić", () => {
    const results = searchLocal("modric")
    expect(results.length).toBeGreaterThan(0)
    const match = findByName(results, "Luka Modric")
    expect(match).toBeDefined()
  })

  test("mbappe (no accent) finds Kylian Mbappé", () => {
    const results = searchLocal("mbappe")
    const match = findByName(results, "Kylian Mbappe")
    expect(match).toBeDefined()
  })
})

// ── First-name only searches ───────────────────────────────────────────────

describe("searchLocal — first-name searches", () => {
  test("erling returns Erling Haaland", () => {
    const results = searchLocal("erling")
    const match = findByName(results, "Erling Haaland")
    expect(match).toBeDefined()
  })

  test("kylian returns Kylian Mbappe", () => {
    const results = searchLocal("kylian")
    const match = findByName(results, "Kylian Mbappe")
    expect(match).toBeDefined()
  })

  test("luka returns Luka Modric", () => {
    const results = searchLocal("luka")
    const match = findByName(results, "Luka Modric")
    expect(match).toBeDefined()
  })
})

// ── Career stats populated for popular players ────────────────────────────

describe("searchLocal — career stats", () => {
  test("Messi result has career goals > 0", () => {
    const results = searchLocal("lionel messi")
    const messi = results[0]
    expect(messi.stats.careerGoals).toBeGreaterThan(0)
  })

  test("Haaland result has career appearances > 0", () => {
    const results = searchLocal("erling haaland")
    const player = findByName(results, "Erling Haaland")
    expect(player).toBeDefined()
    expect(player!.stats.careerApps).toBeGreaterThan(0)
  })

  test("Ronaldo alias (cr7) result has career goals > 0", () => {
    const results = searchLocal("cr7")
    const cr7 = results[0]
    expect(cr7.stats.careerGoals).toBeGreaterThan(0)
  })
})

// ── currentTeam field present for active players ──────────────────────────

describe("searchLocal — currentTeam", () => {
  test("Haaland has a currentTeam", () => {
    const results = searchLocal("erling haaland")
    const player = findByName(results, "Erling Haaland")
    expect(player).toBeDefined()
    expect(player!.currentTeam).toBeTruthy()
    expect(player!.currentTeam).not.toBe("")
  })

  test("Mbappe has a currentTeam", () => {
    const results = searchLocal("mbappe")
    const player = findByName(results, "Kylian Mbappe")
    expect(player).toBeDefined()
    expect(player!.currentTeam).toBeTruthy()
  })
})

// ── Result shape ──────────────────────────────────────────────────────────

describe("searchLocal — result shape", () => {
  test("returns full first+last name (not abbreviated)", () => {
    const results = searchLocal("erling haaland")
    const player = findByName(results, "Erling Haaland")
    expect(player).toBeDefined()
    // Must contain both parts — no "E. Haaland" style abbreviation
    expect(player!.name).toMatch(/erling/i)
    expect(player!.name).toMatch(/haaland/i)
  })

  test("empty query returns empty array", () => {
    expect(searchLocal("")).toHaveLength(0)
    expect(searchLocal("a")).toHaveLength(0)
  })

  test("short query (1 char) returns empty array", () => {
    expect(searchLocal("x")).toHaveLength(0)
  })
})
