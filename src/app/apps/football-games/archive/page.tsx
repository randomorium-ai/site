import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Archive · Footballorium · randomorium',
  description: 'Replay past Footballorium daily puzzles.',
}

const GAMES = [
  { slug: 'the-number',    name: 'The Number',    accent: 'bg-[#1a7a3e] text-white' },
  { slug: 'six-degrees',   name: 'Six Degrees',   accent: 'bg-blue-500 text-white' },
  { slug: 'teamsheet',     name: 'Teamsheet',     accent: 'bg-amber-500 text-white' },
  { slug: 'club-history',  name: 'Club History',  accent: 'bg-purple-500 text-white' },
  { slug: 'player-wordle', name: 'Player Wordle', accent: 'bg-rose-500 text-white' },
]

// Generate the last 30 days (excluding today)
function getPastDates(n: number): string[] {
  const dates: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 1; i <= n; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ArchivePage() {
  const today = new Date().toISOString().split('T')[0]
  const pastDates = getPastDates(30)

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
      {/* Header */}
      <div className="bg-[#1a7a3e] px-5 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/apps/football-games" className="inline-block text-white/60 text-xs font-mono hover:text-white transition-colors mb-5 tracking-wide">
            ← Footballorium
          </Link>
          <h1 className="text-3xl font-black tracking-tight uppercase text-white">Archive</h1>
          <p className="text-white/70 text-sm mt-1">Replay any past puzzle. Results don&apos;t affect your streak.</p>
        </div>
      </div>

      {/* Today */}
      <div className="max-w-2xl mx-auto px-5 pt-5 pb-2">
        <div className="text-xs font-bold text-[#999] uppercase tracking-widest mb-2">Today — {formatDate(today)}</div>
        <div className="flex flex-wrap gap-2">
          {GAMES.map(g => (
            <Link key={g.slug} href={`/apps/football-games/${g.slug}`}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${g.accent} hover:opacity-80 transition-opacity`}>
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Past dates */}
      <div className="max-w-2xl mx-auto px-5 py-4 space-y-3">
        <div className="text-xs font-bold text-[#999] uppercase tracking-widest">Past puzzles</div>
        {pastDates.map(dateStr => (
          <div key={dateStr} className="bg-white border border-[#e5e5e5] rounded-xl px-4 py-3">
            <div className="text-xs font-bold text-[#1a1a1a] mb-2">{formatDate(dateStr)}</div>
            <div className="flex flex-wrap gap-2">
              {GAMES.filter(g => g.slug !== 'the-number').map(g => (
                <Link key={g.slug} href={`/apps/football-games/${g.slug}?date=${dateStr}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${g.accent} hover:opacity-80 transition-opacity`}>
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
