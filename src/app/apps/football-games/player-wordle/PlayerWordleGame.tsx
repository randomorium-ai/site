'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Player } from '@/lib/player'
import { nationalityFlag } from '@/lib/football-utils'
import { getClubLeague } from '@/lib/club-league-map'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiResponse {
  mystery: Player
  dateStr: string
}

// Five columns: nationality, position, current_club, age, stat (goals or apps)
type ColResult = 'correct' | 'close' | 'wrong'

interface GuessResult {
  player: Player
  nationality: ColResult
  position: ColResult
  club: ColResult
  age: ColResult      // correct = exact, close = ±3 years
  stat: ColResult     // correct = exact, close = ±20
  ageArrow?: '↑' | '↓'
  statArrow?: '↑' | '↓'
}

const STORAGE_KEY = 'nf_playerwordle_v1'
const MAX_GUESSES = 6

// ─── Storage ──────────────────────────────────────────────────────────────────

interface GameStorage { streak: number; lastDate: string; history: { guesses: number; dateStr: string }[] }

function getStorage(): GameStorage {
  if (typeof window === 'undefined') return { streak: 0, lastDate: '', history: [] }
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? { streak: 0, lastDate: '', history: [] } }
  catch { return { streak: 0, lastDate: '', history: [] } }
}

