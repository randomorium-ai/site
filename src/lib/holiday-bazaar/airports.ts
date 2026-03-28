export interface Airport {
  iata: string
  name: string
  city: string
  country: string
}

export const AIRPORTS: Airport[] = [
  // ── UK ───────────────────────────────────────────────────────────────────
  { iata: "LHR", name: "Heathrow", city: "London", country: "GB" },
  { iata: "LGW", name: "Gatwick", city: "London", country: "GB" },
  { iata: "STN", name: "Stansted", city: "London", country: "GB" },
  { iata: "LTN", name: "Luton", city: "London", country: "GB" },
  { iata: "LCY", name: "City", city: "London", country: "GB" },
  { iata: "MAN", name: "Manchester", city: "Manchester", country: "GB" },
  { iata: "BHX", name: "Birmingham", city: "Birmingham", country: "GB" },
  { iata: "EDI", name: "Edinburgh", city: "Edinburgh", country: "GB" },
  { iata: "GLA", name: "Glasgow", city: "Glasgow", country: "GB" },
  { iata: "BRS", name: "Bristol", city: "Bristol", country: "GB" },
  { iata: "LBA", name: "Leeds Bradford", city: "Leeds", country: "GB" },
  { iata: "NCL", name: "Newcastle", city: "Newcastle", country: "GB" },
  { iata: "BFS", name: "Belfast International", city: "Belfast", country: "GB" },
  { iata: "BHD", name: "Belfast City", city: "Belfast", country: "GB" },
  { iata: "ABZ", name: "Aberdeen", city: "Aberdeen", country: "GB" },
  { iata: "EMA", name: "East Midlands", city: "Nottingham", country: "GB" },
  { iata: "SOU", name: "Southampton", city: "Southampton", country: "GB" },
  { iata: "EXT", name: "Exeter", city: "Exeter", country: "GB" },
  { iata: "CWL", name: "Cardiff", city: "Cardiff", country: "GB" },
  { iata: "INV", name: "Inverness", city: "Inverness", country: "GB" },
  { iata: "HUY", name: "Humberside", city: "Hull", country: "GB" },
  { iata: "MME", name: "Teesside", city: "Middlesbrough", country: "GB" },
  { iata: "DSA", name: "Doncaster Sheffield", city: "Doncaster", country: "GB" },
  { iata: "NWI", name: "Norwich", city: "Norwich", country: "GB" },

  // ── Ireland ───────────────────────────────────────────────────────────────
  { iata: "DUB", name: "Dublin", city: "Dublin", country: "IE" },
  { iata: "ORK", name: "Cork", city: "Cork", country: "IE" },
  { iata: "SNN", name: "Shannon", city: "Shannon", country: "IE" },
  { iata: "KIR", name: "Kerry", city: "Kerry", country: "IE" },

  // ── France ───────────────────────────────────────────────────────────────
  { iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "FR" },
  { iata: "ORY", name: "Orly", city: "Paris", country: "FR" },
  { iata: "NCE", name: "Nice Côte d'Azur", city: "Nice", country: "FR" },
  { iata: "LYS", name: "Lyon Saint-Exupéry", city: "Lyon", country: "FR" },
  { iata: "MRS", name: "Marseille Provence", city: "Marseille", country: "FR" },
  { iata: "TLS", name: "Toulouse Blagnac", city: "Toulouse", country: "FR" },
  { iata: "BOD", name: "Bordeaux", city: "Bordeaux", country: "FR" },
  { iata: "NTE", name: "Nantes Atlantique", city: "Nantes", country: "FR" },

  // ── Germany ───────────────────────────────────────────────────────────────
  { iata: "FRA", name: "Frankfurt", city: "Frankfurt", country: "DE" },
  { iata: "MUC", name: "Munich", city: "Munich", country: "DE" },
  { iata: "BER", name: "Brandenburg", city: "Berlin", country: "DE" },
  { iata: "DUS", name: "Düsseldorf", city: "Düsseldorf", country: "DE" },
  { iata: "HAM", name: "Hamburg", city: "Hamburg", country: "DE" },
  { iata: "CGN", name: "Cologne Bonn", city: "Cologne", country: "DE" },
  { iata: "STR", name: "Stuttgart", city: "Stuttgart", country: "DE" },

  // ── Spain ────────────────────────────────────────────────────────────────
  { iata: "MAD", name: "Barajas", city: "Madrid", country: "ES" },
  { iata: "BCN", name: "El Prat", city: "Barcelona", country: "ES" },
  { iata: "AGP", name: "Málaga", city: "Málaga", country: "ES" },
  { iata: "ALC", name: "Alicante", city: "Alicante", country: "ES" },
  { iata: "PMI", name: "Palma de Mallorca", city: "Palma", country: "ES" },
  { iata: "IBZ", name: "Ibiza", city: "Ibiza", country: "ES" },
  { iata: "TFS", name: "Tenerife South", city: "Tenerife", country: "ES" },
  { iata: "LPA", name: "Gran Canaria", city: "Las Palmas", country: "ES" },
  { iata: "SVQ", name: "Seville", city: "Seville", country: "ES" },
  { iata: "VLC", name: "Valencia", city: "Valencia", country: "ES" },
  { iata: "SDR", name: "Santander", city: "Santander", country: "ES" },

  // ── Italy ────────────────────────────────────────────────────────────────
  { iata: "FCO", name: "Fiumicino", city: "Rome", country: "IT" },
  { iata: "MXP", name: "Malpensa", city: "Milan", country: "IT" },
  { iata: "LIN", name: "Linate", city: "Milan", country: "IT" },
  { iata: "BGY", name: "Orio al Serio", city: "Bergamo", country: "IT" },
  { iata: "VCE", name: "Marco Polo", city: "Venice", country: "IT" },
  { iata: "NAP", name: "Naples", city: "Naples", country: "IT" },
  { iata: "BLQ", name: "Guglielmo Marconi", city: "Bologna", country: "IT" },
  { iata: "FLR", name: "Peretola", city: "Florence", country: "IT" },
  { iata: "CTA", name: "Catania", city: "Catania", country: "IT" },
  { iata: "PMO", name: "Palermo", city: "Palermo", country: "IT" },

  // ── Netherlands ──────────────────────────────────────────────────────────
  { iata: "AMS", name: "Schiphol", city: "Amsterdam", country: "NL" },
  { iata: "EIN", name: "Eindhoven", city: "Eindhoven", country: "NL" },
  { iata: "RTM", name: "Rotterdam The Hague", city: "Rotterdam", country: "NL" },

  // ── Belgium ───────────────────────────────────────────────────────────────
  { iata: "BRU", name: "Zaventem", city: "Brussels", country: "BE" },
  { iata: "CRL", name: "Brussels South Charleroi", city: "Charleroi", country: "BE" },
  { iata: "ANR", name: "Antwerp", city: "Antwerp", country: "BE" },

  // ── Portugal ──────────────────────────────────────────────────────────────
  { iata: "LIS", name: "Humberto Delgado", city: "Lisbon", country: "PT" },
  { iata: "OPO", name: "Francisco de Sá Carneiro", city: "Porto", country: "PT" },
  { iata: "FAO", name: "Faro", city: "Faro", country: "PT" },
  { iata: "FNC", name: "Madeira", city: "Funchal", country: "PT" },
  { iata: "PDL", name: "Ponta Delgada", city: "Azores", country: "PT" },

  // ── Greece ────────────────────────────────────────────────────────────────
  { iata: "ATH", name: "Eleftherios Venizelos", city: "Athens", country: "GR" },
  { iata: "SKG", name: "Thessaloniki", city: "Thessaloniki", country: "GR" },
  { iata: "HER", name: "Nikos Kazantzakis", city: "Heraklion", country: "GR" },
  { iata: "RHO", name: "Diagoras", city: "Rhodes", country: "GR" },
  { iata: "CFU", name: "Ioannis Kapodistrias", city: "Corfu", country: "GR" },
  { iata: "JMK", name: "Mykonos", city: "Mykonos", country: "GR" },
  { iata: "JSI", name: "Skiathos", city: "Skiathos", country: "GR" },
  { iata: "ZTH", name: "Zakynthos", city: "Zakynthos", country: "GR" },

  // ── Switzerland ───────────────────────────────────────────────────────────
  { iata: "ZRH", name: "Zürich", city: "Zürich", country: "CH" },
  { iata: "GVA", name: "Geneva", city: "Geneva", country: "CH" },
  { iata: "BSL", name: "EuroAirport", city: "Basel", country: "CH" },

  // ── Austria ───────────────────────────────────────────────────────────────
  { iata: "VIE", name: "Vienna", city: "Vienna", country: "AT" },
  { iata: "SZG", name: "Salzburg", city: "Salzburg", country: "AT" },
  { iata: "INN", name: "Innsbruck", city: "Innsbruck", country: "AT" },

  // ── Scandinavia ───────────────────────────────────────────────────────────
  { iata: "CPH", name: "Kastrup", city: "Copenhagen", country: "DK" },
  { iata: "ARN", name: "Arlanda", city: "Stockholm", country: "SE" },
  { iata: "GOT", name: "Landvetter", city: "Gothenburg", country: "SE" },
  { iata: "OSL", name: "Gardermoen", city: "Oslo", country: "NO" },
  { iata: "BGO", name: "Flesland", city: "Bergen", country: "NO" },
  { iata: "HEL", name: "Helsinki-Vantaa", city: "Helsinki", country: "FI" },

  // ── Eastern Europe ────────────────────────────────────────────────────────
  { iata: "WAW", name: "Chopin", city: "Warsaw", country: "PL" },
  { iata: "KRK", name: "John Paul II", city: "Krakow", country: "PL" },
  { iata: "PRG", name: "Václav Havel", city: "Prague", country: "CZ" },
  { iata: "BUD", name: "Liszt Ferenc", city: "Budapest", country: "HU" },
  { iata: "OTP", name: "Henri Coandă", city: "Bucharest", country: "RO" },
  { iata: "SOF", name: "Sofia", city: "Sofia", country: "BG" },
  { iata: "BEG", name: "Nikola Tesla", city: "Belgrade", country: "RS" },
  { iata: "ZAG", name: "Franjo Tuđman", city: "Zagreb", country: "HR" },
  { iata: "DBV", name: "Dubrovnik", city: "Dubrovnik", country: "HR" },
  { iata: "SPU", name: "Split", city: "Split", country: "HR" },
  { iata: "RIX", name: "Riga", city: "Riga", country: "LV" },
  { iata: "TLL", name: "Lennart Meri", city: "Tallinn", country: "EE" },
  { iata: "VNO", name: "Vilnius", city: "Vilnius", country: "LT" },

  // ── Cyprus & Malta ────────────────────────────────────────────────────────
  { iata: "LCA", name: "Larnaca", city: "Larnaca", country: "CY" },
  { iata: "PFO", name: "Paphos", city: "Paphos", country: "CY" },
  { iata: "MLA", name: "Malta", city: "Valletta", country: "MT" },

  // ── Turkey ────────────────────────────────────────────────────────────────
  { iata: "IST", name: "Istanbul", city: "Istanbul", country: "TR" },
  { iata: "SAW", name: "Sabiha Gökçen", city: "Istanbul", country: "TR" },
  { iata: "AYT", name: "Antalya", city: "Antalya", country: "TR" },
  { iata: "DLM", name: "Dalaman", city: "Dalaman", country: "TR" },
  { iata: "BJV", name: "Bodrum", city: "Bodrum", country: "TR" },

  // ── Morocco ───────────────────────────────────────────────────────────────
  { iata: "CMN", name: "Mohammed V", city: "Casablanca", country: "MA" },
  { iata: "RAK", name: "Menara", city: "Marrakech", country: "MA" },
  { iata: "AGA", name: "Al Massira", city: "Agadir", country: "MA" },
  { iata: "FEZ", name: "Saïss", city: "Fez", country: "MA" },
]

export function searchAirports(query: string): Airport[] {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  return AIRPORTS.filter(
    (a) =>
      a.iata.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
  ).slice(0, 8)
}

export function getAirport(iata: string): Airport | undefined {
  return AIRPORTS.find((a) => a.iata === iata)
}
