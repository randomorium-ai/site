'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { API_THEMES, type ApiPlayer, type ApiTheme } from '@/lib/football-api'
import { nationalityFlag, POS_COLOR, scoreLabel } from '@/lib/football-utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const PICKS_PER_PLAYER = 3
const STORAGE_KEY = 'nf_the_number_v2'
const SEARCH_DEBOUNCE_MS = 400

type PosTab = 'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT'
type Mode = 'solo' | 'two_player'
type Phase = 'setup' | 'picking' | 'revealed'

interface StoredEntry { score: number; mode: Mode; dateStr: string }
interface GameStorage { streak: number; lastDate: string; history: StoredEntry[] }

// ─── Daily puzzle ─────────────────────────────────────────────────────────────

function getDailyPuzzle() {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  let s = parseInt(dateStr.replace(/-/g, ''), 10)
  s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0)
  s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0)
  const theme = API_THEMES[s % API_THEMES.length]
  s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0)
  const target = theme.targetMin + (s % (theme.targetMax - theme.targetMin))
  return { theme, target, dateStr }
}

function calcScore(total: number, target: number): number {
  return Math.max(0, Math.round(1000 * (1 - Math.abs(total - target) / target)))
}

function timeUntilMidnight(): string {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function getStorage(): GameStorage {
  if (typeof window === 'undefined') return { streak: 0, lastDate: '', history: [] }
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? { streak: 0, lastDate: '', history: [] } }
  catch { return { streak: 0, lastDate: '', history: [] } }
}

