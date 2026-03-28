'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { API_THEMES, type ApiPlayer, type ApiTheme } from '@/lib/football-api'
import { FALLBACK_PLAYERS } from '@/data/football-fallback'
import { nationalityFlag, POS_COLOR, scoreLabel } from '@/lib/football-utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const PICKS_PER_PLAYER = 3
const STORAGE_KEY = 'nf_the_number_v2'
const SEARCH_DEBOUNCE_MS = 400

type PosTab = 'popular' | 'GK' | 'DEF' | 'MID' | 'ATT'
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

// ─── Score helpers ────────────────────────────────────────────────────────────

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
  const [posTab, setPosTab] = useState<PosTab>('popular')
  const [storage, setStorage] = useState<GameStorage>({ streak: 0, lastDate: '', history: [] })
  const [copied, setCopied] = useState(false)
  const [apiResults, setApiResults] = useState<ApiPlayer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [apiError, setApiError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setStorage(getStorage()) }, [])

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setApiResults([]); setIsSearching(false); return }
    setIsSearching(true); setApiError(false)
    try {
      const res = await fetch(`/api/football/players?search=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('api error')
      const { players } = await res.json() as { players: ApiPlayer[] }
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
    const usingSearch = search.length >= 2
    let base: ApiPlayer[]
    if (posTab === 'popular') {
      base = usingSearch ? (apiError ? FALLBACK_PLAYERS : apiResults) : FALLBACK_PLAYERS
    } else {
      base = usingSearch ? (apiError ? FALLBACK_PLAYERS : apiResults) : FALLBACK_PLAYERS
      base = base.filter(p => p.position === posTab)
    }
    return base.filter(p => !allPickedIds.has(p.id))
  }, [search, posTab, apiResults, apiError, allPickedIds])

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
    setTurnIdx(0); setSearch(''); setPosTab('popular')
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
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link href="/apps/football-games" className="text-[#3a7a4a] text-xs font-mono hover:text-emerald-400 transition-colors mb-8 block tracking-wide">
            ← all games
          </Link>

          {/* Title block */}
          <div className="mb-8">
            <div className="text-[10px] font-mono text-[#3a5a46] uppercase tracking-[0.2em] mb-2">Game 01</div>
            <h1 className="text-5xl font-black uppercase tracking-tight leading-none mb-3">The<br />Number</h1>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#1e1e1e]" />
              <div className="text-[#444] text-xs font-mono">{dateStr}</div>
              {storage.streak > 1 && <div className="text-xs font-mono text-emerald-600">🔥 {storage.streak}</div>}
            </div>
          </div>

          {/* Today's puzzle */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 mb-6">
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest mb-3">Today&apos;s puzzle</div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-xs text-[#666] mb-1">{theme.label}</div>
                <div className="text-5xl font-black tabular-nums text-white leading-none">{target}</div>
                <div className="text-xs text-[#444] mt-1">{theme.unit}</div>
              </div>
              <div className="text-right text-[#2a2a2a]">
                <div className="text-6xl font-black">+</div>
              </div>
            </div>
            <p className="text-[#666] text-xs leading-relaxed border-t border-[#1a1a1a] pt-3">
              Pick <strong className="text-[#aaa]">3 footballers</strong>. Their combined{' '}
              <strong className="text-[#aaa]">{theme.label.toLowerCase()}</strong> should hit{' '}
              <strong className="text-[#aaa]">{target}</strong> as closely as possible.
              No hints. No clues. Just football knowledge and educated guesswork.
            </p>
          </div>

          {/* Mode selector */}
          <div className="mb-6">
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest mb-2">Mode</div>
            <div className="grid grid-cols-2 gap-2">
              {(['solo', 'two_player'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-3 rounded-lg border text-sm font-bold transition-all tracking-wide ${mode === m ? 'border-emerald-600 bg-emerald-600/10 text-emerald-400' : 'border-[#222] text-[#555] hover:border-[#333]'}`}
                >
                  {m === 'solo' ? 'Solo' : '2 Player'}
                </button>
              ))}
            </div>
            {mode === 'two_player' && (
              <p className="text-[#444] text-[11px] mt-2 text-center font-mono">Alternate picks · 3 each · closest total wins</p>
            )}
          </div>

          <button
            onClick={() => setPhase('picking')}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-sm uppercase tracking-widest transition-colors"
          >
            Let&apos;s go
          </button>
        </div>
      </div>
    )
  }

  // ── PICKING ──────────────────────────────────────────────────────────────────
  if (phase === 'picking') {
    const posTabs: PosTab[] = ['popular', 'GK', 'DEF', 'MID', 'ATT']
    const showSearchHint = search.length >= 1 && search.length < 2
    const showEmpty = search.length >= 2 && !isSearching && displayPlayers.length === 0

    return (
      <div className="flex flex-col h-[100dvh] bg-[#0d0d0d]">

        {/* ── Top bar ── */}
        <div className="flex-shrink-0 bg-[#0d0d0d] border-b border-[#1a1a1a] px-4 py-3">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <button onClick={reset} className="text-[#444] text-xs font-mono hover:text-white transition-colors">← back</button>
            <div className="text-center">
              <div className="text-[9px] text-[#444] font-mono uppercase tracking-[0.15em]">{theme.label}</div>
              <div className="text-3xl font-black tabular-nums leading-tight">{target}</div>
            </div>
            {!isSolo ? (
              <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${currentP === 1 ? 'bg-blue-900/60 text-blue-300' : 'bg-rose-900/60 text-rose-300'}`}>
                P{currentP}
              </div>
            ) : <div className="w-12" />}
          </div>
        </div>

        {/* ── Fixed pick slots ── */}
        <div className="flex-shrink-0 bg-[#0d0d0d] border-b border-[#1a1a1a] px-4 py-3">
          <div className="max-w-xl mx-auto">
            {isSolo ? (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(i => {
                  const player = p1Picks[i]
                  return (
                    <PickSlot key={i} index={i} player={player} theme={theme} onRemove={player ? () => unpick(player.id, true) : undefined} />
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {([
                  { picks: p1Picks, label: 'P1', isP1: true, color: 'text-blue-400 border-blue-900/40' },
                  { picks: p2Picks, label: 'P2', isP1: false, color: 'text-rose-400 border-rose-900/40' },
                ] as const).map(({ picks, label, isP1, color }) => (
                  <div key={label}>
                    <div className={`text-[10px] font-mono mb-1.5 ${color.split(' ')[0]}`}>{label}</div>
                    <div className="space-y-1.5">
                      {[0, 1, 2].map(i => {
                        const player = picks[i]
                        return (
                          <MiniPickSlot key={i} index={i} player={player} theme={theme} onRemove={player ? () => unpick(player.id, isP1) : undefined} />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Search + position tabs ── */}
        <div className="flex-shrink-0 bg-[#0d0d0d] border-b border-[#1a1a1a] px-4 pt-3 pb-0">
          <div className="max-w-xl mx-auto">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search 50,000 players..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#141414] border border-[#222] rounded-lg pl-4 pr-10 py-2.5 text-sm text-white placeholder-[#3a3a3a] outline-none focus:border-[#333] transition-colors"
              />
              {isSearching ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] text-xs font-mono">…</div>
              ) : search.length > 0 ? (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-white transition-colors text-xs">✕</button>
              ) : null}
            </div>
            {/* Position tabs */}
            <div className="flex gap-1 -mb-px">
              {(['popular', 'GK', 'DEF', 'MID', 'ATT'] as PosTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setPosTab(tab)}
                  className={`px-3 py-2 text-[11px] font-bold rounded-t transition-colors capitalize border-b-2 ${posTab === tab ? 'text-white border-emerald-500 bg-[#111]' : 'text-[#444] border-transparent hover:text-[#777]'}`}
                >
                  {tab === 'popular' ? '⭐ Popular' : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Player grid ── */}
        <div className="flex-1 overflow-y-auto bg-[#111]">
          <div className="max-w-xl mx-auto px-4 pt-3 pb-6">
            {posTab === 'popular' && search.length < 2 && (
              <div className="mb-3">
                <div className="text-xs font-bold text-[#555] uppercase tracking-widest">Popular Players</div>
                <div className="text-[10px] text-[#3a3a3a] mt-0.5">The obvious ones. We know. You know. Here they are.</div>
              </div>
            )}
            {apiError && search.length >= 2 && (
              <div className="text-[11px] text-amber-600/70 font-mono mb-3">Search temporarily unavailable · showing popular players</div>
            )}
            {showSearchHint && (
              <div className="text-[11px] text-[#444] font-mono mb-3">Keep typing to search…</div>
            )}

            {showEmpty ? (
              <div className="text-center py-16">
                <div className="text-[#333] text-2xl mb-2">⚽</div>
                <div className="text-[#444] text-sm">No players found for &quot;{search}&quot;</div>
                <div className="text-[#333] text-xs mt-1 font-mono">Try a surname, or check the spelling</div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {displayPlayers.map(player => {
                  const full = myPicks.length >= PICKS_PER_PLAYER
                  return (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      theme={theme}
                      disabled={full}
                      onClick={() => pick(player)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Reveal button ── */}
        {picksComplete && (
          <div className="flex-shrink-0 bg-[#0d0d0d] border-t border-[#1a1a1a] px-4 py-3">
            <div className="max-w-xl mx-auto">
              <button
                onClick={reveal}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-sm uppercase tracking-widest transition-colors"
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
    <div className="min-h-screen bg-[#0d0d0d] px-5 py-10">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest mb-1">Game 01 · The Number</div>
          <div className="text-[#555] text-xs font-mono">{dateStr}</div>
        </div>

        {/* Target card */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 mb-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest mb-1">{theme.label}</div>
            <div className="text-4xl font-black tabular-nums">{target}</div>
          </div>
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest">{theme.unit}</div>
        </div>

        {/* Solo result */}
        {isSolo && (
          <>
            <PicksReveal picks={p1Picks} theme={theme} total={p1Total} target={target} />
            <div className="mt-5 text-center">
              <div className="text-6xl font-black tabular-nums mb-1">
                {p1Score}
                <span className="text-2xl text-[#444] font-normal">/1000</span>
              </div>
              <div className="text-lg font-bold text-[#ccc] mb-1">{label}</div>
              {storage.streak > 1 && (
                <div className="text-emerald-600 text-xs font-mono">🔥 {storage.streak} day streak</div>
              )}
            </div>
          </>
        )}

        {/* 2P result */}
        {!isSolo && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {([
                { picks: p1Picks, total: p1Total, score: p1Score, label: 'P1', isWinner: winner === 'P1' },
                { picks: p2Picks, total: p2Total, score: p2Score, label: 'P2', isWinner: winner === 'P2' },
              ] as const).map(({ picks, total, score, label: pLabel, isWinner }) => (
                <div key={pLabel} className={`border rounded-xl p-3 ${isWinner ? 'border-emerald-700 bg-emerald-950/30' : 'border-[#1e1e1e] bg-[#111]'}`}>
                  <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${isWinner ? 'text-emerald-500' : 'text-[#555]'}`}>
                    {pLabel} {isWinner && '🏆'}
                  </div>
                  {picks.map(p => (
                    <div key={p.id} className="flex justify-between items-center mb-1">
                      <div className="text-xs text-[#888] truncate pr-2">{p.name}</div>
                      <div className="text-xs font-bold tabular-nums">{theme.getStat(p)}</div>
                    </div>
                  ))}
                  <div className="border-t border-[#1e1e1e] pt-2 mt-2 flex justify-between">
                    <span className="text-[10px] text-[#555]">Total</span>
                    <span className="font-bold tabular-nums text-sm">{total}</span>
                  </div>
                  <div className="text-right text-xs font-bold text-[#666] mt-1">{score}/1000</div>
                </div>
              ))}
            </div>
            {winner === 'DRAW' && <div className="text-center font-bold mb-5">🤝 Draw</div>}
          </>
        )}

        <div className="text-center text-[#333] text-xs font-mono my-5">
          Next puzzle in {timeUntilMidnight()}
        </div>

        <div className="flex gap-2">
          {isSolo && (
            <button onClick={share} className="flex-1 py-3 border border-[#222] rounded-lg text-sm font-bold hover:border-[#333] transition-colors">
              {copied ? '✓ Copied' : '↗ Share'}
            </button>
          )}
          <button onClick={reset} className="flex-1 py-3 border border-[#222] rounded-lg text-sm font-bold hover:border-[#333] transition-colors">
            Play again
          </button>
          <Link href="/apps/football-games" className="flex-1 py-3 border border-[#222] rounded-lg text-sm font-bold hover:border-[#333] transition-colors text-center">
            All games
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Pick slot (solo — large 3-column) ───────────────────────────────────────

