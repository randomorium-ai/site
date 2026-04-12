'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getFormationPositions } from '@/lib/formation-layout'
import type { Player } from '@/lib/player'
import { nationalityFlag } from '@/lib/football-utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineupPlayer {
  number: number
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'ATT'
  nationality?: string
}

interface TeamSheet {
  team: string
  formation: string
  lineup: LineupPlayer[]
}

interface Match {
  id: string
  competition: string
  year: number
  round: string
  date: string
  score: string
  significance: string
  home: TeamSheet
  away: TeamSheet
}

type SlotKey = `${'home' | 'away'}-${number}`

interface SlotHints { firstLetter: boolean; nationality: boolean }

const STORAGE_KEY = 'nf_teamsheet_v2'
const MAX_SCORE_PER_PLAYER = 100
const FIRST_LETTER_COST = 5
const NATIONALITY_COST = 10

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

// ─── Fuzzy name matching ──────────────────────────────────────────────────────

function norm(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function nameMatches(guess: string, playerName: string): boolean {
  const g = norm(guess)
  const parts = norm(playerName).split(/\s+/)
  if (g === norm(playerName)) return true
  if (parts.length > 0 && g === parts[parts.length - 1]) return true
  if (parts.length > 1 && g === parts[0]) return true
  return false
}

// ─── Pitch colours by position ────────────────────────────────────────────────

const POS_BG: Record<string, string> = {
  GK: 'bg-amber-500',
  DEF: 'bg-blue-600',
  MID: 'bg-[#1a7a3e]',
  ATT: 'bg-red-600',
}

// ─── Combined pitch component ─────────────────────────────────────────────────
// Home team occupies the bottom half (attacking up), away team the top half
// (attacking down / mirrored). Positions from getFormationPositions are
// compressed into each respective half.

function halfY(originalY: number, side: 'home' | 'away'): number {
  // original: 0 = attack end, 100 = GK end
  // home: GK at bottom → map to [53, 96]
  // away: GK at top (flipped) → map to [4, 47]
  if (side === 'home') return 53 + (originalY / 100) * 43
  return 47 - (originalY / 100) * 43
}

interface CombinedPitchProps {
  home: TeamSheet
  away: TeamSheet
  correct: Set<SlotKey>
  hints: Map<SlotKey, SlotHints>
  wrongFlash: SlotKey | null
  selectedSlot: SlotKey | null
  onSlotClick: (key: SlotKey) => void
}

function CombinedPitch({ home, away, correct, hints, wrongFlash, selectedSlot, onSlotClick }: CombinedPitchProps) {
  const homePositions = getFormationPositions(home.formation)
  const awayPositions = getFormationPositions(away.formation)

  function renderTeam(sheet: TeamSheet, positions: ReturnType<typeof getFormationPositions>, side: 'home' | 'away') {
    return sheet.lineup.map((player, idx) => {
      const pos = positions[idx]
      if (!pos) return null
      const key: SlotKey = `${side}-${idx}`
      const isCorrect = correct.has(key)
      const isWrong = wrongFlash === key
      const isSelected = selectedSlot === key
      const slotHints = hints.get(key) ?? { firstLetter: false, nationality: false }
      const mappedY = halfY(pos.y, side)

      return (
        <button
          key={key}
          onClick={() => onSlotClick(key)}
          disabled={isCorrect}
          style={{ left: `${pos.x}%`, top: `${mappedY}%`, transform: 'translate(-50%, -50%)' }}
          className={`absolute flex flex-col items-center gap-0.5 transition-all z-10 ${isCorrect ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
        >
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black transition-colors ${
            isCorrect ? 'bg-white border-white text-[#1a7a3e]' :
            isWrong ? 'bg-red-500 border-red-300 text-white animate-pulse' :
            isSelected ? 'bg-yellow-400 border-yellow-200 text-[#1a1a1a]' :
            side === 'home' ? 'bg-white/25 border-white/60 text-white hover:bg-white/40' :
            'bg-black/30 border-white/40 text-white hover:bg-black/45'
          }`}>
            {isCorrect ? (
              <span className="leading-tight text-center px-0.5 truncate w-full" style={{ fontSize: '6px', fontWeight: 900 }}>
                {player.name.split(' ').pop()}
              </span>
            ) : slotHints.firstLetter ? (
              <span style={{ fontSize: '8px' }}>{player.name.split(' ').pop()![0].toUpperCase()}…</span>
            ) : (
              <span style={{ fontSize: '10px' }}>{player.number}</span>
            )}
          </div>
          {isCorrect ? null : slotHints.nationality && player.nationality ? (
            <span className="text-xs leading-none">{nationalityFlag(player.nationality)}</span>
          ) : (
            <span className="text-[7px] font-bold text-white/70">{player.position}</span>
          )}
        </button>
      )
    })
  }

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-[#c8e6c9]"
      style={{ background: 'linear-gradient(180deg, #2d8a4e 0%, #1a7a3e 100%)', aspectRatio: '0.62' }}
    >
      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 70 100" preserveAspectRatio="none" aria-hidden>
        <rect x="5" y="3" width="60" height="94" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.6" />
        <line x1="5" y1="50" x2="65" y2="50" stroke="white" strokeOpacity="0.25" strokeWidth="0.7" />
        <circle cx="35" cy="50" r="9" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.6" />
        <circle cx="35" cy="50" r="0.8" fill="white" fillOpacity="0.25" />
        {/* Top penalty area */}
        <rect x="18" y="3" width="34" height="14" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.6" />
        <rect x="26" y="3" width="18" height="7" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.6" />
        {/* Bottom penalty area */}
        <rect x="18" y="83" width="34" height="14" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.6" />
        <rect x="26" y="90" width="18" height="7" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.6" />
      </svg>

      {/* Team labels */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-white/50 z-10 whitespace-nowrap">
        {away.team}
      </div>
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-white/50 z-10 whitespace-nowrap">
        {home.team}
      </div>

      {/* Players */}
      {renderTeam(away, awayPositions, 'away')}
      {renderTeam(home, homePositions, 'home')}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TeamsheetGame() {
  const [match, setMatch] = useState<Match | null>(null)
  const [dateStr, setDateStr] = useState('')
  const [phase, setPhase] = useState<'loading' | 'playing' | 'won' | 'error'>('loading')

  const [correct, setCorrect] = useState<Set<SlotKey>>(new Set())
  const [hints, setHints] = useState<Map<SlotKey, SlotHints>>(new Map())
  const [wrongFlash, setWrongFlash] = useState<SlotKey | null>(null)
  const [score, setScore] = useState(0)

  const [selectedSlot, setSelectedSlot] = useState<SlotKey | null>(null)

  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [streak, setStreak] = useState(0)
  const [copied, setCopied] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const storageRef = useRef<GameStorage>({ streak: 0, lastDate: '', history: [] })
  const abortRef = useRef<AbortController | null>(null)

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

  // Player search
  useEffect(() => {
    const q = searchValue.trim()
    if (q.length < 2) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    fetch(`/api/football/players?search=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(({ players }: { players: Player[] }) => {
        setSearchResults((players ?? []).slice(0, 6))
      })
      .catch(() => { })
  }, [searchValue])

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

  const totalPlayers = match.home.lineup.length + match.away.lineup.length
  const maxScore = totalPlayers * MAX_SCORE_PER_PLAYER

  function handleSlotClick(key: SlotKey) {
    if (correct.has(key) || phase === 'won') return
    setSelectedSlot(key)
    setSearchValue('')
    setSearchResults([])
  }

  function attemptGuess(playerName: string) {
    if (!selectedSlot || !playerName.trim()) return
    const [team, idxStr] = selectedSlot.split('-') as ['home' | 'away', string]
    const idx = parseInt(idxStr)
    const sheet = match![team]
    const player = sheet.lineup[idx]

    if (nameMatches(playerName, player.name)) {
      const slotHints = hints.get(selectedSlot) ?? { firstLetter: false, nationality: false }
      const deduction = (slotHints.firstLetter ? FIRST_LETTER_COST : 0) + (slotHints.nationality ? NATIONALITY_COST : 0)
      const earned = MAX_SCORE_PER_PLAYER - deduction
      const newCorrect = new Set(correct).add(selectedSlot)
      const newScore = score + earned
      setCorrect(newCorrect)
      setScore(newScore)
      setSelectedSlot(null)
      setSearchValue('')
      setSearchResults([])
      if (newCorrect.size === totalPlayers) {
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

  function giveHint(type: 'firstLetter' | 'nationality') {
    if (!selectedSlot) return
    const current = hints.get(selectedSlot) ?? { firstLetter: false, nationality: false }
    if (current[type]) return
    setHints(prev => {
      const next = new Map(prev)
      next.set(selectedSlot, { ...current, [type]: true })
      return next
    })
  }

  function share() {
    const homeRow = match!.home.lineup.map((_, i) => correct.has(`home-${i}`) ? '🟩' : '⬜').join('')
    const awayRow = match!.away.lineup.map((_, i) => correct.has(`away-${i}`) ? '🟩' : '⬜').join('')
    const text = [
      `⚽ TEAMSHEET — ${dateStr}`,
      `${match!.home.team} vs ${match!.away.team}`,
      homeRow,
      awayRow,
      `${correct.size}/${totalPlayers} · ${score} pts`,
      'randomorium.ai/apps/football-games/teamsheet',
    ].join('\n')
    if (navigator.share) navigator.share({ text }).catch(() => { })
    else navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const selectedTeam = selectedSlot ? (selectedSlot.split('-')[0] as 'home' | 'away') : null
  const selectedIdx = selectedSlot ? parseInt(selectedSlot.split('-')[1]) : null
  const selectedPlayer = (selectedTeam !== null && selectedIdx !== null) ? match[selectedTeam].lineup[selectedIdx] : null
  const selectedHints = selectedSlot ? (hints.get(selectedSlot) ?? { firstLetter: false, nationality: false }) : null

  // ── Won screen ────────────────────────────────────────────────────────────────
  if (phase === 'won') {
    const label = scoreLabel(score, maxScore)
    return (
      <div className="min-h-screen bg-[#fafafa] px-5 py-10">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-5">
            <div className="text-[10px] text-[#999] font-mono uppercase tracking-widest">{match.competition}</div>
            <h1 className="text-xl font-black uppercase tracking-tight mt-1">{match.home.team} vs {match.away.team}</h1>
            <div className="text-[#999] text-xs font-mono mt-1">{match.round} · {match.year}</div>
          </div>

          <div className="bg-[#f0f7f3] border border-[#1a7a3e] rounded-xl p-5 mb-4 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="font-black text-xl text-[#1a7a3e]">{score} / {maxScore}</div>
            <div className="text-sm text-[#1a7a3e] mt-1">{label}</div>
            {streak > 1 && <div className="text-sm font-bold text-[#1a7a3e] mt-2">🔥 {streak} day streak</div>}
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4">
            <div className="text-xs text-[#999] font-mono uppercase tracking-widest mb-1">Result</div>
            <div className="font-bold text-lg">{match.score}</div>
            <div className="text-xs text-[#aaa] mt-0.5">{match.date} · {match.competition}</div>
            <div className="text-sm text-[#555] mt-2">{match.significance}</div>
          </div>

          {[{ side: 'home', sheet: match.home }, { side: 'away', sheet: match.away }].map(({ side, sheet }) => (
            <div key={side} className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-3">
              <div className="text-xs text-[#999] font-mono uppercase tracking-widest mb-2">{sheet.team} · {sheet.formation}</div>
              <div className="space-y-1">
                {sheet.lineup.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`text-[9px] font-black px-1 py-0.5 rounded ${POS_BG[p.position]} text-white`}>{p.position}</span>
                    <span className="font-medium text-[#1a1a1a]">{p.name}</span>
                    <span className="text-[#999] text-xs ml-auto">#{p.number}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

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

  // ── Playing ───────────────────────────────────────────────────────────────────
  const allFound = correct.size === totalPlayers

  return (
    <div className="flex flex-col h-[100dvh] bg-[#fafafa]">

      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/apps/football-games" className="text-blue-500 text-sm font-medium hover:underline">← Back</Link>
          <div className="text-center">
            <div className="text-[10px] text-[#999] font-mono uppercase tracking-widest">Teamsheet</div>
            <div className="text-xs font-bold text-[#1a1a1a] mt-0.5">{correct.size}/{totalPlayers} found</div>
          </div>
          <div className="text-xs font-bold text-[#1a7a3e]">{score} pts</div>
        </div>
      </div>

      {/* Match info */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#1a7a3e] px-2 py-0.5 rounded">{match.competition}</span>
            <span className="text-[10px] font-mono text-[#999]">{match.round}</span>
            <span className="text-[10px] font-mono text-[#999]">{match.year}</span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-sm font-bold text-[#1a1a1a]">{match.home.team}</span>
            <span className={`text-sm font-black tabular-nums ${allFound ? 'text-[#1a1a1a]' : 'blur-sm select-none'}`}>{match.score}</span>
            <span className="text-sm font-bold text-[#1a1a1a]">{match.away.team}</span>
          </div>
          <div className="text-xs text-[#aaa] mt-1 leading-snug">{match.significance}</div>
        </div>
      </div>

      {/* Combined pitch */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-3">
          <CombinedPitch
            home={match.home}
            away={match.away}
            correct={correct}
            hints={hints}
            wrongFlash={wrongFlash}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
          />
        </div>
      </div>

      {/* Input panel */}
      <div className="flex-shrink-0 bg-white border-t border-[#e5e5e5] px-4 py-3 relative">
        <div className="max-w-xl mx-auto">
          {selectedSlot !== null && selectedPlayer ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`text-[9px] font-black px-1.5 py-0.5 rounded ${POS_BG[selectedPlayer.position]} text-white`}>{selectedPlayer.position}</div>
                <span className="text-xs text-[#999]">#{selectedPlayer.number} · {selectedTeam === 'home' ? match.home.team : match.away.team}</span>
                <button onClick={() => { setSelectedSlot(null); setSearchValue(''); setSearchResults([]) }} className="ml-auto text-[#bbb] hover:text-[#666] text-sm">✕</button>
              </div>

              {/* Hint buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => giveHint('firstLetter')}
                  disabled={selectedHints?.firstLetter}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${selectedHints?.firstLetter ? 'bg-[#f0f0f0] border-[#e0e0e0] text-[#aaa]' : 'bg-white border-[#e0e0e0] text-[#666] hover:border-blue-400 hover:text-blue-600'}`}
                >
                  🔤 First letter (−{FIRST_LETTER_COST})
                </button>
                <button
                  onClick={() => giveHint('nationality')}
                  disabled={selectedHints?.nationality || !selectedPlayer.nationality}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${selectedHints?.nationality ? 'bg-[#f0f0f0] border-[#e0e0e0] text-[#aaa]' : 'bg-white border-[#e0e0e0] text-[#666] hover:border-blue-400 hover:text-blue-600'}`}
                >
                  🏳️ Nationality (−{NATIONALITY_COST})
                </button>
              </div>

              {/* Search autocomplete dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-1 bg-white border border-[#e5e5e5] rounded-xl shadow-lg overflow-hidden z-10 max-w-xl mx-auto">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onMouseDown={() => attemptGuess(p.name)}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#f5f5f5] border-b border-[#f0f0f0] last:border-0 transition-colors"
                    >
                      <span className="text-base">{nationalityFlag(p.nationality)}</span>
                      <div>
                        <div className="text-sm font-medium text-[#1a1a1a]">{p.name}</div>
                        <div className="text-xs text-[#999]">{p.nationality} · {p.position}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search or type player name…"
                  value={searchValue}
                  onChange={e => { setSearchValue(e.target.value); if (e.target.value.trim().length < 2) setSearchResults([]) }}
                  onKeyDown={e => { if (e.key === 'Enter' && !searchResults.length) attemptGuess(searchValue) }}
                  className="flex-1 bg-white border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => attemptGuess(searchValue)}
                  disabled={!searchValue.trim()}
                  className="px-4 py-2 bg-[#1a7a3e] text-white rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-[#155f30] transition-colors"
                >
                  Go
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-[#999]">
              {allFound ? 'All 22 players found! 🎉' : 'Tap a shirt number to guess the player'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