function updateStreak(dateStr: string, score: number, mode: Mode): GameStorage {
  const stored = getStorage()
  const diffDays = Math.round((new Date(dateStr).getTime() - new Date(stored.lastDate || '2000-01-01').getTime()) / 86400000)
  const streak = diffDays === 1 ? stored.streak + 1 : diffDays === 0 ? stored.streak : 1
  const entry: StoredEntry = { score, mode, dateStr }
  const history = [entry, ...stored.history.filter(e => e.dateStr !== dateStr)].slice(0, 30)
  const next = { streak, lastDate: dateStr, history }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

function buildShareText(dateStr: string, theme: ApiTheme, target: number, picks: ApiPlayer[], total: number, score: number): string {
  return [
    `⚽ THE NUMBER — ${dateStr}`,
    `${theme.label} · Target: ${target}`,
    '',
    ...picks.map(p => `  ${nationalityFlag(p.nationality)} ${p.name} (${p.currentTeam}): ${theme.getStat(p)} ${theme.unit}`),
    '',
    `Total: ${total} · Score: ${score}/1000 · ${scoreLabel(score, theme.id)}`,
    'randomorium.ai/apps/football-games/the-number',
  ].join('\n')
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TheNumberGame() {
  const puzzle = useMemo(() => getDailyPuzzle(), [])
  const { theme, target, dateStr } = puzzle

  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<Mode>('solo')
  const [p1Picks, setP1Picks] = useState<ApiPlayer[]>([])
  const [p2Picks, setP2Picks] = useState<ApiPlayer[]>([])
  const [turnIdx, setTurnIdx] = useState(0)
  const [search, setSearch] = useState('')
  const [posTab, setPosTab] = useState<PosTab>('ALL')
  const [storage, setStorage] = useState<GameStorage>({ streak: 0, lastDate: '', history: [] })
  const [copied, setCopied] = useState(false)
  const [apiResults, setApiResults] = useState<ApiPlayer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [apiError, setApiError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const searchCache = useRef(new Map<string, ApiPlayer[]>())

  useEffect(() => { setStorage(getStorage()) }, [])

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setApiResults([]); setIsSearching(false); return }
    const cacheKey = q.toLowerCase().trim()
    const cached = searchCache.current.get(cacheKey)
    if (cached) { setApiResults(cached); setIsSearching(false); return }
    setIsSearching(true); setApiError(false)
    try {
      const res = await fetch(`/api/football/players?search=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('api error')
      const { players } = await res.json() as { players: ApiPlayer[] }
      searchCache.current.set(cacheKey, players)
      setApiResults(players)
    } catch { setApiError(true); setApiResults([]) }
    finally { setIsSearching(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search.length < 2) { setApiResults([]); setIsSearching(false); return }
    setIsSearching(true)
    debounceRef.current = setTimeout(() => runSearch(search), SEARCH_DEBOUNCE_MS)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, runSearch])

  const isSolo = mode === 'solo'
  const currentP = isSolo ? 1 : (turnIdx % 2 === 0 ? 1 : 2)
  const myPicks = isSolo ? p1Picks : currentP === 1 ? p1Picks : p2Picks
  const picksComplete = isSolo ? p1Picks.length === PICKS_PER_PLAYER : (p1Picks.length === PICKS_PER_PLAYER && p2Picks.length === PICKS_PER_PLAYER)
  const allPickedIds = useMemo(() => new Set([...p1Picks.map(p => p.id), ...p2Picks.map(p => p.id)]), [p1Picks, p2Picks])

  const p1Total = p1Picks.reduce((s, p) => s + theme.getStat(p), 0)
  const p2Total = p2Picks.reduce((s, p) => s + theme.getStat(p), 0)
  const p1Score = calcScore(p1Total, target)
  const p2Score = calcScore(p2Total, target)

  const displayPlayers = useMemo((): ApiPlayer[] => {
    if (search.length < 2 || apiError) return []
    return apiResults
      .filter(p => posTab === 'ALL' || p.position === posTab)
      .filter(p => !allPickedIds.has(p.id))
  }, [search, apiResults, apiError, posTab, allPickedIds])

  function pick(player: ApiPlayer) {
    if (phase !== 'picking' || allPickedIds.has(player.id)) return
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

  function unpick(playerId: number, fromP1: boolean) {
    if (phase !== 'picking') return
    if (fromP1) setP1Picks(prev => prev.filter(p => p.id !== playerId))
    else setP2Picks(prev => prev.filter(p => p.id !== playerId))
  }

  function reveal() {
    if (!picksComplete) return
    setPhase('revealed')
    if (isSolo) { const next = updateStreak(dateStr, p1Score, 'solo'); setStorage(next) }
  }

  function reset() {
    setPhase('setup')
    setP1Picks([]); setP2Picks([])
    setTurnIdx(0); setSearch(''); setPosTab('ALL')
    setApiResults([])
  }

  async function share() {
    const text = buildShareText(dateStr, theme, target, p1Picks, p1Total, p1Score)
    try {
      if (navigator.share) await navigator.share({ text })
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    } catch { /* ignore */ }
  }

  // ── SETUP ────────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link href="/apps/football-games" className="text-[#1a7a3e] text-sm font-medium hover:underline mb-8 block">
            ← All games
          </Link>

          <div className="mb-6">
            <div className="text-xs font-mono text-[#999] uppercase tracking-widest mb-2">Game 01</div>
            <h1 className="text-5xl font-black uppercase tracking-tight leading-none text-[#1a1a1a] mb-3">The<br />Number</h1>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#e5e5e5]" />
              <div className="text-[#999] text-xs font-mono">{dateStr}</div>
              {storage.streak > 1 && <div className="text-xs font-bold text-[#1a7a3e]">🔥 {storage.streak} day streak</div>}
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 mb-5">
            <div className="text-xs text-[#999] uppercase tracking-widest font-mono mb-3">Today</div>
            <div className="text-sm font-medium text-[#666] mb-1">{theme.label}</div>
            <div className="text-5xl font-black tabular-nums text-[#1a1a1a] leading-none mb-1">{target}</div>
            <div className="text-xs text-[#aaa] font-mono">{theme.unit}</div>
          </div>

          <div className="mb-5">
            <div className="grid grid-cols-2 gap-2">
              {(['solo', 'two_player'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-3 rounded-lg border text-sm font-bold transition-all ${mode === m ? 'bg-[#1a7a3e] border-[#1a7a3e] text-white' : 'bg-white border-[#e5e5e5] text-[#666] hover:border-[#ccc]'}`}
                >
                  {m === 'solo' ? 'Solo' : '2 Player'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase('picking')}
            className="w-full py-4 bg-[#1a7a3e] hover:bg-[#155f30] text-white rounded-lg font-black text-sm uppercase tracking-widest transition-colors"
          >
            Start
          </button>
        </div>
      </div>
    )
  }

  // ── PICKING ──────────────────────────────────────────────────────────────────
  if (phase === 'picking') {
    const hasSearch = search.length >= 2
    const showEmpty = hasSearch && !isSearching && displayPlayers.length === 0 && !apiError

    return (
      <div className="flex flex-col h-[100dvh] bg-[#fafafa]">

        {/* Top bar */}
        <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <button onClick={reset} className="text-[#1a7a3e] text-sm font-medium hover:underline">← Back</button>
            <div className="text-center">
              <div className="text-[10px] text-[#999] font-mono uppercase tracking-widest">{theme.label}</div>
              <div className="text-3xl font-black tabular-nums text-[#1a1a1a] leading-tight">{target}</div>
            </div>
            {!isSolo ? (
              <div className={`text-xs font-bold px-3 py-1 rounded-full ${currentP === 1 ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                P{currentP}
              </div>
            ) : <div className="w-12" />}
          </div>
        </div>

        {/* Fixed pick slots */}
        <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
          <div className="max-w-xl mx-auto">
            {isSolo ? (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(i => (
                  <PickSlot
                    key={i}
                    index={i}
                    player={p1Picks[i]}
                    onRemove={p1Picks[i] ? () => unpick(p1Picks[i].id, true) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {([
                  { picks: p1Picks, label: 'P1', isP1: true, color: 'text-blue-600' },
                  { picks: p2Picks, label: 'P2', isP1: false, color: 'text-rose-600' },
                ] as const).map(({ picks, label, isP1, color }) => (
                  <div key={label}>
                    <div className={`text-xs font-bold mb-1.5 ${color}`}>{label}</div>
                    <div className="space-y-1.5">
                      {[0, 1, 2].map(i => (
                        <MiniPickSlot
                          key={i}
                          index={i}
                          player={picks[i]}
                          onRemove={picks[i] ? () => unpick(picks[i].id, isP1) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search + tabs */}
        <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 pt-3 pb-0">
          <div className="max-w-xl mx-auto">
            <div className="relative mb-3">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search 50,000 players..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-lg pl-4 pr-10 py-2.5 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-[#1a7a3e] focus:ring-1 focus:ring-[#1a7a3e]/20 transition-colors"
              />
              {isSearching ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] text-xs font-mono">…</div>
              ) : search.length > 0 ? (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] transition-colors text-sm">✕</button>
              ) : null}
            </div>
            <div className="flex gap-0 -mb-px">
              {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as PosTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setPosTab(tab)}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${posTab === tab ? 'text-[#1a7a3e] border-[#1a7a3e]' : 'text-[#aaa] border-transparent hover:text-[#666]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto bg-[#fafafa]">
          <div className="max-w-xl mx-auto px-4 py-3 pb-6">
            {/* Empty / idle states */}
            {!hasSearch && !apiError && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-3xl mb-3">🔍</div>
                <div className="text-[#1a1a1a] font-bold mb-1">Search for a player to get started</div>
                <div className="text-[#999] text-sm">Any player from the top European leagues</div>
              </div>
            )}
            {apiError && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-3xl mb-3">⚠️</div>
                <div className="text-[#1a1a1a] font-bold mb-1">Search unavailable</div>
                <div className="text-[#999] text-sm">Check your connection and try again</div>
              </div>
            )}
            {showEmpty && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-3xl mb-3">⚽</div>
                <div className="text-[#1a1a1a] font-bold mb-1">No results for &quot;{search}&quot;</div>
                <div className="text-[#999] text-sm">No results — try a different spelling</div>
              </div>
            )}
            {/* Results */}
            {hasSearch && !apiError && displayPlayers.length > 0 && (
              <div className="space-y-1.5">
                {displayPlayers.map(player => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    disabled={myPicks.length >= PICKS_PER_PLAYER}
                    onClick={() => pick(player)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reveal button */}
        {picksComplete && (
          <div className="flex-shrink-0 bg-white border-t border-[#e5e5e5] px-4 py-3">
            <div className="max-w-xl mx-auto">
              <button
                onClick={reveal}
                className="w-full py-4 bg-[#1a7a3e] hover:bg-[#155f30] text-white rounded-lg font-black text-sm uppercase tracking-widest transition-colors"
              >
                Reveal →
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── REVEALED ─────────────────────────────────────────────────────────────────
  const winner = !isSolo ? (p1Score > p2Score ? 'P1' : p2Score > p1Score ? 'P2' : 'DRAW') : null
  const label = scoreLabel(p1Score, theme.id)

  return (
    <div className="min-h-screen bg-[#fafafa] px-5 py-10">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">The Number</h1>
          <div className="text-[#999] text-xs font-mono mt-1">{dateStr}</div>
        </div>

        {/* Target */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#999] font-mono uppercase tracking-widest mb-1">{theme.label}</div>
            <div className="text-4xl font-black tabular-nums text-[#1a1a1a]">{target}</div>
          </div>
          <div className="text-xs font-mono text-[#ccc] uppercase">{theme.unit}</div>
        </div>

        {/* Solo picks */}
        {isSolo && (
          <>
            <PicksReveal picks={p1Picks} theme={theme} total={p1Total} target={target} />
            <div className="mt-5 text-center">
              <div className="text-6xl font-black tabular-nums text-[#1a1a1a] mb-1">
                {p1Score}<span className="text-2xl text-[#ccc] font-normal">/1000</span>
              </div>
              <div className="text-lg font-bold text-[#1a7a3e]">{label}</div>
              {storage.streak > 1 && (
                <div className="text-[#1a7a3e] text-sm font-bold mt-1">🔥 {storage.streak} day streak</div>
              )}
            </div>
          </>
        )}

        {/* 2P picks */}
        {!isSolo && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {([
                { picks: p1Picks, total: p1Total, score: p1Score, label: 'P1', isWinner: winner === 'P1' },
                { picks: p2Picks, total: p2Total, score: p2Score, label: 'P2', isWinner: winner === 'P2' },
              ] as const).map(({ picks, total, score, label: pLabel, isWinner }) => (
                <div key={pLabel} className={`border rounded-xl p-3 bg-white ${isWinner ? 'border-[#1a7a3e]' : 'border-[#e5e5e5]'}`}>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${isWinner ? 'text-[#1a7a3e]' : 'text-[#aaa]'}`}>
                    {pLabel} {isWinner && '🏆'}
                  </div>
                  {picks.map(p => (
                    <div key={p.id} className="flex justify-between items-center mb-1">
                      <div className="text-xs text-[#666] truncate pr-2">{p.name}</div>
                      <div className="text-xs font-bold tabular-nums text-[#1a1a1a]">{theme.getStat(p)}</div>
                    </div>
                  ))}
                  <div className="border-t border-[#f0f0f0] pt-2 mt-2 flex justify-between">
                    <span className="text-xs text-[#aaa]">Total</span>
                    <span className="font-bold tabular-nums text-[#1a1a1a]">{total}</span>
                  </div>
                  <div className="text-right text-xs font-bold text-[#666] mt-1">{score}/1000</div>
                </div>
              ))}
            </div>
            {winner === 'DRAW' && <div className="text-center font-bold mb-5">🤝 Draw</div>}
          </>
        )}

        <div className="text-center text-[#bbb] text-xs font-mono my-5">
          Next puzzle in {timeUntilMidnight()}
        </div>

        <div className="flex gap-2">
          {isSolo && (
            <button onClick={share} className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-[#1a1a1a] hover:border-[#ccc] transition-colors">
              {copied ? '✓ Copied' : '↗ Share'}
            </button>
          )}
          <button onClick={reset} className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-[#1a1a1a] hover:border-[#ccc] transition-colors">
            Play again
          </button>
          <Link href="/apps/football-games" className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-[#1a1a1a] hover:border-[#ccc] transition-colors text-center">
            All games
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Pick slot (solo) ─────────────────────────────────────────────────────────

function PickSlot({ index, player, onRemove }: {
  index: number
  player: ApiPlayer | undefined
  onRemove?: () => void
}) {
  return (
    <div className={`h-[88px] rounded-xl border-2 relative overflow-hidden bg-white transition-colors ${player ? 'border-[#1a7a3e]' : 'border-dashed border-[#e0e0e0]'}`}>
      {player ? (
        <button onClick={onRemove} className="w-full h-full p-2.5 text-left flex flex-col justify-between group">
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${POS_COLOR[player.position] ?? 'bg-zinc-400 text-white'}`}>
              {player.position}
            </span>
            <span className="text-sm leading-none">{nationalityFlag(player.nationality)}</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#1a1a1a] leading-tight line-clamp-2">{player.name}</div>
            <div className="text-[10px] text-[#999] truncate">{player.currentTeam}</div>
          </div>
          <div className="absolute top-1.5 right-1.5 text-[#ccc] group-hover:text-[#999] text-[10px] transition-colors">✕</div>
        </button>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="text-2xl font-black text-[#e0e0e0] tabular-nums">{index + 1}</div>
        </div>
      )}
    </div>
  )
}

// ─── Mini pick slot (2-player) ────────────────────────────────────────────────

function MiniPickSlot({ index, player, onRemove }: {
  index: number
  player: ApiPlayer | undefined
  onRemove?: () => void
}) {
  return (
    <div className={`h-9 rounded-lg border flex items-center px-2.5 bg-white relative overflow-hidden transition-colors ${player ? 'border-[#1a7a3e]' : 'border-dashed border-[#e0e0e0]'}`}>
      {player ? (
        <button onClick={onRemove} className="w-full flex items-center gap-2 group">
          <span className={`text-[8px] font-black px-1 py-0.5 rounded flex-shrink-0 ${POS_COLOR[player.position] ?? 'bg-zinc-400 text-white'}`}>
            {player.position}
          </span>
          <span className="text-xs text-[#1a1a1a] font-medium truncate flex-1">{player.name}</span>
          <span className="text-[#ccc] group-hover:text-[#999] text-[10px] flex-shrink-0">✕</span>
        </button>
      ) : (
        <span className="text-xs text-[#ddd]">Slot {index + 1}</span>
      )}
    </div>
  )
}

// ─── Player row ───────────────────────────────────────────────────────────────

function PlayerRow({ player, disabled, onClick }: {
  player: ApiPlayer
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
        disabled
          ? 'border-[#f0f0f0] bg-white opacity-40 cursor-not-allowed'
          : 'border-[#e5e5e5] bg-white hover:border-[#1a7a3e] hover:bg-[#f0f7f3] active:bg-[#e8f5ee]'
      }`}
    >
      <div className={`flex-shrink-0 text-[9px] font-black px-1.5 py-1 rounded w-8 text-center ${POS_COLOR[player.position] ?? 'bg-zinc-400 text-white'}`}>
        {player.position}
      </div>
      <span className="text-base leading-none flex-shrink-0">{nationalityFlag(player.nationality)}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-[#1a1a1a] truncate">{player.name}</div>
        <div className="text-xs text-[#999] truncate">{player.currentTeam}</div>
      </div>
      <div className="flex-shrink-0 text-[#ccc] text-sm">→</div>
    </button>
  )
}

// ─── Picks reveal ─────────────────────────────────────────────────────────────

function PicksReveal({ picks, theme, total, target }: {
  picks: ApiPlayer[]
  theme: ApiTheme
  total: number
  target: number
}) {
  const diff = total - target
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
      {picks.map((p, i) => (
        <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < picks.length - 1 ? 'border-b border-[#f0f0f0]' : ''}`}>
          <span className={`flex-shrink-0 text-[9px] font-black px-1.5 py-1 rounded w-8 text-center ${POS_COLOR[p.position] ?? 'bg-zinc-400 text-white'}`}>
            {p.position}
          </span>
          <span className="text-base leading-none flex-shrink-0">{nationalityFlag(p.nationality)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[#1a1a1a] truncate">{p.name}</div>
            <div className="text-xs text-[#999]">{p.currentTeam}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-black tabular-nums text-[#1a1a1a]">{theme.getStat(p)}</div>
            <div className="text-[10px] text-[#ccc]">{theme.unit}</div>
          </div>
        </div>
      ))}
      <div className="border-t border-[#f0f0f0] bg-[#fafafa] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-[#999] mb-0.5">Total</div>
          <div className="text-3xl font-black tabular-nums text-[#1a1a1a]">{total}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#999] mb-0.5">vs {target}</div>
          <div className={`text-xl font-black tabular-nums ${diff === 0 ? 'text-[#1a7a3e]' : diff > 0 ? 'text-rose-500' : 'text-blue-500'}`}>
            {diff === 0 ? '±0' : diff > 0 ? `+${diff}` : diff}
          </div>
        </div>
      </div>
    </div>
  )
}
