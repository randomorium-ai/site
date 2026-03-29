// ~400 most recognisable football players — career stats for game seeds and stat lookups.
// Ranked by top-5 European league appearances + international caps.
// Stats are career totals (all competitions), approximate as of early 2026.
// currentTeam: 'Retired' if no longer playing professionally.

export interface PopularPlayer {
  name: string
  nationality: string
  position: 'GK' | 'DEF' | 'MID' | 'ATT'
  peakClub: string
  currentTeam: string   // March 2026
  careerApps: number    // top-5 league appearances
  intCaps: number       // senior international caps
  careerGoals: number   // career goals (all competitions, approximate)
  careerAssists: number
}

// ── Normalise for fuzzy matching ────────────────────────────────────────────
function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

// ── Dataset ─────────────────────────────────────────────────────────────────

export const POPULAR_PLAYERS: PopularPlayer[] = [

  // ── Goalkeepers ─────────────────────────────────────────────────────────
  { name: "Gianluigi Buffon",       nationality: "Italy",          position: "GK",  peakClub: "Juventus",        currentTeam: "Retired",          careerApps: 640, intCaps: 176, careerGoals: 0, careerAssists: 0 },
  { name: "Iker Casillas",          nationality: "Spain",          position: "GK",  peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 530, intCaps: 167, careerGoals: 0, careerAssists: 0 },
  { name: "Peter Schmeichel",       nationality: "Denmark",        position: "GK",  peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 398, intCaps: 129, careerGoals: 0, careerAssists: 0 },
  { name: "Oliver Kahn",            nationality: "Germany",        position: "GK",  peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 429, intCaps: 86,  careerGoals: 0, careerAssists: 0 },
  { name: "Edwin van der Sar",      nationality: "Netherlands",    position: "GK",  peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 375, intCaps: 130, careerGoals: 0, careerAssists: 0 },
  { name: "Petr Cech",              nationality: "Czech Republic", position: "GK",  peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 494, intCaps: 124, careerGoals: 0, careerAssists: 0 },
  { name: "Manuel Neuer",           nationality: "Germany",        position: "GK",  peakClub: "Bayern Munich",   currentTeam: "Bayern Munich",    careerApps: 450, intCaps: 124, careerGoals: 0, careerAssists: 0 },
  { name: "Gianluigi Donnarumma",   nationality: "Italy",          position: "GK",  peakClub: "AC Milan",        currentTeam: "Paris Saint-Germain", careerApps: 280, intCaps: 70, careerGoals: 0, careerAssists: 0 },
  { name: "Thibaut Courtois",       nationality: "Belgium",        position: "GK",  peakClub: "Real Madrid",     currentTeam: "Real Madrid",      careerApps: 460, intCaps: 101, careerGoals: 0, careerAssists: 0 },
  { name: "Marc-Andre ter Stegen",  nationality: "Germany",        position: "GK",  peakClub: "Barcelona",       currentTeam: "Barcelona",        careerApps: 390, intCaps: 43,  careerGoals: 0, careerAssists: 0 },
  { name: "Alisson Becker",         nationality: "Brazil",         position: "GK",  peakClub: "Liverpool",       currentTeam: "Liverpool",        careerApps: 300, intCaps: 79,  careerGoals: 1, careerAssists: 1 },
  { name: "Ederson",                nationality: "Brazil",         position: "GK",  peakClub: "Manchester City", currentTeam: "Manchester City",  careerApps: 280, intCaps: 31,  careerGoals: 0, careerAssists: 0 },
  { name: "Jan Oblak",              nationality: "Slovenia",       position: "GK",  peakClub: "Atletico Madrid", currentTeam: "Atletico Madrid",  careerApps: 360, intCaps: 59,  careerGoals: 0, careerAssists: 0 },
  { name: "David de Gea",           nationality: "Spain",          position: "GK",  peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 450, intCaps: 45,  careerGoals: 0, careerAssists: 0 },
  { name: "Hugo Lloris",            nationality: "France",         position: "GK",  peakClub: "Tottenham",       currentTeam: "Retired",          careerApps: 490, intCaps: 145, careerGoals: 0, careerAssists: 0 },
  { name: "Fabien Barthez",         nationality: "France",         position: "GK",  peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 350, intCaps: 87,  careerGoals: 0, careerAssists: 0 },
  { name: "Keylor Navas",           nationality: "Costa Rica",     position: "GK",  peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 280, intCaps: 104, careerGoals: 0, careerAssists: 0 },
  { name: "Kasper Schmeichel",      nationality: "Denmark",        position: "GK",  peakClub: "Leicester City",  currentTeam: "Anderlecht",       careerApps: 420, intCaps: 89,  careerGoals: 0, careerAssists: 0 },
  { name: "Jordan Pickford",        nationality: "England",        position: "GK",  peakClub: "Everton",         currentTeam: "Everton",          careerApps: 250, intCaps: 73,  careerGoals: 0, careerAssists: 0 },
  { name: "Mike Maignan",           nationality: "France",         position: "GK",  peakClub: "AC Milan",        currentTeam: "AC Milan",         careerApps: 230, intCaps: 42,  careerGoals: 0, careerAssists: 0 },
  { name: "Andre Onana",            nationality: "Cameroon",       position: "GK",  peakClub: "Inter Milan",     currentTeam: "Manchester United", careerApps: 210, intCaps: 37, careerGoals: 0, careerAssists: 0 },
  { name: "Wojciech Szczesny",      nationality: "Poland",         position: "GK",  peakClub: "Juventus",        currentTeam: "Barcelona",        careerApps: 360, intCaps: 84,  careerGoals: 0, careerAssists: 0 },
  { name: "Emiliano Martinez",      nationality: "Argentina",      position: "GK",  peakClub: "Aston Villa",     currentTeam: "Aston Villa",      careerApps: 210, intCaps: 41,  careerGoals: 0, careerAssists: 0 },
  { name: "Rui Patricio",           nationality: "Portugal",       position: "GK",  peakClub: "Wolves",          currentTeam: "Roma",             careerApps: 360, intCaps: 101, careerGoals: 0, careerAssists: 0 },
  { name: "David Seaman",           nationality: "England",        position: "GK",  peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 405, intCaps: 75,  careerGoals: 0, careerAssists: 0 },
  { name: "Jens Lehmann",           nationality: "Germany",        position: "GK",  peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 420, intCaps: 61,  careerGoals: 0, careerAssists: 0 },
  { name: "Victor Valdes",          nationality: "Spain",          position: "GK",  peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 387, intCaps: 20,  careerGoals: 0, careerAssists: 0 },
  { name: "Samir Handanovic",       nationality: "Slovenia",       position: "GK",  peakClub: "Inter Milan",     currentTeam: "Retired",          careerApps: 410, intCaps: 63,  careerGoals: 0, careerAssists: 0 },
  { name: "Claudio Bravo",          nationality: "Chile",          position: "GK",  peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 250, intCaps: 119, careerGoals: 0, careerAssists: 0 },
  { name: "Lukasz Fabianski",       nationality: "Poland",         position: "GK",  peakClub: "West Ham",        currentTeam: "Retired",          careerApps: 330, intCaps: 57,  careerGoals: 0, careerAssists: 0 },

  // ── Defenders ────────────────────────────────────────────────────────────
  { name: "Sergio Ramos",           nationality: "Spain",          position: "DEF", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 680, intCaps: 180, careerGoals: 135, careerAssists: 60 },
  { name: "Gerard Pique",           nationality: "Spain",          position: "DEF", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 615, intCaps: 102, careerGoals: 53,  careerAssists: 40 },
  { name: "Jordi Alba",             nationality: "Spain",          position: "DEF", peakClub: "Barcelona",       currentTeam: "Inter Miami",      careerApps: 490, intCaps: 91,  careerGoals: 20,  careerAssists: 150 },
  { name: "Carlos Puyol",           nationality: "Spain",          position: "DEF", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 392, intCaps: 100, careerGoals: 18,  careerAssists: 15 },
  { name: "Fernando Hierro",        nationality: "Spain",          position: "DEF", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 510, intCaps: 89,  careerGoals: 127, careerAssists: 40 },
  { name: "Dani Carvajal",          nationality: "Spain",          position: "DEF", peakClub: "Real Madrid",     currentTeam: "Real Madrid",      careerApps: 340, intCaps: 58,  careerGoals: 12,  careerAssists: 30 },
  { name: "Virgil van Dijk",        nationality: "Netherlands",    position: "DEF", peakClub: "Liverpool",       currentTeam: "Liverpool",        careerApps: 380, intCaps: 57,  careerGoals: 30,  careerAssists: 20 },
  { name: "Trent Alexander-Arnold", nationality: "England",        position: "DEF", peakClub: "Liverpool",       currentTeam: "Real Madrid",      careerApps: 280, intCaps: 34,  careerGoals: 18,  careerAssists: 90 },
  { name: "Andrew Robertson",       nationality: "Scotland",       position: "DEF", peakClub: "Liverpool",       currentTeam: "Liverpool",        careerApps: 290, intCaps: 73,  careerGoals: 8,   careerAssists: 60 },
  { name: "Dani Alves",             nationality: "Brazil",         position: "DEF", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 540, intCaps: 126, careerGoals: 70,  careerAssists: 150 },
  { name: "Marcelo",                nationality: "Brazil",         position: "DEF", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 520, intCaps: 58,  careerGoals: 38,  careerAssists: 100 },
  { name: "Roberto Carlos",         nationality: "Brazil",         position: "DEF", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 589, intCaps: 125, careerGoals: 102, careerAssists: 150 },
  { name: "Cafu",                   nationality: "Brazil",         position: "DEF", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 490, intCaps: 142, careerGoals: 20,  careerAssists: 50 },
  { name: "Thiago Silva",           nationality: "Brazil",         position: "DEF", peakClub: "Paris Saint-Germain", currentTeam: "Fluminense",   careerApps: 550, intCaps: 109, careerGoals: 18,  careerAssists: 20 },
  { name: "David Luiz",             nationality: "Brazil",         position: "DEF", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 400, intCaps: 64,  careerGoals: 25,  careerAssists: 30 },
  { name: "Paolo Maldini",          nationality: "Italy",          position: "DEF", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 647, intCaps: 126, careerGoals: 33,  careerAssists: 50 },
  { name: "Alessandro Nesta",       nationality: "Italy",          position: "DEF", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 502, intCaps: 78,  careerGoals: 7,   careerAssists: 15 },
  { name: "Fabio Cannavaro",        nationality: "Italy",          position: "DEF", peakClub: "Juventus",        currentTeam: "Retired",          careerApps: 550, intCaps: 136, careerGoals: 15,  careerAssists: 20 },
  { name: "Giorgio Chiellini",      nationality: "Italy",          position: "DEF", peakClub: "Juventus",        currentTeam: "Retired",          careerApps: 560, intCaps: 117, careerGoals: 36,  careerAssists: 15 },
  { name: "Leonardo Bonucci",       nationality: "Italy",          position: "DEF", peakClub: "Juventus",        currentTeam: "Retired",          careerApps: 580, intCaps: 121, careerGoals: 22,  careerAssists: 30 },
  { name: "Franco Baresi",          nationality: "Italy",          position: "DEF", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 532, intCaps: 81,  careerGoals: 14,  careerAssists: 30 },
  { name: "Alessandro Bastoni",     nationality: "Italy",          position: "DEF", peakClub: "Inter Milan",     currentTeam: "Inter Milan",      careerApps: 220, intCaps: 28,  careerGoals: 10,  careerAssists: 15 },
  { name: "Giovanni di Lorenzo",    nationality: "Italy",          position: "DEF", peakClub: "Napoli",          currentTeam: "Napoli",           careerApps: 230, intCaps: 33,  careerGoals: 12,  careerAssists: 20 },
  { name: "Laurent Blanc",          nationality: "France",         position: "DEF", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 420, intCaps: 97,  careerGoals: 50,  careerAssists: 30 },
  { name: "Marcel Desailly",        nationality: "France",         position: "DEF", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 460, intCaps: 116, careerGoals: 6,   careerAssists: 10 },
  { name: "Lilian Thuram",          nationality: "France",         position: "DEF", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 536, intCaps: 142, careerGoals: 6,   careerAssists: 20 },
  { name: "William Gallas",         nationality: "France",         position: "DEF", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 460, intCaps: 84,  careerGoals: 17,  careerAssists: 15 },
  { name: "Raphael Varane",         nationality: "France",         position: "DEF", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 450, intCaps: 93,  careerGoals: 20,  careerAssists: 20 },
  { name: "Patrice Evra",           nationality: "France",         position: "DEF", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 490, intCaps: 81,  careerGoals: 15,  careerAssists: 35 },
  { name: "Eric Abidal",            nationality: "France",         position: "DEF", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 350, intCaps: 67,  careerGoals: 8,   careerAssists: 15 },
  { name: "Bacary Sagna",           nationality: "France",         position: "DEF", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 340, intCaps: 65,  careerGoals: 6,   careerAssists: 15 },
  { name: "Presnel Kimpembe",       nationality: "France",         position: "DEF", peakClub: "Paris Saint-Germain", currentTeam: "Paris Saint-Germain", careerApps: 190, intCaps: 23, careerGoals: 5, careerAssists: 5 },
  { name: "Theo Hernandez",         nationality: "France",         position: "DEF", peakClub: "AC Milan",        currentTeam: "AC Milan",         careerApps: 220, intCaps: 19,  careerGoals: 20,  careerAssists: 40 },
  { name: "Lucas Hernandez",        nationality: "France",         position: "DEF", peakClub: "Bayern Munich",   currentTeam: "Paris Saint-Germain", careerApps: 240, intCaps: 45, careerGoals: 8,  careerAssists: 20 },
  { name: "Benjamin Pavard",        nationality: "France",         position: "DEF", peakClub: "Bayern Munich",   currentTeam: "Inter Milan",      careerApps: 280, intCaps: 54,  careerGoals: 14,  careerAssists: 20 },
  { name: "Jules Kounde",           nationality: "France",         position: "DEF", peakClub: "Barcelona",       currentTeam: "Barcelona",        careerApps: 200, intCaps: 35,  careerGoals: 8,   careerAssists: 15 },
  { name: "Dayot Upamecano",        nationality: "France",         position: "DEF", peakClub: "Bayern Munich",   currentTeam: "Bayern Munich",    careerApps: 200, intCaps: 26,  careerGoals: 8,   careerAssists: 5 },
  { name: "Ibrahima Konate",        nationality: "France",         position: "DEF", peakClub: "Liverpool",       currentTeam: "Liverpool",        careerApps: 160, intCaps: 19,  careerGoals: 8,   careerAssists: 5 },
  { name: "Philipp Lahm",           nationality: "Germany",        position: "DEF", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 430, intCaps: 113, careerGoals: 20,  careerAssists: 120 },
  { name: "Mats Hummels",           nationality: "Germany",        position: "DEF", peakClub: "Borussia Dortmund", currentTeam: "Retired",        careerApps: 500, intCaps: 76,  careerGoals: 30,  careerAssists: 50 },
  { name: "Per Mertesacker",        nationality: "Germany",        position: "DEF", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 380, intCaps: 104, careerGoals: 11,  careerAssists: 20 },
  { name: "Jerome Boateng",         nationality: "Germany",        position: "DEF", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 400, intCaps: 76,  careerGoals: 10,  careerAssists: 15 },
  { name: "Jonathan Tah",           nationality: "Germany",        position: "DEF", peakClub: "Bayer Leverkusen", currentTeam: "Bayern Munich",   careerApps: 160, intCaps: 29,  careerGoals: 8,   careerAssists: 10 },
  { name: "Alphonso Davies",        nationality: "Canada",         position: "DEF", peakClub: "Bayern Munich",   currentTeam: "Bayern Munich",    careerApps: 180, intCaps: 53,  careerGoals: 12,  careerAssists: 40 },
  { name: "Achraf Hakimi",          nationality: "Morocco",        position: "DEF", peakClub: "Paris Saint-Germain", currentTeam: "Paris Saint-Germain", careerApps: 240, intCaps: 80, careerGoals: 30, careerAssists: 60 },
  { name: "Kim Min-jae",            nationality: "South Korea",    position: "DEF", peakClub: "Bayern Munich",   currentTeam: "Bayern Munich",    careerApps: 170, intCaps: 62,  careerGoals: 10,  careerAssists: 5 },
  { name: "Ruben Dias",             nationality: "Portugal",       position: "DEF", peakClub: "Manchester City", currentTeam: "Manchester City",  careerApps: 240, intCaps: 61,  careerGoals: 9,   careerAssists: 10 },
  { name: "Joao Cancelo",           nationality: "Portugal",       position: "DEF", peakClub: "Manchester City", currentTeam: "Barcelona",        careerApps: 280, intCaps: 56,  careerGoals: 12,  careerAssists: 50 },
  { name: "Pepe",                   nationality: "Portugal",       position: "DEF", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 480, intCaps: 141, careerGoals: 22,  careerAssists: 15 },
  { name: "Ricardo Carvalho",       nationality: "Portugal",       position: "DEF", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 380, intCaps: 89,  careerGoals: 9,   careerAssists: 10 },
  { name: "Nuno Mendes",            nationality: "Portugal",       position: "DEF", peakClub: "Paris Saint-Germain", currentTeam: "Paris Saint-Germain", careerApps: 140, intCaps: 38, careerGoals: 5, careerAssists: 15 },
  { name: "Jan Vertonghen",         nationality: "Belgium",        position: "DEF", peakClub: "Tottenham",       currentTeam: "Retired",          careerApps: 490, intCaps: 139, careerGoals: 25,  careerAssists: 35 },
  { name: "Toby Alderweireld",      nationality: "Belgium",        position: "DEF", peakClub: "Tottenham",       currentTeam: "Retired",          careerApps: 430, intCaps: 127, careerGoals: 12,  careerAssists: 25 },
  { name: "Vincent Kompany",        nationality: "Belgium",        position: "DEF", peakClub: "Manchester City", currentTeam: "Retired",          careerApps: 360, intCaps: 89,  careerGoals: 15,  careerAssists: 15 },
  { name: "Matthijs de Ligt",       nationality: "Netherlands",    position: "DEF", peakClub: "Ajax",            currentTeam: "Manchester United", careerApps: 220, intCaps: 50, careerGoals: 15,  careerAssists: 10 },
  { name: "Stefan de Vrij",         nationality: "Netherlands",    position: "DEF", peakClub: "Inter Milan",     currentTeam: "Inter Milan",      careerApps: 300, intCaps: 56,  careerGoals: 15,  careerAssists: 15 },
  { name: "Daley Blind",            nationality: "Netherlands",    position: "DEF", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 280, intCaps: 111, careerGoals: 12,  careerAssists: 30 },
  { name: "Rafael Marquez",         nationality: "Mexico",         position: "DEF", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 350, intCaps: 147, careerGoals: 28,  careerAssists: 25 },
  { name: "Nemanja Vidic",          nationality: "Serbia",         position: "DEF", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 320, intCaps: 56,  careerGoals: 15,  careerAssists: 10 },
  { name: "Rio Ferdinand",          nationality: "England",        position: "DEF", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 508, intCaps: 81,  careerGoals: 11,  careerAssists: 30 },
  { name: "John Terry",             nationality: "England",        position: "DEF", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 580, intCaps: 78,  careerGoals: 41,  careerAssists: 10 },
  { name: "Ashley Cole",            nationality: "England",        position: "DEF", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 560, intCaps: 107, careerGoals: 9,   careerAssists: 40 },
  { name: "Gary Neville",           nationality: "England",        position: "DEF", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 400, intCaps: 85,  careerGoals: 5,   careerAssists: 30 },
  { name: "Sol Campbell",           nationality: "England",        position: "DEF", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 460, intCaps: 73,  careerGoals: 11,  careerAssists: 8 },
  { name: "Tony Adams",             nationality: "England",        position: "DEF", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 504, intCaps: 66,  careerGoals: 32,  careerAssists: 30 },
  { name: "Kyle Walker",            nationality: "England",        position: "DEF", peakClub: "Manchester City", currentTeam: "Bayern Munich",    careerApps: 360, intCaps: 73,  careerGoals: 5,   careerAssists: 30 },
  { name: "Luke Shaw",              nationality: "England",        position: "DEF", peakClub: "Manchester United", currentTeam: "Manchester United", careerApps: 250, intCaps: 40, careerGoals: 10, careerAssists: 30 },
  { name: "Ben White",              nationality: "England",        position: "DEF", peakClub: "Arsenal",         currentTeam: "Arsenal",          careerApps: 150, intCaps: 8,   careerGoals: 5,   careerAssists: 10 },
  { name: "William Saliba",         nationality: "France",         position: "DEF", peakClub: "Arsenal",         currentTeam: "Arsenal",          careerApps: 170, intCaps: 26,  careerGoals: 7,   careerAssists: 5 },
  { name: "Lisandro Martinez",      nationality: "Argentina",      position: "DEF", peakClub: "Manchester United", currentTeam: "Manchester United", careerApps: 190, intCaps: 25, careerGoals: 10, careerAssists: 5 },
  { name: "Franz Beckenbauer",      nationality: "Germany",        position: "DEF", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 427, intCaps: 103, careerGoals: 60,  careerAssists: 50 },
  { name: "Ronald Koeman",          nationality: "Netherlands",    position: "DEF", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 520, intCaps: 78,  careerGoals: 253, careerAssists: 60 },
  { name: "Frank de Boer",          nationality: "Netherlands",    position: "DEF", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 400, intCaps: 112, careerGoals: 27,  careerAssists: 40 },
  { name: "Marco Materazzi",        nationality: "Italy",          position: "DEF", peakClub: "Inter Milan",     currentTeam: "Retired",          careerApps: 380, intCaps: 41,  careerGoals: 24,  careerAssists: 10 },
  { name: "Federico Dimarco",       nationality: "Italy",          position: "DEF", peakClub: "Inter Milan",     currentTeam: "Inter Milan",      careerApps: 180, intCaps: 24,  careerGoals: 15,  careerAssists: 25 },
  { name: "Marcos Alonso",          nationality: "Spain",          position: "DEF", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 280, intCaps: 24,  careerGoals: 35,  careerAssists: 30 },

  // ── Midfielders ──────────────────────────────────────────────────────────
  { name: "Zinedine Zidane",        nationality: "France",         position: "MID", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 598, intCaps: 108, careerGoals: 125, careerAssists: 92 },
  { name: "Xavi",                   nationality: "Spain",          position: "MID", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 768, intCaps: 133, careerGoals: 85,  careerAssists: 185 },
  { name: "Andres Iniesta",         nationality: "Spain",          position: "MID", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 674, intCaps: 131, careerGoals: 57,  careerAssists: 132 },
  { name: "Cesc Fabregas",          nationality: "Spain",          position: "MID", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 550, intCaps: 110, careerGoals: 101, careerAssists: 282 },
  { name: "Sergio Busquets",        nationality: "Spain",          position: "MID", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 505, intCaps: 143, careerGoals: 13,  careerAssists: 101 },
  { name: "Rodri",                  nationality: "Spain",          position: "MID", peakClub: "Manchester City", currentTeam: "Manchester City",  careerApps: 320, intCaps: 65,  careerGoals: 30,  careerAssists: 70 },
  { name: "Pedri",                  nationality: "Spain",          position: "MID", peakClub: "Barcelona",       currentTeam: "Barcelona",        careerApps: 200, intCaps: 38,  careerGoals: 25,  careerAssists: 45 },
  { name: "Gavi",                   nationality: "Spain",          position: "MID", peakClub: "Barcelona",       currentTeam: "Barcelona",        careerApps: 200, intCaps: 42,  careerGoals: 18,  careerAssists: 40 },
  { name: "Dani Olmo",              nationality: "Spain",          position: "MID", peakClub: "Barcelona",       currentTeam: "Barcelona",        careerApps: 200, intCaps: 38,  careerGoals: 28,  careerAssists: 40 },
  { name: "Santi Cazorla",          nationality: "Spain",          position: "MID", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 440, intCaps: 62,  careerGoals: 50,  careerAssists: 80 },
  { name: "Juan Mata",              nationality: "Spain",          position: "MID", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 490, intCaps: 41,  careerGoals: 55,  careerAssists: 85 },
  { name: "Luka Modric",            nationality: "Croatia",        position: "MID", peakClub: "Real Madrid",     currentTeam: "Real Madrid",      careerApps: 640, intCaps: 168, careerGoals: 75,  careerAssists: 250 },
  { name: "Ivan Rakitic",           nationality: "Croatia",        position: "MID", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 580, intCaps: 106, careerGoals: 81,  careerAssists: 97 },
  { name: "Mateo Kovacic",          nationality: "Croatia",        position: "MID", peakClub: "Manchester City", currentTeam: "Manchester City",  careerApps: 360, intCaps: 80,  careerGoals: 20,  careerAssists: 50 },
  { name: "Toni Kroos",             nationality: "Germany",        position: "MID", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 560, intCaps: 106, careerGoals: 80,  careerAssists: 300 },
  { name: "Thomas Muller",          nationality: "Germany",        position: "MID", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 640, intCaps: 131, careerGoals: 247, careerAssists: 255 },
  { name: "Michael Ballack",        nationality: "Germany",        position: "MID", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 520, intCaps: 98,  careerGoals: 108, careerAssists: 90 },
  { name: "Bastian Schweinsteiger", nationality: "Germany",        position: "MID", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 500, intCaps: 121, careerGoals: 68,  careerAssists: 91 },
  { name: "Mesut Ozil",             nationality: "Germany",        position: "MID", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 430, intCaps: 92,  careerGoals: 68,  careerAssists: 192 },
  { name: "Ilkay Gundogan",         nationality: "Germany",        position: "MID", peakClub: "Manchester City", currentTeam: "Barcelona",        careerApps: 500, intCaps: 79,  careerGoals: 58,  careerAssists: 90 },
  { name: "Joshua Kimmich",         nationality: "Germany",        position: "MID", peakClub: "Bayern Munich",   currentTeam: "Bayern Munich",    careerApps: 350, intCaps: 87,  careerGoals: 40,  careerAssists: 120 },
  { name: "Leon Goretzka",          nationality: "Germany",        position: "MID", peakClub: "Bayern Munich",   currentTeam: "Bayern Munich",    careerApps: 260, intCaps: 54,  careerGoals: 45,  careerAssists: 60 },
  { name: "Jamal Musiala",          nationality: "Germany",        position: "MID", peakClub: "Bayern Munich",   currentTeam: "Bayern Munich",    careerApps: 160, intCaps: 36,  careerGoals: 45,  careerAssists: 40 },
  { name: "Florian Wirtz",          nationality: "Germany",        position: "MID", peakClub: "Bayer Leverkusen", currentTeam: "Bayer Leverkusen", careerApps: 130, intCaps: 28, careerGoals: 35,  careerAssists: 35 },
  { name: "Marco Reus",             nationality: "Germany",        position: "MID", peakClub: "Borussia Dortmund", currentTeam: "Retired",        careerApps: 420, intCaps: 48,  careerGoals: 166, careerAssists: 140 },
  { name: "Mario Gotze",            nationality: "Germany",        position: "MID", peakClub: "Borussia Dortmund", currentTeam: "Retired",        careerApps: 360, intCaps: 63,  careerGoals: 54,  careerAssists: 70 },
  { name: "Kevin De Bruyne",        nationality: "Belgium",        position: "MID", peakClub: "Manchester City", currentTeam: "Napoli",           careerApps: 450, intCaps: 102, careerGoals: 82,  careerAssists: 204 },
  { name: "Saul Niguez",            nationality: "Spain",          position: "MID", peakClub: "Atletico Madrid", currentTeam: "Atletico Madrid",  careerApps: 300, intCaps: 15,  careerGoals: 20,  careerAssists: 35 },
  { name: "Axel Witsel",            nationality: "Belgium",        position: "MID", peakClub: "Borussia Dortmund", currentTeam: "Retired",        careerApps: 420, intCaps: 130, careerGoals: 70,  careerAssists: 60 },
  { name: "Andrea Pirlo",           nationality: "Italy",          position: "MID", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 530, intCaps: 116, careerGoals: 42,  careerAssists: 128 },
  { name: "Gennaro Gattuso",        nationality: "Italy",          position: "MID", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 500, intCaps: 73,  careerGoals: 30,  careerAssists: 50 },
  { name: "Marco Verratti",         nationality: "Italy",          position: "MID", peakClub: "Paris Saint-Germain", currentTeam: "Al Arabi",     careerApps: 400, intCaps: 63,  careerGoals: 8,   careerAssists: 60 },
  { name: "Nicolo Barella",         nationality: "Italy",          position: "MID", peakClub: "Inter Milan",     currentTeam: "Inter Milan",      careerApps: 240, intCaps: 52,  careerGoals: 30,  careerAssists: 70 },
  { name: "Jorginho",               nationality: "Italy",          position: "MID", peakClub: "Chelsea",         currentTeam: "Arsenal",          careerApps: 420, intCaps: 59,  careerGoals: 30,  careerAssists: 40 },
  { name: "Sandro Tonali",          nationality: "Italy",          position: "MID", peakClub: "AC Milan",        currentTeam: "Newcastle",        careerApps: 180, intCaps: 36,  careerGoals: 15,  careerAssists: 30 },
  { name: "Frank Lampard",          nationality: "England",        position: "MID", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 609, intCaps: 106, careerGoals: 268, careerAssists: 100 },
  { name: "Steven Gerrard",         nationality: "England",        position: "MID", peakClub: "Liverpool",       currentTeam: "Retired",          careerApps: 504, intCaps: 114, careerGoals: 186, careerAssists: 131 },
  { name: "Paul Scholes",           nationality: "England",        position: "MID", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 499, intCaps: 66,  careerGoals: 155, careerAssists: 100 },
  { name: "David Beckham",          nationality: "England",        position: "MID", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 645, intCaps: 115, careerGoals: 100, careerAssists: 172 },
  { name: "Roy Keane",              nationality: "Ireland",        position: "MID", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 480, intCaps: 67,  careerGoals: 50,  careerAssists: 60 },
  { name: "Michael Carrick",        nationality: "England",        position: "MID", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 400, intCaps: 34,  careerGoals: 25,  careerAssists: 55 },
  { name: "James Milner",           nationality: "England",        position: "MID", peakClub: "Liverpool",       currentTeam: "Retired",          careerApps: 570, intCaps: 61,  careerGoals: 60,  careerAssists: 100 },
  { name: "Jack Grealish",          nationality: "England",        position: "MID", peakClub: "Manchester City", currentTeam: "Manchester City",  careerApps: 250, intCaps: 46,  careerGoals: 40,  careerAssists: 55 },
  { name: "Mason Mount",            nationality: "England",        position: "MID", peakClub: "Chelsea",         currentTeam: "Manchester United", careerApps: 250, intCaps: 36, careerGoals: 45,  careerAssists: 60 },
  { name: "Jude Bellingham",        nationality: "England",        position: "MID", peakClub: "Real Madrid",     currentTeam: "Real Madrid",      careerApps: 230, intCaps: 41,  careerGoals: 50,  careerAssists: 40 },
  { name: "Declan Rice",            nationality: "England",        position: "MID", peakClub: "Arsenal",         currentTeam: "Arsenal",          careerApps: 260, intCaps: 58,  careerGoals: 20,  careerAssists: 40 },
  { name: "Phil Foden",             nationality: "England",        position: "MID", peakClub: "Manchester City", currentTeam: "Manchester City",  careerApps: 250, intCaps: 40,  careerGoals: 70,  careerAssists: 80 },
  { name: "Cole Palmer",            nationality: "England",        position: "MID", peakClub: "Chelsea",         currentTeam: "Chelsea",          careerApps: 120, intCaps: 12,  careerGoals: 40,  careerAssists: 35 },
  { name: "Patrick Vieira",         nationality: "France",         position: "MID", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 580, intCaps: 107, careerGoals: 33,  careerAssists: 70 },
  { name: "Claude Makelele",        nationality: "France",         position: "MID", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 430, intCaps: 71,  careerGoals: 5,   careerAssists: 40 },
  { name: "Robert Pires",           nationality: "France",         position: "MID", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 450, intCaps: 79,  careerGoals: 82,  careerAssists: 100 },
  { name: "N'Golo Kante",           nationality: "France",         position: "MID", peakClub: "Chelsea",         currentTeam: "Al Ittihad",       careerApps: 380, intCaps: 55,  careerGoals: 15,  careerAssists: 30 },
  { name: "Paul Pogba",             nationality: "France",         position: "MID", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 340, intCaps: 91,  careerGoals: 55,  careerAssists: 75 },
  { name: "Adrien Rabiot",          nationality: "France",         position: "MID", peakClub: "Juventus",        currentTeam: "Retired",          careerApps: 330, intCaps: 52,  careerGoals: 30,  careerAssists: 40 },
  { name: "Eduardo Camavinga",      nationality: "France",         position: "MID", peakClub: "Real Madrid",     currentTeam: "Real Madrid",      careerApps: 180, intCaps: 32,  careerGoals: 10,  careerAssists: 25 },
  { name: "Aurelien Tchouameni",    nationality: "France",         position: "MID", peakClub: "Real Madrid",     currentTeam: "Real Madrid",      careerApps: 200, intCaps: 38,  careerGoals: 12,  careerAssists: 20 },
  { name: "Martin Odegaard",        nationality: "Norway",         position: "MID", peakClub: "Arsenal",         currentTeam: "Arsenal",          careerApps: 250, intCaps: 52,  careerGoals: 42,  careerAssists: 65 },
  { name: "Granit Xhaka",           nationality: "Switzerland",    position: "MID", peakClub: "Arsenal",         currentTeam: "Bayer Leverkusen", careerApps: 460, intCaps: 120, careerGoals: 65,  careerAssists: 80 },
  { name: "Bruno Fernandes",        nationality: "Portugal",       position: "MID", peakClub: "Manchester United", currentTeam: "Manchester United", careerApps: 280, intCaps: 67, careerGoals: 75, careerAssists: 110 },
  { name: "Bernardo Silva",         nationality: "Portugal",       position: "MID", peakClub: "Manchester City", currentTeam: "Manchester City",  careerApps: 380, intCaps: 68,  careerGoals: 60,  careerAssists: 90 },
  { name: "Joao Moutinho",          nationality: "Portugal",       position: "MID", peakClub: "Porto",           currentTeam: "Retired",          careerApps: 440, intCaps: 146, careerGoals: 23,  careerAssists: 80 },
  { name: "Son Heung-min",          nationality: "South Korea",    position: "MID", peakClub: "Tottenham",       currentTeam: "Tottenham",        careerApps: 380, intCaps: 116, careerGoals: 175, careerAssists: 115 },
  { name: "Park Ji-sung",           nationality: "South Korea",    position: "MID", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 340, intCaps: 100, careerGoals: 50,  careerAssists: 50 },
  { name: "Frenkie de Jong",        nationality: "Netherlands",    position: "MID", peakClub: "Barcelona",       currentTeam: "Barcelona",        careerApps: 280, intCaps: 55,  careerGoals: 20,  careerAssists: 50 },
  { name: "Clarence Seedorf",       nationality: "Netherlands",    position: "MID", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 580, intCaps: 87,  careerGoals: 65,  careerAssists: 100 },
  { name: "Edgar Davids",           nationality: "Netherlands",    position: "MID", peakClub: "Juventus",        currentTeam: "Retired",          careerApps: 400, intCaps: 74,  careerGoals: 30,  careerAssists: 45 },
  { name: "Michael Laudrup",        nationality: "Denmark",        position: "MID", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 450, intCaps: 104, careerGoals: 50,  careerAssists: 200 },
  { name: "Rui Costa",              nationality: "Portugal",       position: "MID", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 420, intCaps: 94,  careerGoals: 60,  careerAssists: 80 },
  { name: "Deco",                   nationality: "Portugal",       position: "MID", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 380, intCaps: 75,  careerGoals: 45,  careerAssists: 70 },
  { name: "Arturo Vidal",           nationality: "Chile",          position: "MID", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 460, intCaps: 105, careerGoals: 106, careerAssists: 97 },
  { name: "Yaya Toure",             nationality: "Ivory Coast",    position: "MID", peakClub: "Manchester City", currentTeam: "Retired",          careerApps: 450, intCaps: 101, careerGoals: 97,  careerAssists: 88 },
  { name: "Didier Deschamps",       nationality: "France",         position: "MID", peakClub: "Juventus",        currentTeam: "Retired",          careerApps: 450, intCaps: 103, careerGoals: 29,  careerAssists: 60 },
  { name: "Piotr Zielinski",        nationality: "Poland",         position: "MID", peakClub: "Napoli",          currentTeam: "Inter Milan",      careerApps: 340, intCaps: 82,  careerGoals: 30,  careerAssists: 55 },
  { name: "Hakim Ziyech",           nationality: "Morocco",        position: "MID", peakClub: "Chelsea",         currentTeam: "Galatasaray",      careerApps: 280, intCaps: 62,  careerGoals: 40,  careerAssists: 50 },
  { name: "Gini Wijnaldum",         nationality: "Netherlands",    position: "MID", peakClub: "Liverpool",       currentTeam: "Retired",          careerApps: 380, intCaps: 86,  careerGoals: 60,  careerAssists: 50 },
  { name: "Freddie Ljungberg",      nationality: "Sweden",         position: "MID", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 420, intCaps: 75,  careerGoals: 72,  careerAssists: 70 },
  { name: "Gilberto Silva",         nationality: "Brazil",         position: "MID", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 380, intCaps: 100, careerGoals: 20,  careerAssists: 30 },
  { name: "Scott McTominay",        nationality: "Scotland",       position: "MID", peakClub: "Manchester United", currentTeam: "Napoli",         careerApps: 190, intCaps: 58,  careerGoals: 25,  careerAssists: 20 },

  // ── Attackers ────────────────────────────────────────────────────────────
  { name: "Lionel Messi",           nationality: "Argentina",      position: "ATT", peakClub: "Barcelona",       currentTeam: "Inter Miami",      careerApps: 590, intCaps: 182, careerGoals: 833, careerAssists: 372 },
  { name: "Cristiano Ronaldo",      nationality: "Portugal",       position: "ATT", peakClub: "Real Madrid",     currentTeam: "Al Nassr",         careerApps: 620, intCaps: 208, careerGoals: 897, careerAssists: 232 },
  { name: "Ronaldo",                nationality: "Brazil",         position: "ATT", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 490, intCaps: 98,  careerGoals: 352, careerAssists: 120 },
  { name: "Ronaldinho",             nationality: "Brazil",         position: "ATT", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 440, intCaps: 97,  careerGoals: 170, careerAssists: 190 },
  { name: "Thierry Henry",          nationality: "France",         position: "ATT", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 600, intCaps: 123, careerGoals: 411, careerAssists: 220 },
  { name: "Robert Lewandowski",     nationality: "Poland",         position: "ATT", peakClub: "Bayern Munich",   currentTeam: "Barcelona",        careerApps: 540, intCaps: 152, careerGoals: 459, careerAssists: 207 },
  { name: "Zlatan Ibrahimovic",     nationality: "Sweden",         position: "ATT", peakClub: "Paris Saint-Germain", currentTeam: "Retired",      careerApps: 560, intCaps: 120, careerGoals: 572, careerAssists: 198 },
  { name: "Karim Benzema",          nationality: "France",         position: "ATT", peakClub: "Real Madrid",     currentTeam: "Al Ittihad",       careerApps: 570, intCaps: 97,  careerGoals: 371, careerAssists: 157 },
  { name: "Harry Kane",             nationality: "England",        position: "ATT", peakClub: "Tottenham",       currentTeam: "Bayern Munich",    careerApps: 520, intCaps: 98,  careerGoals: 352, careerAssists: 190 },
  { name: "Mohamed Salah",          nationality: "Egypt",          position: "ATT", peakClub: "Liverpool",       currentTeam: "Liverpool",        careerApps: 380, intCaps: 98,  careerGoals: 248, careerAssists: 186 },
  { name: "Erling Haaland",         nationality: "Norway",         position: "ATT", peakClub: "Manchester City", currentTeam: "Manchester City",  careerApps: 250, intCaps: 38,  careerGoals: 216, careerAssists: 60 },
  { name: "Kylian Mbappe",          nationality: "France",         position: "ATT", peakClub: "Paris Saint-Germain", currentTeam: "Real Madrid",  careerApps: 310, intCaps: 82,  careerGoals: 316, careerAssists: 105 },
  { name: "Neymar",                 nationality: "Brazil",         position: "ATT", peakClub: "Barcelona",       currentTeam: "Al Hilal",         careerApps: 380, intCaps: 128, careerGoals: 262, careerAssists: 215 },
  { name: "Sadio Mane",             nationality: "Senegal",        position: "ATT", peakClub: "Liverpool",       currentTeam: "Al Nassr",         careerApps: 430, intCaps: 92,  careerGoals: 250, careerAssists: 140 },
  { name: "Antoine Griezmann",      nationality: "France",         position: "ATT", peakClub: "Atletico Madrid", currentTeam: "Atletico Madrid",  careerApps: 530, intCaps: 127, careerGoals: 304, careerAssists: 185 },
  { name: "Luis Suarez",            nationality: "Uruguay",        position: "ATT", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 510, intCaps: 122, careerGoals: 504, careerAssists: 250 },
  { name: "Raul",                   nationality: "Spain",          position: "ATT", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 550, intCaps: 102, careerGoals: 323, careerAssists: 148 },
  { name: "Filippo Inzaghi",        nationality: "Italy",          position: "ATT", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 450, intCaps: 57,  careerGoals: 288, careerAssists: 80 },
  { name: "Samuel Etoo",            nationality: "Cameroon",       position: "ATT", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 490, intCaps: 118, careerGoals: 330, careerAssists: 120 },
  { name: "Didier Drogba",          nationality: "Ivory Coast",    position: "ATT", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 460, intCaps: 105, careerGoals: 295, careerAssists: 113 },
  { name: "Wayne Rooney",           nationality: "England",        position: "ATT", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 590, intCaps: 120, careerGoals: 253, careerAssists: 140 },
  { name: "Michael Owen",           nationality: "England",        position: "ATT", peakClub: "Liverpool",       currentTeam: "Retired",          careerApps: 420, intCaps: 89,  careerGoals: 258, careerAssists: 88 },
  { name: "Fernando Torres",        nationality: "Spain",          position: "ATT", peakClub: "Liverpool",       currentTeam: "Retired",          careerApps: 470, intCaps: 110, careerGoals: 282, careerAssists: 95 },
  { name: "David Villa",            nationality: "Spain",          position: "ATT", peakClub: "Valencia",        currentTeam: "Retired",          careerApps: 530, intCaps: 98,  careerGoals: 379, careerAssists: 150 },
  { name: "Rivaldo",                nationality: "Brazil",         position: "ATT", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 450, intCaps: 74,  careerGoals: 302, careerAssists: 140 },
  { name: "Alessandro Del Piero",   nationality: "Italy",          position: "ATT", peakClub: "Juventus",        currentTeam: "Retired",          careerApps: 570, intCaps: 91,  careerGoals: 345, careerAssists: 176 },
  { name: "Francesco Totti",        nationality: "Italy",          position: "ATT", peakClub: "Roma",            currentTeam: "Retired",          careerApps: 628, intCaps: 58,  careerGoals: 307, careerAssists: 213 },
  { name: "Roberto Baggio",         nationality: "Italy",          position: "ATT", peakClub: "Juventus",        currentTeam: "Retired",          careerApps: 452, intCaps: 56,  careerGoals: 318, careerAssists: 165 },
  { name: "Marco van Basten",       nationality: "Netherlands",    position: "ATT", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 280, intCaps: 58,  careerGoals: 277, careerAssists: 90 },
  { name: "Ruud van Nistelrooy",    nationality: "Netherlands",    position: "ATT", peakClub: "Manchester United", currentTeam: "Retired",        careerApps: 340, intCaps: 70,  careerGoals: 333, careerAssists: 90 },
  { name: "Romario",                nationality: "Brazil",         position: "ATT", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 250, intCaps: 70,  careerGoals: 350, careerAssists: 100 },
  { name: "Bebeto",                 nationality: "Brazil",         position: "ATT", peakClub: "Deportivo La Coruna", currentTeam: "Retired",      careerApps: 260, intCaps: 75,  careerGoals: 139, careerAssists: 90 },
  { name: "Hernán Crespo",          nationality: "Argentina",      position: "ATT", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 440, intCaps: 64,  careerGoals: 235, careerAssists: 90 },
  { name: "Gabriel Batistuta",      nationality: "Argentina",      position: "ATT", peakClub: "Fiorentina",      currentTeam: "Retired",          careerApps: 520, intCaps: 77,  careerGoals: 336, careerAssists: 100 },
  { name: "Diego Forlan",           nationality: "Uruguay",        position: "ATT", peakClub: "Atletico Madrid", currentTeam: "Retired",          careerApps: 480, intCaps: 112, careerGoals: 286, careerAssists: 120 },
  { name: "Carlos Tevez",           nationality: "Argentina",      position: "ATT", peakClub: "Manchester City", currentTeam: "Retired",          careerApps: 450, intCaps: 76,  careerGoals: 227, careerAssists: 100 },
  { name: "Sergio Aguero",          nationality: "Argentina",      position: "ATT", peakClub: "Manchester City", currentTeam: "Retired",          careerApps: 430, intCaps: 101, careerGoals: 287, careerAssists: 96 },
  { name: "Gonzalo Higuain",        nationality: "Argentina",      position: "ATT", peakClub: "Napoli",          currentTeam: "Retired",          careerApps: 470, intCaps: 75,  careerGoals: 312, careerAssists: 100 },
  { name: "Andriy Shevchenko",      nationality: "Ukraine",        position: "ATT", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 430, intCaps: 111, careerGoals: 374, careerAssists: 110 },
  { name: "Henrik Larsson",         nationality: "Sweden",         position: "ATT", peakClub: "Celtic",          currentTeam: "Retired",          careerApps: 470, intCaps: 106, careerGoals: 252, careerAssists: 130 },
  { name: "Patrick Kluivert",       nationality: "Netherlands",    position: "ATT", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 430, intCaps: 79,  careerGoals: 248, careerAssists: 100 },
  { name: "Dennis Bergkamp",        nationality: "Netherlands",    position: "ATT", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 479, intCaps: 79,  careerGoals: 136, careerAssists: 192 },
  { name: "Ruud Gullit",            nationality: "Netherlands",    position: "ATT", peakClub: "AC Milan",        currentTeam: "Retired",          careerApps: 400, intCaps: 66,  careerGoals: 163, careerAssists: 108 },
  { name: "Jurgen Klinsmann",       nationality: "Germany",        position: "ATT", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 480, intCaps: 108, careerGoals: 316, careerAssists: 90 },
  { name: "Gerd Muller",            nationality: "Germany",        position: "ATT", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 427, intCaps: 62,  careerGoals: 565, careerAssists: 80 },
  { name: "Karl-Heinz Rummenigge",  nationality: "Germany",        position: "ATT", peakClub: "Bayern Munich",   currentTeam: "Retired",          careerApps: 380, intCaps: 95,  careerGoals: 219, careerAssists: 80 },
  { name: "Jean-Pierre Papin",      nationality: "France",         position: "ATT", peakClub: "Marseille",       currentTeam: "Retired",          careerApps: 420, intCaps: 54,  careerGoals: 248, careerAssists: 80 },
  { name: "George Best",            nationality: "Northern Ireland", position: "ATT", peakClub: "Manchester United", currentTeam: "Retired",      careerApps: 460, intCaps: 37,  careerGoals: 215, careerAssists: 90 },
  { name: "Johan Cruyff",           nationality: "Netherlands",    position: "ATT", peakClub: "Barcelona",       currentTeam: "Retired",          careerApps: 390, intCaps: 48,  careerGoals: 291, careerAssists: 150 },
  { name: "Gary Lineker",           nationality: "England",        position: "ATT", peakClub: "Tottenham",       currentTeam: "Retired",          careerApps: 450, intCaps: 80,  careerGoals: 281, careerAssists: 70 },
  { name: "Ian Rush",               nationality: "Wales",          position: "ATT", peakClub: "Liverpool",       currentTeam: "Retired",          careerApps: 520, intCaps: 73,  careerGoals: 346, careerAssists: 80 },
  { name: "Romelu Lukaku",          nationality: "Belgium",        position: "ATT", peakClub: "Inter Milan",     currentTeam: "Roma",             careerApps: 500, intCaps: 112, careerGoals: 294, careerAssists: 80 },
  { name: "Olivier Giroud",         nationality: "France",         position: "ATT", peakClub: "Arsenal",         currentTeam: "Retired",          careerApps: 560, intCaps: 132, careerGoals: 266, careerAssists: 100 },
  { name: "Raheem Sterling",        nationality: "England",        position: "ATT", peakClub: "Manchester City", currentTeam: "Arsenal",          careerApps: 430, intCaps: 82,  careerGoals: 139, careerAssists: 120 },
  { name: "Marcus Rashford",        nationality: "England",        position: "ATT", peakClub: "Manchester United", currentTeam: "Aston Villa",    careerApps: 300, intCaps: 66,  careerGoals: 100, careerAssists: 60 },
  { name: "Bukayo Saka",            nationality: "England",        position: "ATT", peakClub: "Arsenal",         currentTeam: "Arsenal",          careerApps: 220, intCaps: 48,  careerGoals: 60,  careerAssists: 70 },
  { name: "Jadon Sancho",           nationality: "England",        position: "ATT", peakClub: "Borussia Dortmund", currentTeam: "Chelsea",        careerApps: 250, intCaps: 28,  careerGoals: 50,  careerAssists: 55 },
  { name: "Gabriel Martinelli",     nationality: "Brazil",         position: "ATT", peakClub: "Arsenal",         currentTeam: "Arsenal",          careerApps: 200, intCaps: 22,  careerGoals: 55,  careerAssists: 45 },
  { name: "Gabriel Jesus",          nationality: "Brazil",         position: "ATT", peakClub: "Manchester City", currentTeam: "Arsenal",          careerApps: 350, intCaps: 50,  careerGoals: 125, careerAssists: 80 },
  { name: "Vinicius Junior",        nationality: "Brazil",         position: "ATT", peakClub: "Real Madrid",     currentTeam: "Real Madrid",      careerApps: 250, intCaps: 30,  careerGoals: 85,  careerAssists: 85 },
  { name: "Rodrygo",                nationality: "Brazil",         position: "ATT", peakClub: "Real Madrid",     currentTeam: "Real Madrid",      careerApps: 200, intCaps: 24,  careerGoals: 50,  careerAssists: 45 },
  { name: "Lamine Yamal",           nationality: "Spain",          position: "ATT", peakClub: "Barcelona",       currentTeam: "Barcelona",        careerApps: 120, intCaps: 23,  careerGoals: 25,  careerAssists: 30 },
  { name: "Rafael Leao",            nationality: "Portugal",       position: "ATT", peakClub: "AC Milan",        currentTeam: "AC Milan",         careerApps: 220, intCaps: 32,  careerGoals: 55,  careerAssists: 55 },
  { name: "Victor Osimhen",         nationality: "Nigeria",        position: "ATT", peakClub: "Napoli",          currentTeam: "Galatasaray",      careerApps: 220, intCaps: 35,  careerGoals: 98,  careerAssists: 30 },
  { name: "Lautaro Martinez",       nationality: "Argentina",      position: "ATT", peakClub: "Inter Milan",     currentTeam: "Inter Milan",      careerApps: 280, intCaps: 56,  careerGoals: 145, careerAssists: 70 },
  { name: "Paulo Dybala",           nationality: "Argentina",      position: "ATT", peakClub: "Juventus",        currentTeam: "Roma",             careerApps: 380, intCaps: 41,  careerGoals: 165, careerAssists: 125 },
  { name: "Dusan Vlahovic",         nationality: "Serbia",         position: "ATT", peakClub: "Juventus",        currentTeam: "Juventus",         careerApps: 200, intCaps: 43,  careerGoals: 95,  careerAssists: 30 },
  { name: "Darwin Nunez",           nationality: "Uruguay",        position: "ATT", peakClub: "Liverpool",       currentTeam: "Liverpool",        careerApps: 190, intCaps: 35,  careerGoals: 70,  careerAssists: 30 },
  { name: "Rasmus Hojlund",         nationality: "Denmark",        position: "ATT", peakClub: "Manchester United", currentTeam: "Manchester United", careerApps: 130, intCaps: 20, careerGoals: 40, careerAssists: 15 },
  { name: "Alexander Isak",         nationality: "Sweden",         position: "ATT", peakClub: "Newcastle",       currentTeam: "Newcastle",        careerApps: 170, intCaps: 44,  careerGoals: 70,  careerAssists: 30 },
  { name: "Viktor Gyokeres",        nationality: "Sweden",         position: "ATT", peakClub: "Sporting CP",     currentTeam: "Arsenal",          careerApps: 120, intCaps: 22,  careerGoals: 90,  careerAssists: 35 },
  { name: "Christopher Nkunku",     nationality: "France",         position: "ATT", peakClub: "RB Leipzig",      currentTeam: "Chelsea",          careerApps: 270, intCaps: 24,  careerGoals: 90,  careerAssists: 80 },
  { name: "Ousmane Dembele",        nationality: "France",         position: "ATT", peakClub: "Barcelona",       currentTeam: "Paris Saint-Germain", careerApps: 280, intCaps: 45, careerGoals: 65, careerAssists: 80 },
  { name: "Marcus Thuram",          nationality: "France",         position: "ATT", peakClub: "Inter Milan",     currentTeam: "Inter Milan",      careerApps: 200, intCaps: 28,  careerGoals: 55,  careerAssists: 35 },
  { name: "Tammy Abraham",          nationality: "England",        position: "ATT", peakClub: "Roma",            currentTeam: "AC Milan",         careerApps: 250, intCaps: 16,  careerGoals: 80,  careerAssists: 30 },
  { name: "Jonathan David",         nationality: "Canada",         position: "ATT", peakClub: "Lille",           currentTeam: "Juventus",         careerApps: 170, intCaps: 48,  careerGoals: 90,  careerAssists: 35 },
  { name: "Ivan Toney",             nationality: "England",        position: "ATT", peakClub: "Brentford",       currentTeam: "Al Ahli",          careerApps: 220, intCaps: 8,   careerGoals: 90,  careerAssists: 25 },
  { name: "Alvaro Morata",          nationality: "Spain",          position: "ATT", peakClub: "Atletico Madrid", currentTeam: "AC Milan",         careerApps: 380, intCaps: 78,  careerGoals: 162, careerAssists: 75 },
  { name: "Gareth Bale",            nationality: "Wales",          position: "ATT", peakClub: "Real Madrid",     currentTeam: "Retired",          careerApps: 420, intCaps: 111, careerGoals: 183, careerAssists: 100 },
  { name: "Eden Hazard",            nationality: "Belgium",        position: "ATT", peakClub: "Chelsea",         currentTeam: "Retired",          careerApps: 520, intCaps: 126, careerGoals: 174, careerAssists: 147 },

]

