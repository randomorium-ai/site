import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Football Games · randomorium',
  description: 'Daily football puzzles for people who know too much about football.',
}

const GAMES = [
  {
    num: 1,
    name: 'The Number',
    slug: 'the-number',
    desc: 'Pick 3 players whose combined stat hits a daily target. No hints. No cheating. Just you and your football brain.',
    status: 'live' as const,
    accent: 'border-l-emerald-500',
    accentBg: 'group-hover:bg-emerald-500/5',
    badge: 'bg-emerald-500 text-black',
  },
  {
    num: 2,
    name: 'Six Degrees',
    slug: 'six-degrees',
    desc: 'Connect two players through shared clubs in 6 transfers or fewer.',
    status: 'soon' as const,
    accent: 'border-l-blue-500',
    accentBg: '',
    badge: '',
  },
  {
    num: 3,
    name: 'Teamsheet',
    slug: 'teamsheet',
    desc: 'Fill an 11-player formation where every position has a secret criteria.',
    status: 'soon' as const,
    accent: 'border-l-amber-500',
    accentBg: '',
    badge: '',
  },
  {
    num: 4,
    name: 'Club History',
    slug: 'club-history',
    desc: "Name the players. Any era. Any formation. Let's see how deep it goes.",
    status: 'soon' as const,
    accent: 'border-l-purple-500',
    accentBg: '',
    badge: '',
  },
  {
    num: 5,
    name: 'Player Wordle',
    slug: 'player-wordle',
    desc: 'Mystery player. Six clues. One chance to look very clever in front of your mates.',
    status: 'soon' as const,
    accent: 'border-l-rose-500',
    accentBg: '',
    badge: '',
  },
]

export default function FootballGamesHub() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* ── Hero header with pitch lines ─────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#0d1a12] border-b border-[#1a2e1f]">
        {/* Pitch line SVG */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 220"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect x="30" y="15" width="740" height="190" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <line x1="400" y1="15" x2="400" y2="205" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <circle cx="400" cy="110" r="65" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <circle cx="400" cy="110" r="3" fill="white" fillOpacity="0.07" />
          <rect x="30" y="65" width="110" height="90" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <rect x="660" y="65" width="110" height="90" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <rect x="30" y="85" width="50" height="50" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <rect x="720" y="85" width="50" height="50" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <circle cx="113" cy="110" r="2.5" fill="white" fillOpacity="0.07" />
          <circle cx="687" cy="110" r="2.5" fill="white" fillOpacity="0.07" />
          <path d="M30,15 Q45,15 45,30" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <path d="M770,15 Q755,15 755,30" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <path d="M30,205 Q45,205 45,190" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
          <path d="M770,205 Q755,205 755,190" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
        </svg>

        <div className="relative max-w-2xl mx-auto px-5 py-10">
          <Link
            href="/"
            className="inline-block text-[#4a7a5a] text-xs font-mono hover:text-emerald-400 transition-colors mb-7 tracking-wide"
          >
            ← randomorium.ai
          </Link>
          <div className="flex items-end gap-4 mb-3">
            <h1 className="text-4xl font-black tracking-tight leading-none uppercase">
              Football<br />Games
            </h1>
            <div className="mb-1 text-emerald-500 text-sm font-bold font-mono tracking-widest uppercase">Daily</div>
          </div>
          <p className="text-[#6b9e7a] text-sm max-w-sm leading-relaxed">
            Puzzles for people who watch too much football and have absolutely no regrets about it.
          </p>
        </div>
      </div>

      {/* ── Game cards ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-3">
        {GAMES.map((game) => (
          game.status === 'live' ? (
            <Link
              key={game.slug}
              href={`/apps/football-games/${game.slug}`}
              className={`group block bg-[#111] border border-[#1e1e1e] border-l-4 ${game.accent} rounded-lg overflow-hidden hover:border-[#2a2a2a] ${game.accentBg} transition-all`}
            >
              <GameCard game={game} />
            </Link>
          ) : (
            <div
              key={game.slug}
              className={`block bg-[#0d0d0d] border border-[#161616] border-l-4 ${game.accent} opacity-40 rounded-lg overflow-hidden cursor-not-allowed`}
            >
              <GameCard game={game} />
            </div>
          )
        ))}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <p className="text-center text-[#333] text-xs font-mono pb-10 px-5">
        More games incoming. Check back. Bring a friend with strong opinions about the 4-3-3.
      </p>
    </div>
  )
}

function GameCard({ game }: { game: typeof GAMES[0] }) {
  return (
    <div className="flex items-center gap-5 px-5 py-4">
      <div className="flex-shrink-0 text-center">
        <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">Game</div>
        <div className="text-2xl font-black text-[#333]">{String(game.num).padStart(2, '0')}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-base tracking-tight">{game.name}</span>
          {game.status === 'live' ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase ${game.badge}`}>Live</span>
          ) : (
            <span className="text-[10px] font-mono text-[#444] border border-[#2a2a2a] px-2 py-0.5 rounded-full tracking-widest uppercase">Soon</span>
          )}
        </div>
        <p className="text-[#666] text-xs leading-relaxed">{game.desc}</p>
      </div>
      {game.status === 'live' && (
        <div className="flex-shrink-0 text-emerald-600 text-lg">→</div>
      )}
    </div>
  )
}
