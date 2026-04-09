'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getFormationPositions } from '@/lib/formation-layout'
import { fuzzyMatchPlayer } from '@/lib/fuzzy-match'
import { nationalityFlag } from '@/lib/football-utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineupPlayer {
  number: number
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'ATT'
  nationality?: string
}

interface Match {
  id: string
  title: string
  subtitle: string
  teams: [string, string]
  score: string
  date: string
  competition: string
  formation: string
  lineup: LineupPlayer[]
}

interface SlotHints {
  nationality: boolean
  firstLetter: boolean
}

const STORAGE_KEY = 'nf_teamsheet_v1'
const MAX_SCORE_PER_PLAYER = 100
const NATIONALITY_HINT_COST = 10
const FIRST_LETTER_HINT_COST = 5

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

// ─── Score tier ───────────────────────────────────────────────────────────────

function scoreLabel(score: number, max: number): string {
  const pct = score / max
  if (pct >= 1) return 'You were there'
  if (pct >= 0.72) return 'Season ticket holder'
  if (pct >= 0.45) return 'Watched the highlights'
  if (pct >= 0.18) return 'Heard about it'
  return 'Were you even born?'
}

// ─── Pitch slot colours ───────────────────────────────────────────────────────

const POS_BG: Record<string, string> = {
  GK: 'bg-amber-500',
  DEF: 'bg-blue-600',
  MID: 'bg-[#1a7a3e]',
  ATT: 'bg-red-600',
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TeamsheetGame() {
  const [match, setMatch] = useState<Match | null>(null)
  const [dateStr, setDateStr] = useState('')
  const [phase, setPhase] = useState<'loading' | 'playing' | 'won' | 'error'>('loading')

  const [correct, setCorrect] = useState<Set<number>>(new Set())
  const [hints, setHints] = useState<Map<number, SlotHints>>(new Map())
  const [wrongFlash, setWrongFlash] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [copied, setCopied] = useState(false)

  const [streak, setStreak] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const storageRef = useRef<GameStorage>({ streak: 0, lastDate: '', history: [] })

  useEffect(() => {
    storageRef.current = getStorage()
    fetch('/api/football/teamsheet/daily')
      .then(r => r.json())
      .then(({ match: m, dateStr: d }: { match: Match; dateStr: string }) => {
        setMatch(m)
        setDateStr(d)
        setPhase('playing')
      })
      .catch(() => setPhase('error'))
  }, [])

  useEffect(() => {
    if (selectedSlot !== null) setTimeout(() => inputRef.current?.focus(), 50)
  }, [selectedSlot])

  if (phase === 'loading') {
    return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center"><div className="text-[#999] text-sm font-mono">Loading today&apos;s teamsheet…</div></div>
  }
  if (phase === 'error' || !match) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-5 gap-4">
        <div className="text-3xl">⚠️</div>
        <div className="font-bold">Couldn&apos;t load today&apos;s teamsheet</div>
        <Link href="/apps/football-games" className="text-blue-500 text-sm hover:underline">← All games</Link>
      </div>
    )
  }

  const positions = getFormationPositions(match.formation)
  const maxScore = match.lineup.length * MAX_SCORE_PER_PLAYER

  function handleSlotClick(idx: number) {
    if (correct.has(idx) || phase === 'won') return
    setSelectedSlot(idx)
    setInputValue('')
  }

  function submitGuess() {
    if (selectedSlot === null || !inputValue.trim()) return
    const player = match!.lineup[selectedSlot]
    if (fuzzyMatchPlayer(inputValue.trim(), player.name)) {
      const slotHints = hints.get(selectedSlot) ?? { nationality: false, firstLetter: false }
      const deduction = (slotHints.nationality ? NATIONALITY_HINT_COST : 0) + (slotHints.firstLetter ? FIRST_LETTER_HINT_COST : 0)
      const earned = MAX_SCORE_PER_PLAYER - deduction
      const newCorrect = new Set(correct).add(selectedSlot)
      const newScore = score + earned
      setCorrect(newCorrect)
      setScore(newScore)
      setSelectedSlot(null)
      setInputValue('')
      if (newCorrect.size === match!.lineup.length) {
        const stored = saveStorage(dateStr, newScore)
        storageRef.current = stored
        setStreak(stored.streak)
        setPhase('won')
      }
    } else {
      setWrongFlash(selectedSlot)
      setTimeout(() => setWrongFlash(null), 600)
    }
  }

  function giveHint(type: 'nationality' | 'firstLetter') {
    if (selectedSlot === null) return
    const current = hints.get(selectedSlot) ?? { nationality: false, firstLetter: false }
    if (current[type]) return
    setHints(prev => {
      const next = new Map(prev)
      next.set(selectedSlot, { ...current, [type]: true })
      return next
    })
  }

  function share() {
    if (!match) return
    const filled = correct.size
    const blocks = match.lineup.map((_, i) => correct.has(i) ? '🟩' : '⬜').join('')
    const text = [
      `⚽ TEAMSHEET — ${dateStr}`,
      `${match.title}`,
      blocks,
      `${filled}/${match.lineup.length} players · ${score} pts`,
      'randomorium.ai/apps/football-games/teamsheet',
    ].join('\n')
    if (navigator.share) navigator.share({ text }).catch(() => { })
    else navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const selectedPlayer = selectedSlot !== null ? match.lineup[selectedSlot] : null
  const selectedHints = selectedSlot !== null ? (hints.get(selectedSlot) ?? { nationality: false, firstLetter: false }) : null

  // ── Won screen ──────────────────────────────────────────────────────────────
  if (phase === 'won') {
    const label = scoreLabel(score, maxScore)
    return (
      <div className="min-h-screen bg-[#fafafa] px-5 py-10">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black uppercase tracking-tight">Teamsheet</h1>
            <div className="text-[#999] text-xs font-mono mt-1">{dateStr}</div>
          </div>
          <div className="bg-[#f0f7f3] border border-[#1a7a3e] rounded-xl p-5 mb-5 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="font-black text-xl text-[#1a7a3e]">{score} / {maxScore}</div>
            <div className="text-sm text-[#1a7a3e] mt-1">{label}</div>
            {streak > 1 && <div className="text-sm font-bold text-[#1a7a3e] mt-2">🔥 {streak} day streak</div>}
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4">
            <div className="text-xs text-[#999] font-mono uppercase tracking-widest mb-2">Today&apos;s match</div>
            <div className="font-bold text-[#1a1a1a]">{match.title}</div>
            <div className="text-sm text-[#666] mt-0.5">{match.subtitle} · {match.score}</div>
            <div className="text-xs text-[#999] mt-1">{match.date} · {match.competition}</div>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-5">
            <div className="text-xs text-[#999] font-mono uppercase tracking-widest mb-2">Full lineup ({match.formation})</div>
            <div className="space-y-1">
              {match.lineup.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={`text-[9px] font-black px-1 py-0.5 rounded ${POS_BG[p.position]} text-white`}>{p.position}</span>
                  <span className="font-medium text-[#1a1a1a]">{p.name}</span>
                  <span className="text-[#999] text-xs ml-auto">#{p.number}</span>
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
            <div className="text-[10px] text-[#999] font-mono uppercase tracking-widest">Teamsheet</div>
            <div className="text-xs font-bold text-[#1a1a1a] mt-0.5">{correct.size}/{match.lineup.length} found</div>
          </div>
          <div className="text-xs font-bold text-[#1a7a3e]">{score} pts</div>
        </div>
      </div>

      {/* Match info (blurred until complete) */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="text-xs font-bold text-[#1a1a1a]">{match.competition}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-[#666]">{match.teams[0]} vs {match.teams[1]}</span>
            <span className={`text-sm font-bold ${correct.size < match.lineup.length ? 'blur-sm select-none' : 'text-[#1a1a1a]'}`}>{match.score}</span>
          </div>
          <div className={`text-xs text-[#aaa] mt-0.5 ${correct.size < match.lineup.length ? 'blur-sm select-none' : ''}`}>{match.date}</div>
        </div>
      </div>

      {/* Pitch */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div
            className="relative w-full rounded-xl overflow-hidden border border-[#c8e6c9]"
            style={{ background: 'linear-gradient(180deg, #2d8a4e 0%, #1a7a3e 100%)', aspectRatio: '0.7' }}
          >
            {/* Pitch markings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 70 100" preserveAspectRatio="none" aria-hidden>
              <rect x="5" y="3" width="60" height="94" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="0.6" />
              <line x1="5" y1="50" x2="65" y2="50" stroke="white" strokeOpacity="0.25" strokeWidth="0.6" />
              <circle cx="35" cy="50" r="9" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="0.6" />
              <rect x="18" y="3" width="34" height="14" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="0.6" />
              <rect x="18" y="83" width="34" height="14" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="0.6" />
              <rect x="26" y="3" width="18" height="7" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="0.6" />
              <rect x="26" y="90" width="18" height="7" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="0.6" />
            </svg>

            {/* Player slots */}
            {match.lineup.map((player, idx) => {
              const pos = positions[idx]
              if (!pos) return null
              const isCorrect = correct.has(idx)
              const isWrong = wrongFlash === idx
              const isSelected = selectedSlot === idx
              const slotHints = hints.get(idx) ?? { nationality: false, firstLetter: false }

              return (
                <button
                  key={idx}
                  onClick={() => handleSlotClick(idx)}
                  disabled={isCorrect}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                  className={`absolute flex flex-col items-center gap-0.5 transition-all ${isCorrect ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                >
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-black transition-colors ${
                    isCorrect ? 'bg-white border-white text-[#1a7a3e]' :
                    isWrong ? 'bg-red-500 border-red-300 text-white animate-pulse' :
                    isSelected ? 'bg-yellow-400 border-yellow-200 text-[#1a1a1a]' :
                    'bg-white/20 border-white/50 text-white hover:bg-white/30'
                  }`}>
                    {isCorrect ? (
                      <span className="text-[9px] font-black leading-tight px-0.5 text-center truncate w-full" style={{ fontSize: '7px' }}>
                        {player.name.split(' ').pop()}
                      </span>
                    ) : slotHints.firstLetter ? (
                      player.name.split(' ').pop()![0].toUpperCase() + '…'
                    ) : (
                      player.number
                    )}
                  </div>
                  {isCorrect ? null : slotHints.nationality && player.nationality ? (
                    <span className="text-sm">{nationalityFlag(player.nationality)}</span>
                  ) : (
                    <span className={`text-[8px] font-bold ${isCorrect ? 'text-white' : 'text-white/70'}`}>{player.position}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Formation label */}
          <div className="text-center text-xs text-[#aaa] font-mono mt-2">{match.formation}</div>
        </div>
      </div>

      {/* Input panel */}
      <div className="flex-shrink-0 bg-white border-t border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto">
          {selectedSlot !== null && selectedPlayer ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`text-[9px] font-black px-1.5 py-0.5 rounded ${POS_BG[selectedPlayer.position]} text-white`}>{selectedPlayer.position}</div>
                <span className="text-xs text-[#999]">#{selectedPlayer.number} — who played here?</span>
                <button onClick={() => setSelectedSlot(null)} className="ml-auto text-[#bbb] hover:text-[#666] text-sm">✕</button>
              </div>

              {/* Hint buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => giveHint('firstLetter')}
                  disabled={selectedHints?.firstLetter}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${selectedHints?.firstLetter ? 'bg-[#f0f0f0] border-[#e0e0e0] text-[#aaa]' : 'bg-white border-[#e0e0e0] text-[#666] hover:border-blue-400 hover:text-blue-600'}`}
                >
                  🔤 First letter (−{FIRST_LETTER_HINT_COST} pts)
                </button>
                <button
                  onClick={() => giveHint('nationality')}
                  disabled={selectedHints?.nationality || !selectedPlayer.nationality}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${selectedHints?.nationality ? 'bg-[#f0f0f0] border-[#e0e0e0] text-[#aaa]' : 'bg-white border-[#e0e0e0] text-[#666] hover:border-blue-400 hover:text-blue-600'}`}
                >
                  🏳️ Nationality (−{NATIONALITY_HINT_COST} pts)
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type player name…"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitGuess() }}
                  className="flex-1 bg-white border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-blue-400"
                />
                <button
                  onClick={submitGuess}
                  disabled={!inputValue.trim()}
                  className="px-4 py-2 bg-[#1a7a3e] text-white rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-[#155f30] transition-colors"
                >
                  Go
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-[#999]">
              {correct.size < match.lineup.length
                ? 'Tap a numbered slot to guess the player'
                : 'All players found!'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