function PickSlot({ index, player, theme, onRemove }: {
  index: number
  player: ApiPlayer | undefined
  theme: ApiTheme
  onRemove?: () => void
}) {
  return (
    <div className="h-[88px] rounded-xl border border-dashed border-[#1e1e1e] relative overflow-hidden bg-[#0a0a0a]">
      {player ? (
        <button
          onClick={onRemove}
          className="w-full h-full p-2.5 text-left flex flex-col justify-between group"
        >
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${POS_COLOR[player.position] ?? 'bg-zinc-700 text-white'}`}>
              {player.position}
            </span>
            <span className="text-sm leading-none">{nationalityFlag(player.nationality)}</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-white leading-tight truncate">{player.name}</div>
            <div className="text-[10px] text-[#444] truncate">{player.currentTeam}</div>
          </div>
          <div className="absolute top-1.5 right-1.5 text-[#333] group-hover:text-[#666] text-[10px] transition-colors">✕</div>
        </button>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="text-2xl font-black text-[#1e1e1e] tabular-nums">{index + 1}</div>
          <div className="text-[9px] font-mono text-[#2a2a2a] uppercase tracking-widest mt-0.5">Pick</div>
        </div>
      )}
    </div>
  )
}

// ─── Mini pick slot (2-player mode) ──────────────────────────────────────────

function MiniPickSlot({ index, player, theme, onRemove }: {
  index: number
  player: ApiPlayer | undefined
  theme: ApiTheme
  onRemove?: () => void
}) {
  return (
    <div className="h-9 rounded-lg border border-dashed border-[#1a1a1a] flex items-center px-2.5 bg-[#0a0a0a] relative overflow-hidden">
      {player ? (
        <button onClick={onRemove} className="w-full flex items-center gap-2 group">
          <span className={`text-[8px] font-black px-1 py-0.5 rounded flex-shrink-0 ${POS_COLOR[player.position] ?? 'bg-zinc-700 text-white'}`}>
            {player.position}
          </span>
          <span className="text-xs text-[#bbb] truncate flex-1">{player.name}</span>
          <span className="text-[#333] group-hover:text-[#666] text-[10px] flex-shrink-0">✕</span>
        </button>
      ) : (
        <span className="text-[10px] text-[#252525] font-mono">Slot {index + 1}</span>
      )}
    </div>
  )
}

// ─── Player row (squad list style) ───────────────────────────────────────────

function PlayerRow({ player, theme, disabled, onClick }: {
  player: ApiPlayer
  theme: ApiTheme
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${disabled ? 'border-[#141414] bg-[#0d0d0d] opacity-30 cursor-not-allowed' : 'border-[#1a1a1a] bg-[#0d0d0d] hover:border-[#2a2a2a] hover:bg-[#131313] active:bg-[#1a1a1a]'}`}
    >
      {/* Position badge */}
      <div className={`flex-shrink-0 text-[9px] font-black px-1.5 py-1 rounded w-8 text-center ${POS_COLOR[player.position] ?? 'bg-zinc-700 text-white'}`}>
        {player.position}
      </div>
      {/* Flag */}
      <span className="text-base leading-none flex-shrink-0">{nationalityFlag(player.nationality)}</span>
      {/* Name + club */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white truncate leading-tight">{player.name}</div>
        <div className="text-[11px] text-[#444] truncate">{player.currentTeam}</div>
      </div>
      {/* Stat hint (age is always visible; others hidden to preserve challenge) */}
      {theme.id === 'appearances' || theme.id === 'minutes' ? null : null}
      <div className="flex-shrink-0 text-[#2a2a2a] text-xs">→</div>
    </button>
  )
}

// ─── Picks reveal (result screen) ────────────────────────────────────────────

function PicksReveal({ picks, theme, total, target }: {
  picks: ApiPlayer[]
  theme: ApiTheme
  total: number
  target: number
}) {
  const diff = total - target
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
      {picks.map((p, i) => (
        <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < picks.length - 1 ? 'border-b border-[#171717]' : ''}`}>
          <span className={`flex-shrink-0 text-[9px] font-black px-1.5 py-1 rounded w-8 text-center ${POS_COLOR[p.position] ?? 'bg-zinc-700 text-white'}`}>
            {p.position}
          </span>
          <span className="text-base leading-none flex-shrink-0">{nationalityFlag(p.nationality)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{p.name}</div>
            <div className="text-[11px] text-[#444]">{p.currentTeam}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-black tabular-nums">{theme.getStat(p)}</div>
            <div className="text-[10px] text-[#444]">{theme.unit}</div>
          </div>
        </div>
      ))}
      <div className="border-t border-[#1e1e1e] bg-[#0d0d0d] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-[#444] font-mono mb-0.5">Your total</div>
          <div className="text-3xl font-black tabular-nums">{total}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#444] font-mono mb-0.5">vs {target}</div>
          <div className={`text-xl font-black tabular-nums ${diff === 0 ? 'text-emerald-400' : diff > 0 ? 'text-rose-400' : 'text-blue-400'}`}>
            {diff === 0 ? '±0' : diff > 0 ? `+${diff}` : diff}
          </div>
        </div>
      </div>
    </div>
  )
}