// ── Build lookup map for fast name-based retrieval ──────────────────────────

let _map: Map<string, PopularPlayer> | null = null

function getMap(): Map<string, PopularPlayer> {
  if (_map) return _map
  _map = new Map()
  for (const p of POPULAR_PLAYERS) {
    _map.set(norm(p.name), p)
  }
  return _map
}

// ── Find a single player by name ───────────────────────────────────────────

export function findPopularPlayer(name: string): PopularPlayer | null {
  return getMap().get(norm(name)) ?? null
}

// ── Fuzzy search over the popular pool ────────────────────────────────────

export interface PopularSearchResult extends PopularPlayer {
  score: number
}

export function searchPopularPlayers(query: string, limit = 20): PopularSearchResult[] {
  const normQ = norm(query)
  if (normQ.length < 2) return []

  const queryWords = normQ.split(/\s+/).filter(w => w.length > 0)
  const results: PopularSearchResult[] = []

  for (const p of POPULAR_PLAYERS) {
    const normName = norm(p.name)
    const nameWords = normName.split(/\s+/)

    let score = 0

    if (normName === normQ) score = 1000
    else if (normName.startsWith(normQ)) score = 800
    else if (queryWords.every(qw => nameWords.some(nw => nw.startsWith(qw)))) score = 600
    else if (queryWords.some(qw => nameWords.some(nw => nw.startsWith(qw)))) score = 400
    else if (normName.includes(normQ)) score = 200
    else if (queryWords.some(qw => normName.includes(qw) && qw.length >= 3)) score = 100

    if (score > 0) results.push({ ...p, score })
  }

  results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  return results.slice(0, limit)
}
