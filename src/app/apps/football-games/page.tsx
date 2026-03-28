import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Footballorium · randomorium',
  description: 'Daily football puzzles for people who watch too much football.',
}

const GAMES = [
  {
    num: 1,
    name: 'The Number',
    slug: 'the-number',
    desc: 'Pick 3 players whose combined stat hits a daily target. No hints.',
    status: 'live' as const,
    accentBorder: 'border-l-[#1a7a3e]',
    accentHover: 'hover:bg-[#f0f7f3]',
  },
  {
    num: 2,
    name: 'Six Degrees',
    slug: 'six-degrees',
    desc: 'Connect two players through shared clubs in 6 transfers or fewer.',
    status: 'live' as const,
    accentBorder: 'border-l-blue-500',
    accentHover: 'hover:bg-[#f0f4ff]',
  },
  {
    num: 3,
    name: 'Teamsheet',
    slug: 'teamsheet',
    desc: 'Fill an 11-player formation. Every position has a secret criteria.',
    status: 'soon' as const,
    accentBorder: 'border-l-amber-500',
    accentHover: '',
  },
  {
    num: 4,
    name: 'Club History',
    slug: 'club-history',
    desc: "Name the players. Any era. Any formation.",
    status: 'soon' as const,
    accentBorder: 'border-l-purple-500',
    accentHover: '',
  },
  {
    num: 5,
    name: 'Player Wordle',
    slug: 'player-wordle',
    desc: 'Guess the mystery player in 6 clues.',
    status: 'soon' as const,
    accentBorder: 'border-l-rose-500',
    accentHover: '',
  },
]

export default function FootballGamesHub() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-[#1a7a3e]">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 220"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect x="30" y="15" width="740" height="190" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <line x1="400" y1="15" x2="400" y2="205" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <circle cx="400" cy="110" r="65" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <circle cx="400" cy="110" r="3" fill="white" fillOpacity="0.15" />
          <rect x="30" y="65" width="110" height="90" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <rect x="660" y="65" width="110" height="90" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <rect x="30" y="85" width="50" height="50" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <rect x="720" y="85" width="50" height="50" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <circle cx="113" cy="110" r="2.5" fill="white" fillOpacity="0.15" />
          <circle cx="687" cy="110" r="2.5" fill="white" fillOpacity="0.15" />
          <path d="M30,15 Q45,15 45,30" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <path d="M770,15 Q755,15 755,30" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <path d="M30,205 Q45,205 45,190" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
          <path d="M770,205 Q755,205 755,190" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" />
        </svg>
        <div className="relative max-w-2xl mx-auto px-5 py-10">
          <Link href="/" className="inline-block text-white/60 text-xs font-mono hover:text-white transition-colors mb-7 tracking-wide">
            ← randomorium.ai
          </Link>
          <h1 className="text-4xl font-black tracking-tight leading-none uppercase text-white mb-2">
            Footballorium
          </h1>
          <p className="text-white/70 text-sm">
            Puzzles for people who watch too much football.
          </p>
        </div>
      </div>

      {/* ── Game cards ── */}
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-2">
        {GAMES.map((game) => (
          game.status === 'live' ? (
            <Link
              key={game.slug}
              href={`/apps/football-games/${game.slug}`}
              className={`group block bg-white border border-[#e5e5e5] border-l-4 ${game.accentBorder} rounded-lg overflow-hidden ${game.accentHover} transition-colors`}
            >
              <GameCard game={game} />
            </Link>
          ) : (
            <div
              key={game.slug}
              className={`block bg-white border border-[#ebebeb] border-l-4 ${game.accentBorder} opacity-40 rounded-lg overflow-hidden cursor-not-allowed`}
            >
              <GameCard game={game} />
            </div>
          )
        ))}
      </div>
    </div>
  )
}

function GameCard({ game }: { game: typeof GAMES[0] }) {
  return (
    <div className="flex items-center gap-5 px-5 py-4">
      <div className="flex-shrink-0 w-8 text-center">
        <div className="text-lg font-black text-[#d0d0d0] tabular-nums">{String(game.num).padStart(2, '0')}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-[15px] text-[#1a1a1a]">{game.name}</span>
          {game.status === 'live' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#1a7a3e] text-white">Live</span>
          ) : (
            <span className="text-[10px] font-mono text-[#aaa] border border-[#e0e0e0] px-2 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
          )}
        </div>
        <p className="text-[#666] text-sm">{game.desc}</p>
      </div>
      {game.status === 'live' && (
        <div className="flex-shrink-0 text-[#1a7a3e] font-bold text-lg">→</div>
      )}
    </div>
  )
}
