'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { type ApiPlayer } from '@/lib/football-api'
import { nationalityFlag, POS_COLOR, sixDegreesLabel } from '@/lib/football-utils'
import { getDailySixDegreesPuzzle, type SixDegreesPuzzle } from '@/data/six-degrees-puzzles'

// ─── Types ────────────────────────────────────────────────────────────────────

type LinkType = 'club' | 'international' | 'manager'
type Phase = 'loading' | 'playing' | 'won' | 'failed' | 'error'
type VerificationStatus = 'verified' | 'unverified'

interface ChainStep {
  player: ApiPlayer
  linkType: LinkType
  status: VerificationStatus
  note: string
}

interface GameStorage {
  streak: number
  lastDate: string
  history: { steps: number; dateStr: string }[]
}

const STORAGE_KEY = 'nf_six_degrees_v1'
const MAX_STEPS = 6
const SEARCH_DEBOUNCE_MS = 400

// ─── Storage ──────────────────────────────────────────────────────────────────

function getStorage(): GameStorage {
  if (typeof window === 'undefined') return { streak: 0, lastDate: '', history: [] }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? { streak: 0, lastDate: '', history: [] }
  } catch {
    return { streak: 0, lastDate: '', history: [] }
  }
}

function saveStorage(dateStr: string, steps: number): GameStorage {
  const stored = getStorage()
  const diffDays = Math.round(
    (new Date(dateStr).getTime() - new Date(stored.lastDate || '2000-01-01').getTime()) / 86400000
  )
  const streak = diffDays === 1 ? stored.streak + 1 : diffDays === 0 ? stored.streak : 1
  const history = [{ steps, dateStr }, ...stored.history.filter(e => e.dateStr !== dateStr)].slice(0, 30)
  const next = { streak, lastDate: dateStr, history }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

// ─── Link type labels ─────────────────────────────────────────────────────────

const LINK_LABELS: Record<LinkType, string> = {
  club: 'Club teammates',
  international: 'International teammates',
  manager: 'Same manager',
}

const LINK_ICONS: Record<LinkType, string> = {
  club: '🏟️',
  international: '🌍',
  manager: '📋',
}

// ─── Build share text ─────────────────────────────────────────────────────────

function buildShareText(
  dateStr: string,
  puzzle: SixDegreesPuzzle,
  chain: ChainStep[],
  won: boolean
): string {
  const steps = chain.length
  const label = won ? sixDegreesLabel(steps) : "Couldn't find the connection"
  const dots = won
    ? Array(steps).fill('🟢').join('') + Array(MAX_STEPS - steps).fill('⬜').join('')
    : Array(MAX_STEPS).fill('🔴').join('')

  return [
    `⚽ SIX DEGREES — ${dateStr}`,
    `${puzzle.a.name} → ${puzzle.b.name}`,
    '',
    dots,
    '',
    won ? `${steps} step${steps === 1 ? '' : 's'} · ${label}` : label,
    'randomorium.ai/apps/football-games/six-degrees',
  ].join('\n')
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SixDegreesGame() {
  const [puzzle, setPuzzle] = useState<SixDegreesPuzzle | null>(null)
  const [dateStr, setDateStr] = useState('')
  const [aPlayer, setAPlayer] = useState<ApiPlayer | null>(null)
  const [bPlayer, setBPlayer] = useState<ApiPlayer | null>(null)
  const [chain, setChain] = useState<ChainStep[]>([])
  const [pendingLinkType, setPendingLinkType] = useState<LinkType>('club')
  const [phase, setPhase] = useState<Phase>('loading')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<ApiPlayer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [storage, setStorage] = useState<GameStorage>({ streak: 0, lastDate: '', history: [] })
  const [copied, setCopied] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchCache = useRef(new Map<string, ApiPlayer[]>())

  // Load puzzle and seed players on mount
  useEffect(() => {
    setStorage(getStorage())
    const { puzzle: p, dateStr: d } = getDailySixDegreesPuzzle()
    setPuzzle(p)
    setDateStr(d)
    findPuzzlePlayers(p).then(([a, b]) => {
      if (!a || !b) { setPhase('error'); return }
      setAPlayer(a)
      setBPlayer(b)
      setPhase('playing')
    })
  }, [])

  // ── Find puzzle players from the API ────────────────────────────────────────
  async function findPuzzlePlayers(p: SixDegreesPuzzle): Promise<[ApiPlayer | null, ApiPlayer | null]> {
    function lastName(name: string): string {
      const parts = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().split(' ')
      return parts[parts.length - 1]
    }

    async function findOne(name: string, team: string): Promise<ApiPlayer | null> {
      const last = lastName(name)
      const res = await fetch(`/api/football/players?search=${encodeURIComponent(last)}`)
      if (!res.ok) return null
      const { players } = await res.json() as { players: ApiPlayer[] }
      const teamKeyword = team.split(' ')[0].toLowerCase()
      return players.find(pl =>
        pl.currentTeam.toLowerCase().includes(teamKeyword) ||
        pl.name.toLowerCase().includes(last.toLowerCase())
      ) ?? players[0] ?? null
    }

    return Promise.all([findOne(p.a.name, p.a.team), findOne(p.b.name, p.b.team)])
  }

  // ── Player search ────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); setIsSearching(false); return }
    const cacheKey = q.toLowerCase().trim()
    const cached = searchCache.current.get(cacheKey)
    if (cached) { setSearchResults(cached); setIsSearching(false); return }
    setIsSearching(true); setSearchError(false)
    try {
      const res = await fetch(`/api/football/players?search=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('api error')
      const { players } = await res.json() as { players: ApiPlayer[] }
      searchCache.current.set(cacheKey, players)
      setSearchResults(players)
    } catch { setSearchError(true); setSearchResults([]) }
    finally { setIsSearching(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search.length < 2) { setSearchResults([]); setIsSearching(false); return }
    setIsSearching(true)
    debounceRef.current = setTimeout(() => runSearch(search), SEARCH_DEBOUNCE_MS)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, runSearch])

  // ── Derived state ────────────────────────────────────────────────────────────
  const currentPlayer = chain.length === 0 ? aPlayer : chain[chain.length - 1].player
  const allUsedNames = useMemo(() => {
    const names = new Set<string>()
    if (aPlayer) names.add(aPlayer.name)
    chain.forEach(s => names.add(s.player.name))
    // bPlayer excluded so user can select it to win
    return names
  }, [aPlayer, chain])

  const filteredResults = useMemo(() =>
    searchResults.filter(p => !allUsedNames.has(p.name)),
    [searchResults, allUsedNames]
  )

  // ── Add a step ───────────────────────────────────────────────────────────────
  async function addStep(player: ApiPlayer) {
    if (phase !== 'playing' || !currentPlayer || !bPlayer || !puzzle) return
    setValidationError(null)

    // Check win by name (id may be 0 for local players)
    const normName = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    const willWin = normName(player.name) === normName(bPlayer.name)

    if (pendingLinkType === 'club' && currentPlayer.id !== 0 && player.id !== 0) {
      // Both players have API IDs — validate against career data
      setIsValidating(true)
      try {
        const res = await fetch('/api/football/validate-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerAId: currentPlayer.id,
            playerBId: player.id,
            linkType: 'club',
          }),
        })
        const data = await res.json() as { valid: boolean; evidence: string | null }
        if (!data.valid) {
          setValidationError(`No shared club found for ${currentPlayer.name} and ${player.name} (2020–2024)`)
          setIsValidating(false)
          return
        }
        const step: ChainStep = {
          player,
          linkType: 'club',
          status: 'verified',
          note: data.evidence ?? 'Club link verified',
        }
        commitStep(step, willWin)
      } catch {
        setValidationError('Validation failed — check your connection')
      } finally {
        setIsValidating(false)
      }
    } else {
      // Honor system
      const step: ChainStep = {
        player,
        linkType: pendingLinkType,
        status: 'unverified',
        note: `${LINK_LABELS[pendingLinkType]} — play fair ⚽`,
      }
      commitStep(step, willWin)
    }
  }

  function commitStep(step: ChainStep, willWin: boolean) {
    const newChain = [...chain, step]
    setChain(newChain)
    setSearch('')
    setSearchResults([])

    if (willWin) {
      const next = saveStorage(dateStr, newChain.length)
      setStorage(next)
      setPhase('won')
    } else if (newChain.length >= MAX_STEPS) {
      setPhase('failed')
    }
  }

  // ── Share ────────────────────────────────────────────────────────────────────
  async function share() {
    if (!puzzle) return
    const text = buildShareText(dateStr, puzzle, chain, phase === 'won')
    try {
      if (navigator.share) await navigator.share({ text })
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    } catch { /* ignore */ }
  }

  // ── Loading / error states ───────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-[#999] text-sm font-mono">Loading today&apos;s puzzle…</div>
      </div>
    )
  }

  if (phase === 'error' || !puzzle || !aPlayer || !bPlayer) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-5 gap-4">
        <div className="text-3xl">⚠️</div>
        <div className="text-[#1a1a1a] font-bold text-center">Couldn&apos;t load today&apos;s puzzle</div>
        <div className="text-[#999] text-sm text-center">Check your connection and try again</div>
        <Link href="/apps/football-games" className="text-blue-500 text-sm hover:underline">← All games</Link>
      </div>
    )
  }

  const stepsLeft = MAX_STEPS - chain.length

  // ── Won / Failed ─────────────────────────────────────────────────────────────
  if (phase === 'won' || phase === 'failed') {
    const won = phase === 'won'
    const label = won ? sixDegreesLabel(chain.length) : "Couldn't find the connection"

    return (
      <div className="min-h-screen bg-[#fafafa] px-5 py-10">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">Six Degrees</h1>
            <div className="text-[#999] text-xs font-mono mt-1">{dateStr}</div>
          </div>

          {/* Result banner */}
          <div className={`rounded-xl p-5 mb-5 text-center ${won ? 'bg-[#f0f7f3] border border-[#1a7a3e]' : 'bg-[#fff5f5] border border-rose-300'}`}>
            <div className="text-4xl mb-2">{won ? '🏆' : '❌'}</div>
            <div className={`font-black text-lg ${won ? 'text-[#1a7a3e]' : 'text-rose-600'}`}>
              {won ? `${chain.length} step${chain.length === 1 ? '' : 's'}` : 'Out of moves'}
            </div>
            <div className={`text-sm mt-1 ${won ? 'text-[#1a7a3e]' : 'text-rose-500'}`}>{label}</div>
            {storage.streak > 1 && won && (
              <div className="text-[#1a7a3e] text-sm font-bold mt-2">🔥 {storage.streak} day streak</div>
            )}
          </div>

          {/* The challenge */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-4">
            <div className="text-xs text-[#999] font-mono uppercase tracking-widest mb-3">Today&apos;s puzzle</div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#1a1a1a]">
              <PlayerChip player={aPlayer} />
              <span className="text-[#ccc] flex-shrink-0">→</span>
              <PlayerChip player={bPlayer} />
            </div>
          </div>

          {/* Chain */}
          {chain.length > 0 && (
            <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden mb-5">
              <div className="px-4 pt-3 pb-1">
                <div className="text-xs text-[#999] font-mono uppercase tracking-widest">Your chain</div>
              </div>
              <ChainTimeline aPlayer={aPlayer} bPlayer={bPlayer} chain={chain} won={won} />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={share}
              className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-[#1a1a1a] hover:border-[#ccc] transition-colors"
            >
              {copied ? '✓ Copied' : '↗ Share'}
            </button>
            <Link
              href="/apps/football-games"
              className="flex-1 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-[#1a1a1a] hover:border-[#ccc] transition-colors text-center"
            >
              All games
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing ──────────────────────────────────────────────────────────────────
  const hasSearch = search.length >= 2
  const showEmpty = hasSearch && !isSearching && filteredResults.length === 0 && !searchError

  return (
    <div className="flex flex-col h-[100dvh] bg-[#fafafa]">

      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/apps/football-games" className="text-blue-500 text-sm font-medium hover:underline">← Back</Link>
          <div className="text-center">
            <div className="text-[10px] text-[#999] font-mono uppercase tracking-widest">Six Degrees</div>
            <div className="text-xs font-bold text-[#1a1a1a]">
              {stepsLeft} step{stepsLeft === 1 ? '' : 's'} left
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#ccc]">{dateStr}</div>
        </div>
      </div>

      {/* The challenge — always visible */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <PlayerChip player={aPlayer} />
            <div className="flex-1 flex items-center justify-center gap-0.5">
              {Array(MAX_STEPS).fill(null).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < chain.length
                      ? 'bg-blue-500'
                      : i === chain.length
                      ? 'bg-[#e5e5e5]'
                      : 'bg-[#f0f0f0]'
                  }`}
                />
              ))}
            </div>
            <PlayerChip player={bPlayer} highlight />
          </div>
        </div>
      </div>

      {/* Chain so far */}
      {chain.length > 0 && (
        <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-2 max-h-48 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <ChainTimeline aPlayer={aPlayer} bPlayer={null} chain={chain} won={false} compact />
          </div>
        </div>
      )}

      {/* Current player + link type selector */}
      <div className="flex-shrink-0 bg-[#fafafa] border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="text-xs text-[#999] font-mono uppercase tracking-widest mb-2">
            Now connecting from
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex-shrink-0 text-[9px] font-black px-1.5 py-1 rounded w-8 text-center ${POS_COLOR[currentPlayer!.position] ?? 'bg-zinc-400 text-white'}`}>
              {currentPlayer!.position}
            </span>
            <span className="text-base">{nationalityFlag(currentPlayer!.nationality)}</span>
            <span className="font-bold text-sm text-[#1a1a1a]">{currentPlayer!.name}</span>
          </div>

          {/* Link type buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {(['club', 'international', 'manager'] as LinkType[]).map(lt => (
              <button
                key={lt}
                onClick={() => setPendingLinkType(lt)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  pendingLinkType === lt
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-[#e5e5e5] text-[#666] hover:border-blue-300'
                }`}
              >
                <span>{LINK_ICONS[lt]}</span>
                <span>{lt === 'club' ? 'Club' : lt === 'international' ? 'International' : 'Manager'}</span>
                {lt !== 'club' && (
                  <span className="text-[9px] opacity-60 ml-0.5">♟</span>
                )}
              </button>
            ))}
          </div>
          {pendingLinkType !== 'club' && (
            <div className="text-[10px] text-[#aaa] mt-1.5">Honor system — play fair ⚽</div>
          )}
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="flex-shrink-0 bg-rose-50 border-b border-rose-200 px-4 py-2">
          <div className="max-w-xl mx-auto text-xs text-rose-600 font-medium">{validationError}</div>
        </div>
      )}

      {/* Search */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 pt-3 pb-3">
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder={isValidating ? 'Checking link…' : 'Search for a player…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={isValidating}
              className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-lg pl-4 pr-10 py-2.5 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors disabled:opacity-50"
            />
            {isSearching || isValidating ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] text-xs font-mono">…</div>
            ) : search.length > 0 ? (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] transition-colors text-sm">✕</button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto bg-[#fafafa]">
        <div className="max-w-xl mx-auto px-4 py-3 pb-6">
          {!hasSearch && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-3xl mb-3">🔗</div>
              <div className="text-[#1a1a1a] font-bold mb-1">Who links {currentPlayer!.name} forward?</div>
              <div className="text-[#999] text-sm">Search for a player they&apos;ve shared a club, country, or manager with</div>
            </div>
          )}
          {searchError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-3xl mb-3">⚠️</div>
              <div className="text-[#1a1a1a] font-bold mb-1">Search unavailable</div>
              <div className="text-[#999] text-sm">Check your connection and try again</div>
            </div>
          )}
          {showEmpty && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-3xl mb-3">⚽</div>
              <div className="text-[#1a1a1a] font-bold mb-1">No results for &quot;{search}&quot;</div>
              <div className="text-[#999] text-sm">No results — try a different spelling</div>
            </div>
          )}
          {hasSearch && !searchError && filteredResults.length > 0 && (
            <div className="space-y-1.5">
              {filteredResults.map(player => (
                <button
                  key={player.name}
                  onClick={() => addStep(player)}
                  disabled={isValidating}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    isValidating
                      ? 'border-[#f0f0f0] bg-white opacity-40 cursor-not-allowed'
                      : 'border-[#e5e5e5] bg-white hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100'
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
                  <div className="flex-shrink-0 text-blue-400 text-sm">→</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Chain timeline ────────────────────────────────────────────────────────────

function ChainTimeline({
  aPlayer,
  bPlayer,
  chain,
  won,
  compact = false,
}: {
  aPlayer: ApiPlayer
  bPlayer: ApiPlayer | null
  chain: ChainStep[]
  won: boolean
  compact?: boolean
}) {
  return (
    <div className={compact ? 'space-y-0' : 'px-4 pb-4 space-y-0'}>
      {/* Start player */}
      <ChainNode player={aPlayer} label="Start" compact={compact} isStart />

      {chain.map((step, i) => (
        <div key={i}>
          <ChainConnector linkType={step.linkType} note={step.note} status={step.status} compact={compact} />
          <ChainNode
            player={step.player}
            label={`Step ${i + 1}`}
            compact={compact}
            isEnd={i === chain.length - 1 && won && bPlayer !== null}
          />
        </div>
      ))}

      {/* End player — always shown in full result view */}
      {bPlayer && (
        <>
          {chain.length < 6 && !won && (
            <div className="flex items-center gap-2 py-1 pl-4">
              <div className="w-px h-6 bg-[#e5e5e5] ml-3" />
            </div>
          )}
          <ChainNode player={bPlayer} label="Target" compact={compact} isTarget />
        </>
      )}
    </div>
  )
}

function ChainNode({
  player,
  label,
  compact,
  isStart,
  isEnd,
  isTarget,
}: {
  player: ApiPlayer
  label: string
  compact: boolean
  isStart?: boolean
  isEnd?: boolean
  isTarget?: boolean
}) {
  const highlight = isStart || isEnd
  const dimmed = isTarget && !isEnd

  return (
    <div className={`flex items-center gap-3 ${compact ? 'py-1.5' : 'py-2'}`}>
      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
        isEnd ? 'border-[#1a7a3e] bg-[#1a7a3e]' :
        isStart ? 'border-blue-500 bg-blue-500' :
        isTarget ? 'border-dashed border-[#ccc] bg-white' :
        'border-blue-500 bg-blue-500'
      }`}>
        {isEnd ? <span className="text-white text-[8px]">✓</span> :
         isTarget ? <span className="text-[#ccc] text-[8px]">?</span> :
         <span className="text-white text-[8px]">•</span>}
      </div>
      <div className={`flex-1 min-w-0 ${dimmed ? 'opacity-40' : ''}`}>
        <div className={`text-sm font-bold truncate ${highlight ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]'}`}>
          {player.name}
        </div>
        {!compact && (
          <div className="text-xs text-[#999] truncate">{player.currentTeam}</div>
        )}
      </div>
      <div className="text-[10px] text-[#ccc] font-mono flex-shrink-0">{label}</div>
    </div>
  )
}

function ChainConnector({
  linkType,
  note,
  status,
  compact,
}: {
  linkType: LinkType
  note: string
  status: VerificationStatus
  compact: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="w-6 flex justify-center flex-shrink-0">
        <div className="w-px h-full bg-[#e5e5e5] min-h-[20px]" />
      </div>
      <div className={`flex items-center gap-1.5 ${compact ? '' : 'bg-[#f8f8f8] rounded-lg px-2 py-1'}`}>
        <span className="text-xs">{LINK_ICONS[linkType]}</span>
        {!compact && (
          <>
            <span className="text-[11px] text-[#666]">{note}</span>
            {status === 'verified' && <span className="text-[10px] text-[#1a7a3e] font-bold">✓</span>}
            {status === 'unverified' && <span className="text-[10px] text-[#aaa]">♟</span>}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Player chip (small inline display) ───────────────────────────────────────

function PlayerChip({ player, highlight }: { player: ApiPlayer; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border flex-shrink-0 max-w-[120px] ${
      highlight ? 'border-[#1a7a3e] bg-[#f0f7f3]' : 'border-[#e5e5e5] bg-white'
    }`}>
      <span className="text-xs">{nationalityFlag(player.nationality)}</span>
      <span className="text-xs font-bold text-[#1a1a1a] truncate">{player.name}</span>
    </div>
  )
}