function saveStorage(dateStr: string, guesses: number): GameStorage {
  const stored = getStorage()
  const diffDays = Math.round((new Date(dateStr).getTime() - new Date(stored.lastDate || '2000-01-01').getTime()) / 86400000)
  const streak = diffDays === 1 ? stored.streak + 1 : diffDays === 0 ? stored.streak : 1
  const history = [{ guesses, dateStr }, ...stored.history.filter(e => e.dateStr !== dateStr)].slice(0, 30)
  const next = { streak, lastDate: dateStr, history }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function compareNationality(guess: Player, mystery: Player): ColResult {
  if (guess.nationality === mystery.nationality) return 'correct'
  if (guess.confederation === mystery.confederation) return 'close'
  return 'wrong'
}

function comparePosition(guess: Player, mystery: Player): ColResult {
  if (guess.position === mystery.position) return 'correct'
  // GK/DEF/MID/ATT — adjacent positions count as close
  const order = ['GK', 'DEF', 'MID', 'ATT']
  const gi = order.indexOf(guess.position)
  const mi = order.indexOf(mystery.position)
  return Math.abs(gi - mi) === 1 ? 'close' : 'wrong'
}

function compareClub(guess: Player, mystery: Player): ColResult {
  if (!guess.current_club || !mystery.current_club) return 'wrong'
  if (guess.current_club === mystery.current_club) return 'correct'
  const gl = getClubLeague(guess.current_club)
  const ml = getClubLeague(mystery.current_club)
  if (gl && ml && gl === ml) return 'close'
  return 'wrong'
}

function compareStat(guess: Player, mystery: Player): [ColResult, '↑' | '↓' | undefined] {
  const gv = mystery.position === 'GK' ? guess.career_apps : guess.career_goals
  const mv = mystery.position === 'GK' ? mystery.career_apps : mystery.career_goals
  if (gv === mv) return ['correct', undefined]
  const diff = Math.abs(gv - mv)
  const arrow: '↑' | '↓' = gv < mv ? '↑' : '↓'
  return [diff <= 20 ? 'close' : 'wrong', arrow]
}

function compareAge(guess: Player, mystery: Player): [ColResult, '↑' | '↓' | undefined] {
  if (guess.age === mystery.age) return ['correct', undefined]
  const diff = Math.abs(guess.age - mystery.age)
  const arrow: '↑' | '↓' = guess.age < mystery.age ? '↑' : '↓'
  return [diff <= 3 ? 'close' : 'wrong', arrow]
}

function evaluate(guess: Player, mystery: Player): GuessResult {
  const [ageCR, ageArrow] = compareAge(guess, mystery)
  const [statCR, statArrow] = compareStat(guess, mystery)
  return {
    player: guess,
    nationality: compareNationality(guess, mystery),
    position: comparePosition(guess, mystery),
    club: compareClub(guess, mystery),
    age: ageCR,
    ageArrow,
    stat: statCR,
    statArrow,
  }
}

// ─── Cell colours ─────────────────────────────────────────────────────────────

function cellBg(r: ColResult): string {
  if (r === 'correct') return 'bg-[#1a7a3e] text-white border-[#1a7a3e]'
  if (r === 'close') return 'bg-amber-500 text-white border-amber-500'
  return 'bg-white text-[#666] border-[#e5e5e5]'
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayerWordleGame() {
  const [mystery, setMystery] = useState<Player | null>(null)
  const [dateStr, setDateStr] = useState('')
  const [phase, setPhase] = useState<'loading' | 'playing' | 'won' | 'lost' | 'error'>('loading')

  const [guesses, setGuesses] = useState<GuessResult[]>([])
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Player[]>([])
  const [copied, setCopied] = useState(false)
  const [streak, setStreak] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const storageRef = useRef<GameStorage>({ streak: 0, lastDate: '', history: [] })
  const searchAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    storageRef.current = getStorage()
    fetch('/api/football/player-wordle/daily')
      .then(r => r.json())
      .then((d: ApiResponse) => {
        setMystery(d.mystery)
        setDateStr(d.dateStr)
        setPhase('playing')
      })
      .catch(() => setPhase('error'))
  }, [])

  useEffect(() => {
    if (phase === 'playing') setTimeout(() => inputRef.current?.focus(), 50)
  }, [phase])

  useEffect(() => {
    const q = inputValue.trim()
    if (q.length < 2) return

    searchAbort.current?.abort()
    const ctrl = new AbortController()
    searchAbort.current = ctrl

    fetch(`/api/football/players?search=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(({ players }: { players: Player[] }) => {
        setSuggestions((players ?? []).filter(p => !guesses.some(g => g.player.id === p.id)).slice(0, 6))
      })
      .catch(() => { })
  }, [inputValue, guesses])

  if (phase === 'loading') {
    return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center"><div className="text-[#999] text-sm font-mono">Loading today&apos;s player…</div></div>
  }
  if (phase === 'error' || !mystery) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-5 gap-4">
        <div className="text-3xl">⚠️</div>
        <div className="font-bold">Couldn&apos;t load today&apos;s player</div>
        <Link href="/apps/football-games" className="text-blue-500 text-sm hover:underline">← All games</Link>
      </div>
    )
  }

  function selectPlayer(player: Player) {
    setSuggestions([])
    setInputValue('')

    if (guesses.some(g => g.player.id === player.id)) return

    const result = evaluate(player, mystery!)
    const newGuesses = [...guesses, result]
    setGuesses(newGuesses)

    if (player.id === mystery!.id) {
      const stored = saveStorage(dateStr, newGuesses.length)
      storageRef.current = stored
      setStreak(stored.streak)
      setPhase('won')
    } else if (newGuesses.length >= MAX_GUESSES) {
      storageRef.current = saveStorage(dateStr, MAX_GUESSES + 1)
      setPhase('lost')
    }

    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function share() {
    const emojiGrid = guesses.map(g =>
      [g.nationality, g.position, g.club, g.age, g.stat].map(r =>
        r === 'correct' ? '🟩' : r === 'close' ? '🟨' : '⬜'
      ).join('')
    ).join('\n')

    const outcome = phase === 'won' ? `${guesses.length}/${MAX_GUESSES}` : 'X/6'
    const text = [
      `⚽ PLAYER WORDLE — ${dateStr}`,
      outcome,
      '',
      emojiGrid,
      'randomorium.ai/apps/football-games/player-wordle',
    ].join('\n')
    if (navigator.share) navigator.share({ text }).catch(() => { })
    else navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const isOver = phase === 'won' || phase === 'lost'
  const statLabel = mystery.position === 'GK' ? 'Apps' : 'Goals'

  // ── Column headers ──────────────────────────────────────────────────────────
  const COLS = ['🏳️ Nation', '📍 Pos', '🏟 Club', '🎂 Age', `⚽ ${statLabel}`]

  function cellValue(g: GuessResult, col: number): string {
    switch (col) {
      case 0: return nationalityFlag(g.player.nationality) + ' ' + g.player.nationality
      case 1: return g.player.position
      case 2: return g.player.current_club || 'Retired'
      case 3: return String(g.player.age) + (g.ageArrow ?? '')
      case 4: {
        const v = mystery!.position === 'GK' ? g.player.career_apps : g.player.career_goals
        return String(v) + (g.statArrow ?? '')
      }
    }
    return ''
  }

  function cellResult(g: GuessResult, col: number): ColResult {
    switch (col) {
      case 0: return g.nationality
      case 1: return g.position
      case 2: return g.club
      case 3: return g.age
      case 4: return g.stat
    }
    return 'wrong'
  }

  // ── Won / lost screen ────────────────────────────────────────────────────────
  if (isOver) {
    return (
      <div className="min-h-screen bg-[#fafafa] px-5 py-10">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black uppercase tracking-tight">Player Wordle</h1>
            <div className="text-[#999] text-xs font-mono mt-1">{dateStr}</div>
          </div>

          {/* Player reveal */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 mb-4 flex items-center gap-4">
            <div className="text-4xl">{nationalityFlag(mystery.nationality)}</div>
            <div>
              <div className="font-black text-lg text-[#1a1a1a]">{mystery.name}</div>
              <div className="text-sm text-[#666]">{mystery.nationality} · {mystery.position} · {mystery.current_club || 'Retired'}</div>
              <div className="text-xs text-[#aaa] mt-0.5">Age {mystery.age} · {statLabel}: {mystery.position === 'GK' ? mystery.career_apps : mystery.career_goals}</div>
            </div>
          </div>

          {/* Result */}
          <div className={`rounded-xl p-4 mb-4 text-center ${phase === 'won' ? 'bg-[#f0f7f3] border border-[#1a7a3e]' : 'bg-[#fff5f5] border border-red-200'}`}>
            <div className={`font-black text-xl ${phase === 'won' ? 'text-[#1a7a3e]' : 'text-red-600'}`}>
              {phase === 'won' ? `${guesses.length}/${MAX_GUESSES}` : 'Better luck tomorrow'}
            </div>
            {phase === 'won' && streak > 1 && (
              <div className="text-sm font-bold text-[#1a7a3e] mt-1">🔥 {streak} day streak</div>
            )}
          </div>

          {/* Guess grid */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4 overflow-x-auto">
            <div className="min-w-[340px]">
              <div className="grid grid-cols-5 gap-1 mb-2">
                {COLS.map((h, i) => (
                  <div key={i} className="text-center text-[9px] text-[#aaa] uppercase tracking-wider font-mono px-1">{h}</div>
                ))}
              </div>
              {guesses.map((g, ri) => (
                <div key={ri} className="grid grid-cols-5 gap-1 mb-1">
                  {COLS.map((_, ci) => (
                    <div key={ci} className={`text-center text-[9px] font-bold px-1 py-2 rounded border leading-tight ${cellBg(cellResult(g, ci))}`}>
                      {cellValue(g, ci)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={share} className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold hover:border-[#ccc] transition-colors">
              {copied ? '✓ Copied' : '↗ Share'}
            </button>
            <Link href="/apps/football-games" className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-center hover:border-[#ccc] transition-colors">
              All games
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[100dvh] bg-[#fafafa]">

      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/apps/football-games" className="text-blue-500 text-sm font-medium hover:underline">← Back</Link>
          <div className="text-center">
            <div className="text-[10px] text-[#999] font-mono uppercase tracking-widest">Player Wordle</div>
            <div className="text-xs font-bold text-[#1a1a1a] mt-0.5">{guesses.length}/{MAX_GUESSES} guesses</div>
          </div>
          <div className={`text-xs font-bold ${MAX_GUESSES - guesses.length <= 2 ? 'text-red-500' : 'text-[#1a7a3e]'}`}>
            {MAX_GUESSES - guesses.length} left
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-3 overflow-x-auto">
          <div className="min-w-[340px]">
            {/* Column headers */}
            <div className="grid grid-cols-5 gap-1 mb-2">
              {COLS.map((h, i) => (
                <div key={i} className="text-center text-[9px] text-[#aaa] uppercase tracking-wider font-mono">{h}</div>
              ))}
            </div>

            {/* Past guesses */}
            {guesses.map((g, ri) => (
              <div key={ri} className="grid grid-cols-5 gap-1 mb-1">
                {COLS.map((_, ci) => (
                  <div key={ci} className={`text-center text-[9px] font-bold px-1 py-3 rounded border leading-tight ${cellBg(cellResult(g, ci))}`}>
                    {cellValue(g, ci)}
                  </div>
                ))}
              </div>
            ))}

            {/* Empty rows */}
            {Array.from({ length: MAX_GUESSES - guesses.length }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-1 mb-1">
                {COLS.map((_, ci) => (
                  <div key={ci} className="border border-[#e5e5e5] rounded py-3" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Key */}
        <div className="max-w-xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-3 text-xs text-[#999]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1a7a3e] inline-block" /> Correct</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Close</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#e5e5e5] inline-block" /> Wrong</span>
          </div>
          <div className="text-xs text-[#aaa] mt-1">Close = same confederation / adjacent position / same league / ±3 yrs / ±20 {statLabel.toLowerCase()}</div>
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-[#e5e5e5] px-4 py-3 relative">
        <div className="max-w-xl mx-auto">
          {suggestions.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-1 bg-white border border-[#e5e5e5] rounded-xl shadow-lg overflow-hidden z-10 max-w-xl mx-auto">
              {suggestions.map(p => (
                <button
                  key={p.id}
                  onMouseDown={() => selectPlayer(p)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#f5f5f5] border-b border-[#f0f0f0] last:border-0 transition-colors"
                >
                  <span className="text-lg">{nationalityFlag(p.nationality)}</span>
                  <div>
                    <div className="text-sm font-medium text-[#1a1a1a]">{p.name}</div>
                    <div className="text-xs text-[#999]">{p.nationality} · {p.position} · {p.current_club || 'Retired'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a player…"
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); if (e.target.value.trim().length < 2) setSuggestions([]) }}
            className="w-full bg-white border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-rose-400"
          />
          <div className="text-center text-xs text-[#aaa] mt-2">
            Type a name to search — select from the list to guess
          </div>
        </div>
      </div>
    </div>
  )
}
