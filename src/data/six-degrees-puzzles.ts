export interface SixDegreesPuzzle {
  a: { name: string; team: string }
  b: { name: string; team: string }
}

export const PUZZLES: SixDegreesPuzzle[] = [
  { a: { name: "Erling Haaland", team: "Manchester City" }, b: { name: "Mohamed Salah", team: "Liverpool" } },
  { a: { name: "Kylian Mbappe", team: "Real Madrid" }, b: { name: "Bukayo Saka", team: "Arsenal" } },
  { a: { name: "Harry Kane", team: "Bayern Munich" }, b: { name: "Vinicius Junior", team: "Real Madrid" } },
  { a: { name: "Lamine Yamal", team: "Barcelona" }, b: { name: "Marcus Rashford", team: "Aston Villa" } },
  { a: { name: "Rodri", team: "Manchester City" }, b: { name: "Pedri", team: "Barcelona" } },
  { a: { name: "Jude Bellingham", team: "Real Madrid" }, b: { name: "Phil Foden", team: "Manchester City" } },
  { a: { name: "Victor Osimhen", team: "Galatasaray" }, b: { name: "Rafael Leao", team: "AC Milan" } },
  { a: { name: "Khvicha Kvaratskhelia", team: "Paris Saint Germain" }, b: { name: "Alejandro Garnacho", team: "Manchester United" } },
  { a: { name: "Florian Wirtz", team: "Bayer Leverkusen" }, b: { name: "Jamal Musiala", team: "Bayern Munich" } },
  { a: { name: "Ruben Dias", team: "Manchester City" }, b: { name: "Virgil van Dijk", team: "Liverpool" } },
  { a: { name: "Trent Alexander-Arnold", team: "Real Madrid" }, b: { name: "Declan Rice", team: "Arsenal" } },
  { a: { name: "Antoine Griezmann", team: "Atletico Madrid" }, b: { name: "Olivier Giroud", team: "Los Angeles FC" } },
  { a: { name: "Gavi", team: "Barcelona" }, b: { name: "Eduardo Camavinga", team: "Real Madrid" } },
  { a: { name: "Son Heung-min", team: "Tottenham" }, b: { name: "Ivan Toney", team: "Al Ahli" } },
  { a: { name: "Darwin Nunez", team: "Liverpool" }, b: { name: "Rasmus Hojlund", team: "Manchester United" } },
  { a: { name: "Bruno Fernandes", team: "Manchester United" }, b: { name: "Martin Odegaard", team: "Arsenal" } },
  { a: { name: "Lautaro Martinez", team: "Inter Milan" }, b: { name: "Dusan Vlahovic", team: "Juventus" } },
  { a: { name: "Bernardo Silva", team: "Manchester City" }, b: { name: "Diogo Jota", team: "Liverpool" } },
  { a: { name: "Christopher Nkunku", team: "Chelsea" }, b: { name: "Ousmane Dembele", team: "Paris Saint Germain" } },
  { a: { name: "Karim Benzema", team: "Al Ittihad" }, b: { name: "Sadio Mane", team: "Al Nassr" } },
  { a: { name: "Joshua Kimmich", team: "Bayern Munich" }, b: { name: "Nicolo Barella", team: "Inter Milan" } },
  { a: { name: "Serge Gnabry", team: "Bayern Munich" }, b: { name: "Leroy Sane", team: "Bayern Munich" } },
  { a: { name: "Alvaro Morata", team: "AC Milan" }, b: { name: "Ferran Torres", team: "Barcelona" } },
  { a: { name: "Marcus Thuram", team: "Inter Milan" }, b: { name: "Randal Kolo Muani", team: "Paris Saint Germain" } },
  { a: { name: "Theo Hernandez", team: "AC Milan" }, b: { name: "Lucas Hernandez", team: "Paris Saint Germain" } },
  { a: { name: "Kai Havertz", team: "Arsenal" }, b: { name: "Hakim Ziyech", team: "Galatasaray" } },
  { a: { name: "Federico Valverde", team: "Real Madrid" }, b: { name: "Frenkie de Jong", team: "Barcelona" } },
  { a: { name: "Kevin De Bruyne", team: "Manchester City" }, b: { name: "Dani Olmo", team: "Barcelona" } },
  { a: { name: "Romelu Lukaku", team: "Napoli" }, b: { name: "Tammy Abraham", team: "AC Milan" } },
  { a: { name: "Gabriel Martinelli", team: "Arsenal" }, b: { name: "Gabriel Jesus", team: "Arsenal" } },
]

function lcg(seed: number): number {
  return (Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0)
}

export function getDailySixDegreesPuzzle(): { puzzle: SixDegreesPuzzle; dateStr: string } {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  let s = parseInt(dateStr.replace(/-/g, ''), 10)
  s = lcg(s)
  s = lcg(s)
  const puzzle = PUZZLES[s % PUZZLES.length]
  return { puzzle, dateStr }
}
