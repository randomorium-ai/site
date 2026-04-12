import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Archive · Six Degrees · Footballorium',
  description: 'Replay past Six Degrees puzzles.',
}

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

export default function SixDegreesArchive() {
  const dates = getPastDates(30)
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
      <div className="bg-blue-500 px-5 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/apps/football-games/six-degrees" className="inline-block text-white/60 text-xs font-mono hover:text-white transition-colors mb-5 tracking-wide">
            ← Six Degrees
          </Link>
          <h1 className="text-3xl font-black tracking-tight uppercase text-white">Archive</h1>
          <p className="text-white/70 text-sm mt-1">Past puzzles. Results won&apos;t affect your streak.</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 py-4 space-y-2">
        {dates.map(dateStr => (
          <Link
            key={dateStr}
            href={`/apps/football-games/six-degrees?date=${dateStr}`}
            className="flex items-center justify-between bg-white border border-[#e5e5e5] rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <div className="text-sm font-bold text-[#1a1a1a]">{formatDate(dateStr)}</div>
            <div className="text-blue-400 text-sm font-bold">Play →</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
