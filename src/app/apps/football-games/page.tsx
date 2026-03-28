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
    desc: 'Pick 3 players whose stat totals a daily target. No hints. Just memory.',
    status: 'live' as const,
    icon: '🎯',
  },
  {
    num: 2,
    name: 'Six Degrees',
    slug: 'six-degrees',
    desc: 'Connect two players in 6 transfers or fewer.',
    status: 'soon' as const,
    icon: '🔗',
  },
  {
    num: 3,
    name: 'Teamsheet',
    slug: 'teamsheet',
    desc: 'Fill a formation with players who fit 11 positional criteria.',
    status: 'soon' as const,
    icon: '📋',
  },
  {
    num: 4,
    name: 'Club History',
    slug: 'club-history',
    desc: 'How well do you know a club\'s all-time squad?',
    status: 'soon' as const,
    icon: '🏟️',
  },
  {
    num: 5,
    name: 'Player Wordle',
    slug: 'player-wordle',
    desc: 'Guess the mystery player in 6 clues.',
    status: 'soon' as const,
    icon: '🟩',
  },
]

export default function FootballGamesHub() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12 w-full">
      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-[#666] text-xs hover:text-white transition-colors font-mono mb-6 block">
          ← randomorium.ai
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚽</span>
          <h1 className="text-2xl font-bold tracking-tight">Football Games</h1>
        </div>
        <p className="text-[#999] text-sm leading-relaxed">
          Daily puzzles for people who take football too seriously.
          New games daily. Streaks tracked. Dignity optional.
        </p>
      </div>

      {/* Game cards */}
      <div className="flex flex-col gap-3">
        {GAMES.map((game) => (
          <div key={game.slug}>
            {game.status === 'live' ? (
              <Link
                href={`/apps/football-games/${game.slug}`}
                className="block border border-[#333] rounded-xl p-4 hover:border-[#555] hover:bg-[#1a1a1a] transition-all group"
              >
                <GameCard game={game} />
              </Link>
            ) : (
              <div className="block border border-[#222] rounded-xl p-4 opacity-50 cursor-not-allowed">
                <GameCard game={game} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-[#444] text-xs font-mono text-center mt-10">
        More games coming. Check back. Bring a friend with opinions about Luka Modrić.
      </p>
    </div>
  )
}

function GameCard({ game }: { game: typeof GAMES[0] }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-lg">
        {game.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm">{game.name}</span>
          {game.status === 'live' ? (
            <span className="text-[10px] bg-[#6aaa64] text-black font-bold px-1.5 py-0.5 rounded tracking-wide">LIVE</span>
          ) : (
            <span className="text-[10px] text-[#555] border border-[#333] px-1.5 py-0.5 rounded tracking-wide font-mono">SOON</span>
          )}
        </div>
        <p className="text-[#888] text-xs leading-relaxed">{game.desc}</p>
      </div>
      <div className="text-[#444] text-xs font-mono flex-shrink-0 pt-1">#{game.num}</div>
    </div>
  )
}
