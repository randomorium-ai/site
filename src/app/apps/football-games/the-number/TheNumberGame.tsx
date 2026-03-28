'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  players, getDailyPuzzle, getStat, calcScore, scoreLabel,
  type Player, type StatKey,
} from '@/data/players'

// ─── Constants ───────────────────────────────────────────────────────────────

const PICKS_PER_PLAYER = 3
const STORAGE_KEY = 'nf_the_number_v1'

const POS_COLOR: Record<string, string> = {
  GK: 'bg-amber-600',
  DEF: 'bg-blue-700',
  MID: 'bg-emerald-700',
  ATT: 'bg-red-700',
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = 'solo' | 'two_player'
type Phase = 'setup' | 'picking' | 'revealed'

interface StoredEntry {
  score: number
  mode: Mode
  dateStr: string
}

interface GameStorage {
  streak: number
  lastDate: string
  history: StoredEntry[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStorage(): GameStorage {
  if (typeof window === 'undefined') return { streak: 0, lastDate: '', history: [] }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? { streak: 0, lastDate: '', history: [] }
  } catch { return { streak: 0, lastDate: '', history: [] } }
}

function saveStorage(data: GameStorage) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function updateStreak(dateStr: string, score: number): GameStorage {
  const stored = getStorage()
  const prev = new Date(stored.lastDate || '2000-01-01')
  const today = new Date(dateStr)
  const diffDays = Math.round((today.getTime() - prev.getTime()) / 86400000)

  const streak = diffDays === 1 ? stored.streak + 1 : diffDays === 0 ? stored.streak : 1
  const entry: StoredEntry = { score, mode: 'solo', dateStr }
  const history = [entry, ...stored.history.filter(e => e.dateStr !== dateStr)].slice(0, 30)

  const next = { streak, lastDate: dateStr, history }
  saveStorage(next)
  return next
}

function timeUntilMidnight(): string {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}m`
}

function buildShareText(
  dateStr: string,
  theme: string,
  target: number,
  picks: Player[],
  total: number,
  score: number,
  stat: StatKey,
): string {
  const lines = [
    `⚽ THE NUMBER — ${dateStr}`,
    `Theme: ${theme} | Target: ${target}`,
    '',
    ...picks.map(p => `  ${p.flag} ${p.name}: ${getStat(p, stat)}`),
    '',
    `Total: ${total} | Score: ${score}/1000`,
    'randomorium.ai/apps/football-games/the-number',
  ]
  return lines.join('\n')
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TheNumberGame() {
  const puzzle = useMemo(() => getDailyPuzzle(), [])
  const { theme, target, dateStr } = puzzle

  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<Mode>('solo')
  const [p1Picks, setP1Picks] = useState<Player[]>([])
  const [p2Picks, setP2Picks] = useState<Player[]>([])
  const [turnIdx, setTurnIdx] = useState(0) // 0-5 in 2p, 0-2 in solo
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState<string>('ALL')
  const [storage, setStorage] = useState<GameStorage>({ streak: 0, lastDate: '', history: [] })
  const [copied, setCopied] = useState(false)

  useEffect(() => { setStorage(getStorage()) }, [])

  // Derived state
  const isSolo = mode === 'solo'
  const currentP = isSolo ? 1 : (turnIdx % 2 === 0 ? 1 : 2)
  const myPicks = isSolo ? p1Picks : currentP === 1 ? p1Picks : p2Picks
  const picksComplete = isSolo ? p1Picks.length === PICKS_PER_PLAYER : (p1Picks.length === PICKS_PER_PLAYER && p2Picks.length === PICKS_PER_PLAYER)
  const allPickedIds = new Set([...p1Picks.map(p => p.id), ...p2Picks.map(p => p.id)])

  const p1Total = p1Picks.reduce((s, p) => s + getStat(p, theme.stat), 0)
  const p2Total = p2Picks.reduce((s, p) => s + getStat(p, theme.stat), 0)
  const p1Score = calcScore(p1Total, target)
  const p2Score = calcScore(p2Total, target)

  // Filtered player list
  const filteredPlayers = useMemo(() => {
    const q = search.toLowerCase()
    return players.filter(p =>
      !allPickedIds.has(p.id) &&
      (posFilter === 'ALL' || p.position === posFilter) &&
      (q === '' || p.name.toLowerCase().includes(q) || p.currentClub.toLowerCase().includes(q) || p.nationality.toLowerCase().includes(q))
    )
  }, [search, posFilter, allPickedIds])

  function pick(player: Player) {
    if (phase !== 'picking') return
    if (allPickedIds.has(player.id)) return

    if (isSolo) {
      if (p1Picks.length >= PICKS_PER_PLAYER) return
      setP1Picks(prev => [...prev, player])
    } else {
      if (currentP === 1 && p1Picks.length >= PICKS_PER_PLAYER) return
      if (currentP === 2 && p2Picks.length >= PICKS_PER_PLAYER) return
      if (currentP === 1) setP1Picks(prev => [...prev, player])
      else setP2Picks(prev => [...prev, player])
      setTurnIdx(i => i + 1)
    }
  }

  function unpick(playerId: string, fromP1: boolean) {
    if (phase !== 'picking') return
    if (fromP1) setP1Picks(prev => prev.filter(p => p.id !== playerId))
    else setP2Picks(prev => prev.filter(p => p.id !== playerId))
  }

  function reveal() {
    if (!picksComplete) return
    setPhase('revealed')
    if (isSolo) {
      const next = updateStreak(dateStr, p1Score)
      setStorage(next)
    }
  }

  function reset() {
    setPhase('setup')
    setP1Picks([]); setP2Picks([])
    setTurnIdx(0); setSearch(''); setPosFilter('ALL')
  }

  async function share() {
    const text = buildShareText(dateStr, theme.label, target, p1Picks, p1Total, p1Score, theme.stat)
    try {
      if (navigator.share) await navigator.share({ text })
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    } catch { /* ignore */ }
  }

  // ── Render: Setup ──
  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto px-4 py-10 w-full">
        <div className="mb-6">
          <Link href="/apps/football-games" className="text-[#666] text-xs hover:text-white transition-colors font-mono">
            ← all games
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1 tracking-tight">THE NUMBER</h1>
          {storage.streak > 1 && (
            <div className="text-sm text-[#999] mb-4">🔥 {storage.streak} day streak</div>
          )}
          <div className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-[#333] rounded-full px-4 py-1.5 text-xs text-[#999] font-mono mb-6">
            <span>Daily puzzle</span>
            <span>·</span>
            <span>{dateStr}</span>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 mb-6 text-left">
            <p className="text-xs text-[#666] font-mono uppercase tracking-widest mb-1">How to play</p>
            <p className="text-[#bbb] text-sm leading-relaxed">
              Pick <strong className="text-white">3 footballers</strong>. Their combined <strong className="text-white">{theme.label.toLowerCase()}</strong> should get as close to <strong className="text-white">{target}</strong> as possible. No hints — just your football brain.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-[#666] font-mono uppercase tracking-widest mb-3">Mode</p>
          <div className="grid grid-cols-2 gap-2">
            {(['solo', 'two_player'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${mode === m ? 'border-white bg-white text-black' : 'border-[#333] text-[#999] hover:border-[#555]'}`}
              >
                {m === 'solo' ? '🧠 Solo' : '👥 2 Player'}
              </button>
            ))}
          </div>
          {mode === 'two_player' && (
            <p className="text-[#666] text-xs mt-2 text-center font-mono">Players alternate picks · 3 each · closest total wins</p>
          )}
        </div>

        <button
          onClick={() => setPhase('picking')}
          className="w-full py-4 bg-white text-black rounded-xl font-bold text-sm hover:bg-[#eee] transition-colors"
        >
          Start →
        </button>
      </div>
    )
  }

  // ── Render: Picking ──
  if (phase === 'picking') {
    const runningTotal = isSolo
      ? p1Picks.reduce((s, p) => s + getStat(p, theme.stat), 0)
      : currentP === 1
        ? p1Picks.reduce((s, p) => s + getStat(p, theme.stat), 0)
        : p2Picks.reduce((s, p) => s + getStat(p, theme.stat), 0)

    return (
      <div className="flex flex-col h-[100dvh]">
        {/* Header */}
        <div className="border-b border-[#222] px-4 py-3 flex-shrink-0">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <button onClick={reset} className="text-[#555] text-xs font-mono hover:text-white transition-colors">← back</button>
            <div className="text-center">
              <div className="text-[10px] text-[#666] font-mono uppercase tracking-widest">{theme.label}</div>
              <div className="text-2xl font-bold tabular-nums">{target}</div>
            </div>
            {!isSolo && (
              <div className={`text-xs font-bold px-2 py-1 rounded ${currentP === 1 ? 'bg-blue-900 text-blue-300' : 'bg-rose-900 text-rose-300'}`}>
                P{currentP} picks
              </div>
            )}
            {isSolo && <div className="w-16" />}
          </div>
        </div>

        {/* Selected picks strip */}
        {(!isSolo || p1Picks.length > 0) && (
          <div className="border-b border-[#222] flex-shrink-0">
            <div className="max-w-xl mx-auto px-4 py-2 space-y-1.5">
              {!isSolo && (
                <div className="grid grid-cols-2 gap-2">
                  {[{picks: p1Picks, label:'P1', color:'text-blue-400'}, {picks: p2Picks, label:'P2', color:'text-rose-400'}].map(({picks, label, color}) => (
                    <div key={label}>
                      <div className={`text-[10px] font-mono mb-1 ${color}`}>{label} — {picks.reduce((s,p)=>s+getStat(p,theme.stat),0)}</div>
                      {picks.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs text-[#aaa] bg-[#1a1a1a] rounded px-2 py-1 mb-1">
                          <span>{p.flag} {p.name}</span>
                          <button onClick={() => unpick(p.id, label==='P1')} className="text-[#555] hover:text-white ml-2">✕</button>
                        </div>
                      ))}
                      {Array.from({length: PICKS_PER_PLAYER - picks.length}).map((_,i) => (
                        <div key={i} className="text-xs text-[#333] bg-[#161616] rounded px-2 py-1 mb-1 font-mono">pick {picks.length + i + 1}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {isSolo && (
                <div className="flex items-center gap-2 flex-wrap">
                  {p1Picks.map(p => (
                    <div key={p.id} className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1 text-xs">
                      <span>{p.flag}</span>
                      <span className="text-white">{p.name}</span>
                      <button onClick={() => unpick(p.id, true)} className="text-[#555] hover:text-white ml-1">✕</button>
                    </div>
                  ))}
                  {Array.from({length: PICKS_PER_PLAYER - p1Picks.length}).map((_,i) => (
                    <div key={i} className="text-[#333] border border-[#222] rounded-lg px-2 py-1 text-xs font-mono">pick {p1Picks.length + i + 1}</div>
                  ))}
                  <div className="ml-auto text-xs font-mono text-[#888]">
                    running: <span className="text-white font-bold">{runningTotal}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div className="border-b border-[#222] flex-shrink-0 px-4 py-2">
          <div className="max-w-xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Search player, club, nation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] outline-none focus:border-[#555]"
            />
            <div className="flex gap-1">
              {['ALL','GK','DEF','MID','ATT'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setPosFilter(pos)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${posFilter === pos ? 'bg-white text-black' : 'text-[#555] hover:text-white'}`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player grid — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto px-4 py-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-4">
              {filteredPlayers.map(player => {
                const isMyPick = isSolo ? p1Picks.some(p=>p.id===player.id) : myPicks.some(p=>p.id===player.id)
                const full = isSolo ? p1Picks.length >= PICKS_PER_PLAYER : myPicks.length >= PICKS_PER_PLAYER
                return (
                  <button
                    key={player.id}
                    onClick={() => pick(player)}
                    disabled={full}
                    className={`text-left p-3 rounded-xl border transition-all ${isMyPick ? 'border-white bg-[#1e1e1e]' : full ? 'border-[#1e1e1e] opacity-40 cursor-not-allowed' : 'border-[#2a2a2a] bg-[#161616] hover:border-[#444] hover:bg-[#1c1c1c]'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${POS_COLOR[player.position]} text-white`}>{player.position}</span>
                      <span className="text-base leading-none">{player.flag}</span>
                    </div>
                    <div className="text-xs font-semibold text-white leading-tight">{player.name}</div>
                    <div className="text-[10px] text-[#666] mt-0.5 truncate">{player.currentClub}</div>
                  </button>
                )
              })}
              {filteredPlayers.length === 0 && (
                <div className="col-span-2 sm:col-span-3 text-center text-[#555] text-sm py-10">
                  No players match. Try a different search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reveal button */}
        {picksComplete && (
          <div className="border-t border-[#222] px-4 py-3 flex-shrink-0">
            <div className="max-w-xl mx-auto">
              <button
                onClick={reveal}
                className="w-full py-4 bg-[#6aaa64] text-white rounded-xl font-bold text-sm hover:bg-[#5a9a54] transition-colors"
              >
                Reveal →
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Render: Revealed ──
  const winner = !isSolo
    ? (p1Score > p2Score ? 'P1' : p2Score > p1Score ? 'P2' : 'DRAW')
    : null

  return (
    <div className="max-w-md mx-auto px-4 py-10 w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-1">THE NUMBER</h1>
        <div className="text-[#666] text-xs font-mono">{dateStr}</div>
      </div>

      {/* Puzzle recap */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 mb-6 text-center">
        <div className="text-[10px] text-[#666] font-mono uppercase tracking-widest mb-1">{theme.label}</div>
        <div className="text-4xl font-bold tabular-nums mb-1">{target}</div>
        <div className="text-xs text-[#666]">{theme.description}</div>
      </div>

      {/* P1 picks */}
      {isSolo && (
        <div className="mb-6">
          <PicksReveal picks={p1Picks} stat={theme.stat} unit={theme.unit} total={p1Total} target={target} score={p1Score} />
        </div>
      )}

      {/* 2P picks */}
      {!isSolo && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{picks: p1Picks, total: p1Total, score: p1Score, label:'Player 1', isWinner: winner==='P1'},
            {picks: p2Picks, total: p2Total, score: p2Score, label:'Player 2', isWinner: winner==='P2'}].map(({picks, total, score, label, isWinner}) => (
            <div key={label} className={`border rounded-xl p-3 ${isWinner ? 'border-[#6aaa64] bg-[#0d1f0d]' : 'border-[#2a2a2a] bg-[#1a1a1a]'}`}>
              <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${isWinner ? 'text-[#6aaa64]' : 'text-[#666]'}`}>
                {label} {isWinner && '🏆'}
              </div>
              {picks.map(p => (
                <div key={p.id} className="flex justify-between items-center mb-1.5">
                  <div className="text-xs text-[#bbb] truncate pr-2">{p.flag} {p.name}</div>
                  <div className="text-xs font-bold text-white tabular-nums flex-shrink-0">{getStat(p, theme.stat)}</div>
                </div>
              ))}
              <div className="border-t border-[#333] pt-2 mt-2 flex justify-between">
                <span className="text-[10px] text-[#666]">Total</span>
                <span className="text-sm font-bold tabular-nums">{total}</span>
              </div>
              <div className="text-[10px] text-[#666] text-right">{score >= 0 ? `${score}/1000` : ''}</div>
            </div>
          ))}
        </div>
      )}

      {/* Score / result */}
      {isSolo && (
        <div className="text-center mb-6">
          <div className="text-4xl font-bold mb-1">{p1Score}<span className="text-xl text-[#666] font-normal">/1000</span></div>
          <div className="text-[#aaa] text-lg font-semibold">{scoreLabel(p1Score)}</div>
          {storage.streak > 1 && <div className="text-[#666] text-xs mt-1 font-mono">🔥 {storage.streak} day streak</div>}
        </div>
      )}
      {!isSolo && winner === 'DRAW' && (
        <div className="text-center text-lg font-bold mb-6">🤝 Draw</div>
      )}

      {/* Time until next */}
      <div className="text-center text-[#555] text-xs font-mono mb-6">
        Next puzzle in {timeUntilMidnight()}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isSolo && (
          <button onClick={share} className="flex-1 py-3 border border-[#333] rounded-xl text-sm hover:border-[#555] transition-colors">
            {copied ? '✓ Copied' : '↗ Share'}
          </button>
        )}
        <button onClick={reset} className="flex-1 py-3 border border-[#333] rounded-xl text-sm hover:border-[#555] transition-colors">
          Play again
        </button>
        <Link href="/apps/football-games" className="flex-1 py-3 border border-[#333] rounded-xl text-sm hover:border-[#555] transition-colors text-center">
          All games
        </Link>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PicksReveal({
  picks, stat, unit, total, target, score,
}: {
  picks: Player[]; stat: StatKey; unit: string; total: number; target: number; score: number
}) {
  const diff = total - target
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      {picks.map((p, i) => {
        const val = getStat(p, stat)
        return (
          <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < picks.length - 1 ? 'border-b border-[#222]' : ''}`}>
            <div className={`w-7 h-7 rounded-lg ${POS_COLOR[p.position]} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
              {p.position}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{p.flag} {p.name}</div>
              <div className="text-[10px] text-[#666]">{p.currentClub}</div>
            </div>
            <div className="text-xl font-bold tabular-nums text-white">{val}</div>
            <div className="text-[10px] text-[#555] w-6">{unit}</div>
          </div>
        )
      })}
      <div className="border-t border-[#2a2a2a] px-4 py-3 flex items-center justify-between bg-[#141414]">
        <div>
          <div className="text-xs text-[#666]">Your total</div>
          <div className="text-2xl font-bold tabular-nums">{total}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#666]">vs target {target}</div>
          <div className={`text-sm font-bold tabular-nums ${diff === 0 ? 'text-[#6aaa64]' : diff > 0 ? 'text-rose-400' : 'text-blue-400'}`}>
            {diff === 0 ? '± 0' : diff > 0 ? `+${diff}` : diff}
          </div>
        </div>
      </div>
    </div>
  )
}
