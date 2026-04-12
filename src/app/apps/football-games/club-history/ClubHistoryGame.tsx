'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { fuzzyMatchClub } from '@/lib/fuzzy-match'
import { nationalityFlag } from '@/lib/football-utils'
import type { CareerClub, Player } from '@/lib/player'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiResponse {
  player: Player
  clubs: CareerClub[]
  dateStr: string
}

const STORAGE_KEY = 'nf_clubhistory_v1'
const MAX_GUESSES = 8

// ─── Storage ──────────────────────────────────────────────────────────────────

interface GameStorage { streak: number; lastDate: string; history: { score: number; dateStr: string }[] }

function getStorage(): GameStorage {
  if (typeof window === 'undefined') return { streak: 0, lastDate: '', history: [] }
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? { streak: 0, lastDate: '', history: [] } }
  catch { return { streak: 0, lastDate: '', history: [] } }
}

function saveStorage(dateStr: string, score: number): GameStorage {
  const stored = getStorage()
  const diffDays = Math.round((new Date(dateStr).getTime() - new Date(stored.lastDate || '2000-01-01').getTime()) / 86400000)
  const streak = diffDays === 1 ? stored.streak + 1 : diffDays === 0 ? stored.streak : 1
  const history = [{ score, dateStr }, ...stored.history.filter(e => e.dateStr !== dateStr)].slice(0, 30)
  const next = { streak, lastDate: dateStr, history }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

// ─── Score ────────────────────────────────────────────────────────────────────

function calcScore(found: number, total: number, guesses: number): number {
  if (found === 0) return 0
  const completionBonus = found === total ? 200 : 0
  const perClub = Math.max(0, 100 - (guesses - found) * 15)
  return Math.min(1000, found * perClub + completionBonus)
}

function scoreLabel(score: number): string {
  if (score >= 900) return 'You literally wrote his Wikipedia page'
  if (score >= 700) return 'Proper football nerd'
  if (score >= 500) return 'Decent knowledge'
  if (score >= 300) return 'Vaguely heard of him'
  return 'Confused him with someone else'
}

// ─── Date display ─────────────────────────────────────────────────────────────
// `to: null` means the scraper didn't find an end year — not necessarily current.
// Only show "present" if the club name matches the player's current_club.
function clubYears(c: CareerClub, currentClub: string): string {
  if (c.to !== null) {
    return c.to === c.from ? String(c.from) : `${c.from}–${c.to}`
  }
  const norm = (s: string) => s.toLowerCase().trim()
  return norm(c.club) === norm(currentClub) ? `${c.from}–present` : String(c.from)
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClubHistoryGame({ date }: { date?: string }) {
  const isArchive = Boolean(date)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [phase, setPhase] = useState<'loading' | 'playing' | 'won' | 'lost' | 'error'>('loading')

  const [found, setFound] = useState<Set<string>>(new Set())   // club keys (normalised)
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [flashWrong, setFlashWrong] = useState(false)
  const [flashRight, setFlashRight] = useState(false)
  const [copied, setCopied] = useState(false)
  const [streak, setStreak] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const storageRef = useRef<GameStorage>({ streak: 0, lastDate: '', history: [] })

  useEffect(() => {
    storageRef.current = getStorage()
    fetch(`/api/football/club-history/daily${date ? `?date=${date}` : ''}`)
      .then(r => r.json())
      .then((d: ApiResponse) => {
        setData(d)
        setPhase('playing')
      })
      .catch(() => setPhase('error'))
  }, [])

  useEffect(() => {
    if (phase === 'playing') setTimeout(() => inputRef.current?.focus(), 50)
  }, [phase])

  if (phase === 'loading') {
    return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center"><div className="text-[#999] text-sm font-mono">Loading today&apos;s player…</div></div>
  }
  if (phase === 'error' || !data) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-5 gap-4">
        <div className="text-3xl">⚠️</div>
        <div className="font-bold">Couldn&apos;t load today&apos;s game</div>
        <Link href="/apps/football-games" className="text-blue-500 text-sm hover:underline">← All games</Link>
      </div>
    )
  }

  const { player, clubs, dateStr } = data
  const totalClubs = clubs.length
  const guessesUsed = wrongGuesses.length + found.size
  const guessesLeft = MAX_GUESSES - guessesUsed

  function normaliseKey(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  }

  function submitGuess() {
    const val = inputValue.trim()
    if (!val) return

    // Check against each club not yet found
    const match = clubs.find(c => {
      const key = normaliseKey(c.club)
      if (found.has(key)) return false
      return fuzzyMatchClub(val, c.club)
    })

    if (match) {
      const key = normaliseKey(match.club)
      const newFound = new Set(found).add(key)
      setFound(newFound)
      setFlashRight(true)
      setTimeout(() => setFlashRight(false), 600)
      setInputValue('')

      const newGuessesUsed = wrongGuesses.length + newFound.size
      if (newFound.size === totalClubs) {
        const s = calcScore(newFound.size, totalClubs, newGuessesUsed)
        if (!isArchive) { const stored = saveStorage(dateStr, s); storageRef.current = stored; setStreak(stored.streak) }
        setPhase('won')
      }
    } else {
      // Wrong guess
      const newWrong = [...wrongGuesses, val]
      setWrongGuesses(newWrong)
      setFlashWrong(true)
      setTimeout(() => setFlashWrong(false), 600)
      setInputValue('')

      const newGuessesUsed = newWrong.length + found.size
      if (newGuessesUsed >= MAX_GUESSES) {
        const s = calcScore(found.size, totalClubs, MAX_GUESSES)
        if (!isArchive) storageRef.current = saveStorage(dateStr, s)
        setPhase('lost')
      }
    }
  }

  const finalScore = calcScore(found.size, totalClubs, guessesUsed)
  const isOver = phase === 'won' || phase === 'lost'

  function share() {
    const blocks = clubs.map(c => found.has(normaliseKey(c.club)) ? '🟩' : '⬜').join('')
    const text = [
      `⚽ CLUB HISTORY — ${dateStr}`,
      `${found.size}/${totalClubs} clubs · ${finalScore} pts`,
      blocks,
      'randomorium.ai/apps/football-games/club-history',
    ].join('\n')
    if (navigator.share) navigator.share({ text }).catch(() => { })
    else navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  // ── Result screen ───────────────────────────────────────────────────────────
  if (isOver) {
    return (
      <div className="min-h-screen bg-[#fafafa] px-5 py-10">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black uppercase tracking-tight">Club History</h1>
            <div className="text-[#999] text-xs font-mono mt-1">{dateStr}</div>
          </div>

          {/* Player reveal */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 mb-4 flex items-center gap-4">
            <div className="text-4xl">{nationalityFlag(player.nationality)}</div>
            <div>
              <div className="font-black text-lg text-[#1a1a1a]">{player.name}</div>
              <div className="text-sm text-[#666]">{player.nationality} · {player.position}</div>
            </div>
          </div>

          {/* Score */}
          <div className={`rounded-xl p-5 mb-4 text-center ${phase === 'won' ? 'bg-[#f0f7f3] border border-[#1a7a3e]' : 'bg-[#fff5f5] border border-red-200'}`}>
            <div className={`font-black text-xl ${phase === 'won' ? 'text-[#1a7a3e]' : 'text-red-600'}`}>{finalScore} pts</div>
            <div className={`text-sm mt-1 ${phase === 'won' ? 'text-[#1a7a3e]' : 'text-red-500'}`}>{scoreLabel(finalScore)}</div>
            {phase === 'won' && streak > 1 && (
              <div className="text-sm font-bold text-[#1a7a3e] mt-2">🔥 {streak} day streak</div>
            )}
          </div>

          {/* Full club list */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-5">
            <div className="text-xs text-[#999] font-mono uppercase tracking-widest mb-3">All clubs</div>
            <div className="space-y-2">
              {clubs.map((c, i) => {
                const key = normaliseKey(c.club)
                const wasFound = found.has(key)
                return (
                  <div key={i} className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 ${wasFound ? 'bg-[#f0f7f3]' : 'bg-[#fafafa]'}`}>
                    <span className={`text-base ${wasFound ? '' : 'grayscale opacity-40'}`}>{wasFound ? '✅' : '❌'}</span>
                    <span className={`font-medium ${wasFound ? 'text-[#1a1a1a]' : 'text-[#999]'}`}>{c.club}</span>
                    <span className="ml-auto text-xs text-[#aaa]">{clubYears(c, player.current_club)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={share} className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold hover:border-[#ccc] transition-colors">
              {copied ? '✓ Copied' : '↗ Share'}
            </button>
            <Link href="/apps/football-games" className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-center hover:border-[#ccc] transition-colors">
              All games
            </Link>
            <Link href="/apps/football-games/archive" className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-center hover:border-[#ccc] transition-colors">
              📅 Archive
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[100dvh] bg-[#fafafa]">

      {/* Archive banner */}
      {isArchive && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <span className="text-xs font-bold text-amber-700">📅 Archive — {dateStr}</span>
          <span className="text-xs text-amber-600 ml-2">Results won&apos;t affect your streak</span>
        </div>
      )}

      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/apps/football-games" className="text-blue-500 text-sm font-medium hover:underline">← Back</Link>
          <div className="text-center">
            <div className="text-[10px] text-[#999] font-mono uppercase tracking-widest">Club History</div>
            <div className="text-xs font-bold text-[#1a1a1a] mt-0.5">{found.size}/{totalClubs} found</div>
          </div>
          <div className={`text-xs font-bold ${guessesLeft <= 2 ? 'text-red-500' : 'text-[#1a7a3e]'}`}>{guessesLeft} left</div>
        </div>
      </div>

      {/* Player info */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="text-3xl">{nationalityFlag(player.nationality)}</div>
          <div>
            <div className="font-bold text-[#1a1a1a]">{player.name}</div>
            <div className="text-xs text-[#999]">{player.nationality} · {player.position} · {player.age} yrs</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] text-[#aaa] uppercase tracking-wider">Clubs</div>
            <div className="text-lg font-black text-[#1a1a1a]">{totalClubs}</div>
          </div>
        </div>
      </div>

      {/* Club slots */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-3 space-y-2">
          {clubs.map((c, i) => {
            const key = normaliseKey(c.club)
            const wasFound = found.has(key)
            return (
              <div
                key={i}
                className={`rounded-lg px-4 py-3 border flex items-center justify-between transition-colors ${
                  wasFound
                    ? 'bg-[#f0f7f3] border-[#1a7a3e]'
                    : 'bg-white border-[#e5e5e5]'
                }`}
              >
                {wasFound ? (
                  <>
                    <span className="font-bold text-[#1a7a3e]">{c.club}</span>
                    <span className="text-xs text-[#aaa]">{clubYears(c, player.current_club)}</span>
                  </>
                ) : (
                  <>
                    <div className="flex gap-1">
                      {Array.from({ length: c.club.length }).map((_, j) => (
                        <span key={j} className={`inline-block w-1.5 h-1.5 rounded-full ${c.club[j] === ' ' ? 'opacity-0' : 'bg-[#d0d0d0]'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-[#aaa]">{clubYears(c, player.current_club)}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Wrong guesses */}
        {wrongGuesses.length > 0 && (
          <div className="max-w-xl mx-auto px-4 pb-3">
            <div className="text-xs text-[#aaa] uppercase tracking-widest mb-2">Wrong guesses</div>
            <div className="flex flex-wrap gap-1">
              {wrongGuesses.map((g, i) => (
                <span key={i} className="text-xs bg-[#fee2e2] text-red-600 px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className={`flex gap-2 transition-all ${flashWrong ? 'shake' : ''}`}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Name a club…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitGuess() }}
              className={`flex-1 bg-white border rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-blue-400 transition-colors ${
                flashWrong ? 'border-red-400 bg-red-50' : flashRight ? 'border-[#1a7a3e] bg-[#f0f7f3]' : 'border-[#e0e0e0]'
              }`}
            />
            <button
              onClick={submitGuess}
              disabled={!inputValue.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-purple-700 transition-colors"
            >
              Guess
            </button>
          </div>
          <div className="text-center text-xs text-[#aaa] mt-2">
            {guessesLeft} guess{guessesLeft !== 1 ? 'es' : ''} remaining · {found.size} of {totalClubs} found
          </div>
        </div>
      </div>
    </div>
  )
}
