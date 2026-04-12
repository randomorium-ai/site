'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { Player } from '@/lib/player'
import { nationalityFlag, POS_COLOR, sixDegreesLabel } from '@/lib/football-utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type LinkType = 'club' | 'international'
type WizardStep = 'type' | 'player' | 'club-entity' | 'club-league' | 'intl-tournament' | 'intl-year'
type Phase = 'loading' | 'playing' | 'won' | 'failed' | 'error'

interface ChainStep {
  player: Player
  linkType: LinkType
  entity: string      // club name / country / manager name
  evidence: string    // returned by validate-link
}

interface GameStorage {
  streak: number
  lastDate: string
  history: { steps: number; strikes: number; dateStr: string }[]
}

const STORAGE_KEY = 'nf_six_degrees_v2'
const MAX_STEPS = 6
const MAX_STRIKES = 3
const SEARCH_DEBOUNCE_MS = 350

// ─── Storage ──────────────────────────────────────────────────────────────────

function getStorage(): GameStorage {
  if (typeof window === 'undefined') return { streak: 0, lastDate: '', history: [] }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? { streak: 0, lastDate: '', history: [] }
  } catch {
    return { streak: 0, lastDate: '', history: [] }
  }
}

function saveStorage(dateStr: string, steps: number, strikes: number): GameStorage {
  const stored = getStorage()
  const diffDays = Math.round(
    (new Date(dateStr).getTime() - new Date(stored.lastDate || '2000-01-01').getTime()) / 86400000
  )
  const streak = diffDays === 1 ? stored.streak + 1 : diffDays === 0 ? stored.streak : 1
  const history = [{ steps, strikes, dateStr }, ...stored.history.filter(e => e.dateStr !== dateStr)].slice(0, 30)
  const next = { streak, lastDate: dateStr, history }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LINK_ICONS: Record<LinkType, string> = {
  club: '🏟️',
  international: '🌍',
}

const LINK_LABELS: Record<LinkType, string> = {
  club: 'Club teammates',
  international: 'International teammates',
}

function normaliseStr(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function StatusBadges({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${POS_COLOR[player.position] ?? 'bg-zinc-400 text-white'}`}>
        {player.position}
      </span>
      {player.retired && <span className="text-[9px] font-black px-1 py-0.5 rounded bg-zinc-400 text-white">RET</span>}
      {player.is_manager && <span className="text-[9px] font-black px-1 py-0.5 rounded bg-slate-700 text-white">MGR</span>}
    </div>
  )
}

function playerClubDisplay(player: Player): string {
  if (player.is_manager && player.managing_club) return `${player.managing_club} (Manager)`
  if (player.retired) return 'Retired'
  return player.current_club || '—'
}

function buildShareText(
  dateStr: string,
  aPlayer: Player,
  bPlayer: Player,
  chain: ChainStep[],
  strikes: number,
  won: boolean,
): string {
  const steps = chain.length
  const label = won ? sixDegreesLabel(steps) : "Couldn't find the connection"
  const stepDots = won
    ? Array(steps).fill('🟢').join('') + Array(MAX_STEPS - steps).fill('⬜').join('')
    : Array(steps).fill('🟢').join('') + Array(MAX_STEPS - steps).fill('🔴').join('')
  const strikeDots = Array(strikes).fill('❌').join('') + Array(MAX_STRIKES - strikes).fill('🫀').join('')

  return [
    `⚽ SIX DEGREES — ${dateStr}`,
    `${aPlayer.name} → ${bPlayer.name}`,
    '',
    stepDots,
    strikeDots,
    '',
    won ? `${steps} step${steps === 1 ? '' : 's'} · ${label}` : label,
    'randomorium.ai/apps/football-games/six-degrees',
  ].join('\n')
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SixDegreesGame() {
  const [dateStr, setDateStr] = useState('')
  const [aPlayer, setAPlayer] = useState<Player | null>(null)
  const [bPlayer, setBPlayer] = useState<Player | null>(null)
  const [chain, setChain] = useState<ChainStep[]>([])
  const [strikes, setStrikes] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [storage, setStorage] = useState<GameStorage>({ streak: 0, lastDate: '', history: [] })
  const [copied, setCopied] = useState(false)

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('type')
  const [pendingLinkType, setPendingLinkType] = useState<LinkType>('club')
  const [pendingEntity, setPendingEntity] = useState('')
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null)
  const [pendingTournamentCategory, setPendingTournamentCategory] = useState<string | null>(null)
  const [pendingLeague, setPendingLeague] = useState<string | null>(null)

  // Entity search
  const [entitySearch, setEntitySearch] = useState('')
  const [entityResults, setEntityResults] = useState<string[]>([])
  const [isEntitySearching, setIsEntitySearching] = useState(false)

  // Player search
  const [playerSearch, setPlayerSearch] = useState('')
  const [playerResults, setPlayerResults] = useState<Player[]>([])
  const [isPlayerSearching, setIsPlayerSearching] = useState(false)
  const [playerSearchError, setPlayerSearchError] = useState(false)

  // Validation
  const [isValidating, setIsValidating] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const entityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playerSearchCache = useRef(new Map<string, Player[]>())
  const entitySearchCache = useRef(new Map<string, string[]>())
  const playerInputRef = useRef<HTMLInputElement>(null)
  const entityInputRef = useRef<HTMLInputElement>(null)

  // ── Load daily puzzle ──────────────────────────────────────────────────────
  useEffect(() => {
    setStorage(getStorage())
    fetch('/api/football/daily-puzzle')
      .then(r => r.json())
      .then(({ aPlayer: a, bPlayer: b, dateStr: d }: { aPlayer: Player; bPlayer: Player; dateStr: string }) => {
        setAPlayer(a)
        setBPlayer(b)
        setDateStr(d)
        setPhase('playing')
      })
      .catch(() => setPhase('error'))
  }, [])

  // ── Entity search ──────────────────────────────────────────────────────────
  const runEntitySearch = useCallback(async (q: string, lt: LinkType) => {
    if (q.length < 2) { setEntityResults([]); setIsEntitySearching(false); return }
    const cacheKey = `${lt}:${q.toLowerCase().trim()}`
    const cached = entitySearchCache.current.get(cacheKey)
    if (cached) { setEntityResults(cached); setIsEntitySearching(false); return }

    setIsEntitySearching(true)
    try {
      let results: string[] = []
      if (lt === 'club') {
        const res = await fetch(`/api/football/clubs?search=${encodeURIComponent(q)}`)
        if (res.ok) results = ((await res.json()) as { clubs: string[] }).clubs
      } else if (lt === 'international') {
        // Tournament list — filter client-side
        const normQ = normaliseStr(q)
        results = TOURNAMENTS.filter(t => normaliseStr(t.name).includes(normQ)).map(t => t.name).slice(0, 12)
      }
      entitySearchCache.current.set(cacheKey, results)
      setEntityResults(results)
    } catch {
      setEntityResults([])
    } finally {
      setIsEntitySearching(false)
    }
  }, [])

  useEffect(() => {
    if (wizardStep !== 'club-entity' && wizardStep !== 'intl-tournament') return
    if (entityDebounceRef.current) clearTimeout(entityDebounceRef.current)
    if (entitySearch.length < 2) { setEntityResults([]); setIsEntitySearching(false); return }
    setIsEntitySearching(true)
    entityDebounceRef.current = setTimeout(() => runEntitySearch(entitySearch, pendingLinkType), SEARCH_DEBOUNCE_MS)
    return () => { if (entityDebounceRef.current) clearTimeout(entityDebounceRef.current) }
  }, [entitySearch, wizardStep, pendingLinkType, runEntitySearch])

  // ── Player search ──────────────────────────────────────────────────────────
  const runPlayerSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setPlayerResults([]); setIsPlayerSearching(false); return }
    const cacheKey = q.toLowerCase().trim()
    const cached = playerSearchCache.current.get(cacheKey)
    if (cached) { setPlayerResults(cached); setIsPlayerSearching(false); return }
    setIsPlayerSearching(true); setPlayerSearchError(false)
    try {
      const res = await fetch(`/api/football/players?search=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error()
      const { players } = await res.json() as { players: Player[] }
      playerSearchCache.current.set(cacheKey, players)
      setPlayerResults(players)
    } catch { setPlayerSearchError(true); setPlayerResults([]) }
    finally { setIsPlayerSearching(false) }
  }, [])

  useEffect(() => {
    if (wizardStep !== 'player') return
    if (playerDebounceRef.current) clearTimeout(playerDebounceRef.current)
    if (playerSearch.length < 2) { setPlayerResults([]); setIsPlayerSearching(false); return }
    setIsPlayerSearching(true)
    playerDebounceRef.current = setTimeout(() => runPlayerSearch(playerSearch), SEARCH_DEBOUNCE_MS)
    return () => { if (playerDebounceRef.current) clearTimeout(playerDebounceRef.current) }
  }, [playerSearch, wizardStep, runPlayerSearch])

  // ── Wizard navigation ──────────────────────────────────────────────────────
  function selectType(lt: LinkType) {
    setPendingLinkType(lt)
    setPendingEntity('')
    setEntitySearch('')
    setEntityResults([])
    setLastError(null)
    // Both types start with player search
    setWizardStep('player')
    setTimeout(() => playerInputRef.current?.focus(), 50)
  }

  function goBackToType() {
    setWizardStep('type')
    setLastError(null)
    setPendingEntity('')
    setPendingPlayer(null)
    setPendingTournamentCategory(null)
    setPendingLeague(null)
    setEntitySearch('')
    setEntityResults([])
    setPlayerSearch('')
    setPlayerResults([])
  }

  function goBackFromPlayer() {
    goBackToType()
  }

  // ── Club flow ───────────────────────────────────────────────────────────────
  function selectPlayerForClub(player: Player) {
    setPendingPlayer(player)
    setPlayerSearch('')
    setPlayerResults([])
    setEntitySearch('')
    setEntityResults([])
    setWizardStep('club-entity')
    setTimeout(() => entityInputRef.current?.focus(), 50)
  }

  function goBackFromClubEntity() {
    setWizardStep('player')
    setPendingPlayer(null)
    setEntitySearch('')
    setEntityResults([])
    setTimeout(() => playerInputRef.current?.focus(), 50)
  }

  function selectLeague(league: string) {
    setPendingLeague(league)
    setWizardStep('club-league')
  }

  function goBackFromClubLeague() {
    setPendingLeague(null)
    setWizardStep('club-entity')
    setTimeout(() => entityInputRef.current?.focus(), 50)
  }

  // ── International flow ─────────────────────────────────────────────────────
  function selectPlayerForIntl(player: Player) {
    setPendingPlayer(player)
    setPlayerSearch('')
    setPlayerResults([])
    setEntitySearch('')
    setEntityResults([])
    setPendingTournamentCategory(null)
    setWizardStep('intl-tournament')
  }

  function selectTournamentCategory(category: string) {
    setPendingTournamentCategory(category)
    setWizardStep('intl-year')
  }

  function goBackFromIntlYear() {
    setPendingTournamentCategory(null)
    setWizardStep('intl-tournament')
  }

  function goBackFromIntlTournament() {
    setWizardStep('player')
    setPendingPlayer(null)
    setEntitySearch('')
    setEntityResults([])
    setTimeout(() => playerInputRef.current?.focus(), 50)
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const currentPlayer = chain.length === 0 ? aPlayer : chain[chain.length - 1].player
  const usedNames = new Set<string>([
    aPlayer?.name ?? '',
    ...chain.map(s => s.player.name),
  ])
  const filteredPlayerResults = playerResults.filter(p => !usedNames.has(p.name))

  // ── Add a step ─────────────────────────────────────────────────────────────
  async function addStep(player: Player, entityOverride?: string) {
    if (phase !== 'playing' || !currentPlayer || !bPlayer) return
    setLastError(null)

    const entity = entityOverride ?? pendingEntity
    const normName = (s: string) => normaliseStr(s)
    const willWin = normName(player.name) === normName(bPlayer.name)

    setIsValidating(true)
    try {
      const res = await fetch('/api/football/validate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerAId: currentPlayer.id,
          playerBId: player.id,
          linkType: pendingLinkType,
          entity,
        }),
      })
      const data = await res.json() as { valid: boolean; evidence: string | null; reason?: string }

      if (!data.valid) {
        const newStrikes = strikes + 1
        setStrikes(newStrikes)
        setLastError(data.reason ?? `No ${LINK_LABELS[pendingLinkType].toLowerCase()} connection found`)
        // Stay on current step so user can try again
        if (newStrikes >= MAX_STRIKES) {
          const next = saveStorage(dateStr, chain.length, newStrikes)
          setStorage(next)
          setPhase('failed')
        }
        return
      }

      const step: ChainStep = {
        player,
        linkType: pendingLinkType,
        entity,
        evidence: data.evidence ?? LINK_LABELS[pendingLinkType],
      }
      const newChain = [...chain, step]
      setChain(newChain)

      if (willWin) {
        const next = saveStorage(dateStr, newChain.length, strikes)
        setStorage(next)
        setPhase('won')
      } else if (newChain.length >= MAX_STEPS) {
        const next = saveStorage(dateStr, newChain.length, strikes)
        setStorage(next)
        setPhase('failed')
      } else {
        // Reset wizard to type step for next link
        setWizardStep('type')
        setPendingEntity('')
        setPendingPlayer(null)
        setEntitySearch('')
        setPlayerSearch('')
        setPlayerResults([])
        setLastError(null)
      }
    } catch {
      setLastError('Connection error — check your internet and try again')
    } finally {
      setIsValidating(false)
    }
  }

  // ── Share ──────────────────────────────────────────────────────────────────
  async function share() {
    if (!aPlayer || !bPlayer) return
    const text = buildShareText(dateStr, aPlayer, bPlayer, chain, strikes, phase === 'won')
    try {
      if (navigator.share) await navigator.share({ text })
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    } catch { /* ignore */ }
  }

  // ── Loading / error ────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-[#999] text-sm font-mono">Loading today&apos;s puzzle…</div>
      </div>
    )
  }

  if (phase === 'error' || !aPlayer || !bPlayer) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-5 gap-4">
        <div className="text-3xl">⚠️</div>
        <div className="text-[#1a1a1a] font-bold text-center">Couldn&apos;t load today&apos;s puzzle</div>
        <div className="text-[#999] text-sm text-center">Check your connection and try again</div>
        <Link href="/apps/football-games" className="text-blue-500 text-sm hover:underline">← All games</Link>
      </div>
    )
  }

  // ── Won / Failed ───────────────────────────────────────────────────────────
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
            {strikes > 0 && (
              <div className="text-xs text-[#aaa] mt-2">
                {strikes} strike{strikes === 1 ? '' : 's'}
              </div>
            )}
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

  // ── Playing ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[100dvh] bg-[#fafafa]">

      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/apps/football-games" className="text-blue-500 text-sm font-medium hover:underline">← Back</Link>
          <div className="text-center">
            <div className="text-[10px] text-[#999] font-mono uppercase tracking-widest">Six Degrees</div>
            <div className="flex items-center gap-2 justify-center mt-0.5">
              <div className="text-xs font-bold text-[#1a1a1a]">
                {MAX_STEPS - chain.length} step{MAX_STEPS - chain.length === 1 ? '' : 's'} left
              </div>
              <div className="flex gap-0.5">
                {Array(MAX_STRIKES).fill(null).map((_, i) => (
                  <span key={i} className={`text-xs ${i < MAX_STRIKES - strikes ? 'opacity-100' : 'opacity-20'}`}>🫀</span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#ccc]">{dateStr}</div>
        </div>
      </div>

      {/* Progress bar — A → [dots] → B */}
      <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <PlayerChip player={aPlayer} />
            <div className="flex-1 flex items-center gap-0.5">
              {Array(MAX_STEPS).fill(null).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < chain.length ? 'bg-[#1a7a3e]' : 'bg-[#f0f0f0]'
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
        <div className="flex-shrink-0 bg-white border-b border-[#e5e5e5] max-h-44 overflow-y-auto">
          <div className="max-w-xl mx-auto px-4 py-2">
            <ChainTimeline aPlayer={aPlayer} bPlayer={null} chain={chain} won={false} compact />
          </div>
        </div>
      )}

      {/* Strike error banner */}
      {lastError && (
        <div className="flex-shrink-0 bg-rose-50 border-b border-rose-200 px-4 py-2">
          <div className="max-w-xl mx-auto flex items-center gap-2">
            <span className="text-rose-500 text-sm">❌</span>
            <div className="text-xs text-rose-600 font-medium">{lastError}</div>
          </div>
        </div>
      )}

      {/* "Now connecting from" */}
      <div className="flex-shrink-0 bg-[#fafafa] border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="text-[10px] text-[#999] font-mono uppercase tracking-widest mb-1.5">Connecting from</div>
          <div className="flex items-center gap-2">
            <StatusBadges player={currentPlayer!} />
            <span className="text-base">{nationalityFlag(currentPlayer!.nationality)}</span>
            <span className="font-bold text-sm text-[#1a1a1a]">{currentPlayer!.name}</span>
            <span className="text-xs text-[#aaa] truncate">{playerClubDisplay(currentPlayer!)}</span>
          </div>
        </div>
      </div>

      {/* ── Wizard ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-3">

          {/* STEP 1: Link type */}
          {wizardStep === 'type' && (
            <div className="space-y-3">
              <div className="text-xs text-[#999] font-mono uppercase tracking-widest">How are they connected?</div>
              {(['club', 'international'] as LinkType[]).map(lt => (
                <button
                  key={lt}
                  onClick={() => selectType(lt)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-[#e5e5e5] rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <span className="text-xl w-8 text-center">{LINK_ICONS[lt]}</span>
                  <div>
                    <div className="text-sm font-bold text-[#1a1a1a]">{LINK_LABELS[lt]}</div>
                    <div className="text-xs text-[#999]">{LINK_TYPE_HINTS[lt]}</div>
                  </div>
                  <span className="ml-auto text-[#ccc] text-sm">→</span>
                </button>
              ))}
            </div>
          )}

          {/* STEP: International — pick tournament category */}
          {wizardStep === 'intl-tournament' && pendingPlayer && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button onClick={goBackFromIntlTournament} className="text-blue-500 text-sm hover:underline">← Back</button>
                <div className="text-xs text-[#999] font-mono uppercase tracking-widest">Which tournament?</div>
              </div>
              {/* Selected player chip */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-base">🌍</span>
                <span className="text-sm font-bold text-blue-700 flex-1">{pendingPlayer.name}</span>
                <button onClick={goBackFromIntlTournament} className="text-blue-400 hover:text-blue-600 text-sm">✕</button>
              </div>
              {/* Search */}
              <div className="relative">
                <input
                  ref={entityInputRef}
                  type="text"
                  placeholder="Search e.g. World Cup 2018, Euro 2020…"
                  value={entitySearch}
                  onChange={e => setEntitySearch(e.target.value)}
                  className="w-full bg-white border border-[#e0e0e0] rounded-lg pl-4 pr-10 py-2.5 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                />
                {isEntitySearching ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] text-xs font-mono">…</div>
                ) : entitySearch.length > 0 ? (
                  <button onClick={() => { setEntitySearch(''); setEntityResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] text-sm">✕</button>
                ) : null}
              </div>
              {/* Search results */}
              {entityResults.length > 0 && (
                <div className="space-y-1">
                  {entityResults.map(name => (
                    <button key={name} onClick={() => { setPendingEntity(name); addStep(pendingPlayer, name) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <span className="text-base">🌍</span>
                      <span className="text-sm font-medium text-[#1a1a1a] flex-1">{name}</span>
                      <span className="text-blue-400 text-sm">→</span>
                    </button>
                  ))}
                </div>
              )}
              {/* Category tiles (shown when not searching) */}
              {entitySearch.length < 2 && (
                <div className="space-y-1.5">
                  {TOURNAMENT_GROUPS.map(g => (
                    <button key={g.category} onClick={() => selectTournamentCategory(g.category)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <span className="text-xl w-8 text-center">{g.flag}</span>
                      <span className="text-sm font-bold text-[#1a1a1a] flex-1">{g.category}</span>
                      <span className="text-xs text-[#aaa]">{g.entries.length} editions</span>
                      <span className="ml-1 text-[#ccc] text-sm">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: International — pick year */}
          {wizardStep === 'intl-year' && pendingPlayer && pendingTournamentCategory && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button onClick={goBackFromIntlYear} className="text-blue-500 text-sm hover:underline">← Back</button>
                <div className="text-xs text-[#999] font-mono uppercase tracking-widest">Which year?</div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-base">🌍</span>
                <span className="text-sm font-bold text-blue-700">{pendingPlayer.name}</span>
                <span className="text-[#aaa] text-xs">·</span>
                <span className="text-sm font-bold text-blue-700 flex-1">{pendingTournamentCategory}</span>
                <button onClick={goBackFromIntlYear} className="text-blue-400 hover:text-blue-600 text-sm">✕</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(TOURNAMENT_GROUPS.find(g => g.category === pendingTournamentCategory)?.entries ?? []).map(entry => (
                  <button key={entry.name} onClick={() => { setPendingEntity(entry.name); addStep(pendingPlayer, entry.name) }}
                    className="py-3 bg-white border border-[#e5e5e5] rounded-xl text-sm font-bold text-[#1a1a1a] hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                  >
                    {entry.displayYear}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Player */}
          {wizardStep === 'player' && (
            <div className="space-y-3">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={goBackFromPlayer} className="text-blue-500 text-xs hover:underline">← Change link</button>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700 font-medium">
                  <span>{LINK_ICONS[pendingLinkType]}</span>
                  <span>{LINK_LABELS[pendingLinkType]}</span>
                </div>
              </div>

              <div className="text-xs text-[#999] font-mono uppercase tracking-widest">Now pick the next player</div>
              <div className="relative">
                <input
                  ref={playerInputRef}
                  type="text"
                  placeholder={isValidating ? 'Checking…' : 'Search for a player…'}
                  value={playerSearch}
                  onChange={e => setPlayerSearch(e.target.value)}
                  disabled={isValidating}
                  className="w-full bg-white border border-[#e0e0e0] rounded-lg pl-4 pr-10 py-2.5 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors disabled:opacity-50"
                />
                {isPlayerSearching || isValidating ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] text-xs font-mono">…</div>
                ) : playerSearch.length > 0 ? (
                  <button onClick={() => { setPlayerSearch(''); setPlayerResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] text-sm">✕</button>
                ) : null}
              </div>

              {playerSearchError && (
                <div className="text-center py-4 text-[#999] text-sm">Search unavailable — check your connection</div>
              )}

              {!playerSearchError && playerSearch.length >= 2 && !isPlayerSearching && filteredPlayerResults.length === 0 && (
                <div className="text-center py-4 text-[#999] text-sm">No results for &quot;{playerSearch}&quot;</div>
              )}

              {!playerSearchError && filteredPlayerResults.length > 0 && (
                <div className="space-y-1.5 pb-6">
                  {filteredPlayerResults.map(player => (
                    <button
                      key={player.id}
                      onClick={() => pendingLinkType === 'club' ? selectPlayerForClub(player) : selectPlayerForIntl(player)}
                      disabled={isValidating}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        isValidating
                          ? 'border-[#f0f0f0] bg-white opacity-40 cursor-not-allowed'
                          : 'border-[#e5e5e5] bg-white hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100'
                      }`}
                    >
                      <StatusBadges player={player} />
                      <span className="text-base flex-shrink-0">{nationalityFlag(player.nationality)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1a1a1a] truncate">{player.name}</div>
                        <div className="text-xs text-[#999] truncate">{playerClubDisplay(player)}</div>
                      </div>
                      <span className="flex-shrink-0 text-blue-400 text-sm">→</span>
                    </button>
                  ))}
                </div>
              )}

              {playerSearch.length < 2 && filteredPlayerResults.length === 0 && (
                <div className="text-center py-10 text-[#bbb] text-sm">
                  Who was {LINK_TYPE_CONNECTORS[pendingLinkType]} {pendingEntity} with {currentPlayer?.name}?
                </div>
              )}
            </div>
          )}

          {/* STEP: Club entity (after player is chosen) */}
          {wizardStep === 'club-entity' && pendingPlayer && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button onClick={goBackFromClubEntity} className="text-blue-500 text-sm hover:underline">← Back</button>
                <div className="text-xs text-[#999] font-mono uppercase tracking-widest">Which club?</div>
              </div>
              {/* Selected player chip */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-base">{LINK_ICONS.club}</span>
                <span className="text-sm font-bold text-blue-700 flex-1">{pendingPlayer.name}</span>
                <button onClick={goBackFromClubEntity} className="text-blue-400 hover:text-blue-600 text-sm">✕</button>
              </div>
              {/* Text search */}
              <div className="relative">
                <input
                  ref={entityInputRef}
                  type="text"
                  placeholder="Search any club…"
                  value={entitySearch}
                  onChange={e => setEntitySearch(e.target.value)}
                  className="w-full bg-white border border-[#e0e0e0] rounded-lg pl-4 pr-10 py-2.5 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                />
                {isEntitySearching ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] text-xs font-mono">…</div>
                ) : entitySearch.length > 0 ? (
                  <button onClick={() => { setEntitySearch(''); setEntityResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] text-sm">✕</button>
                ) : null}
              </div>
              {entityResults.length > 0 && (
                <div className="space-y-1">
                  {entityResults.map(club => (
                    <button key={club} onClick={() => { setPendingEntity(club); addStep(pendingPlayer, club) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <span className="text-base">🏟️</span>
                      <span className="text-sm font-medium text-[#1a1a1a] flex-1">{club}</span>
                      <span className="text-blue-400 text-sm">→</span>
                    </button>
                  ))}
                </div>
              )}
              {entitySearch.length >= 2 && !isEntitySearching && entityResults.length === 0 && (
                <div className="text-center py-4 text-[#999] text-sm">No clubs found for &quot;{entitySearch}&quot;</div>
              )}
              {/* League browser (shown when not searching) */}
              {entitySearch.length < 2 && (
                <>
                  <div className="text-xs text-[#bbb] font-mono uppercase tracking-widest pt-1">Or browse by league</div>
                  <div className="space-y-1.5">
                    {EUROPEAN_LEAGUES.map(league => (
                      <button key={league.name} onClick={() => selectLeague(league.name)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all"
                      >
                        <span className="text-xl w-8 text-center">{league.flag}</span>
                        <span className="text-sm font-bold text-[#1a1a1a] flex-1">{league.name}</span>
                        <span className="text-[#ccc] text-sm">→</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP: Club league browser */}
          {wizardStep === 'club-league' && pendingPlayer && pendingLeague && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button onClick={goBackFromClubLeague} className="text-blue-500 text-sm hover:underline">← Back</button>
                <div className="text-xs text-[#999] font-mono uppercase tracking-widest">{pendingLeague}</div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-base">🏟️</span>
                <span className="text-sm font-bold text-blue-700 flex-1">{pendingPlayer.name}</span>
                <span className="text-[#aaa] text-xs">·</span>
                <span className="text-sm font-bold text-blue-700">{pendingLeague}</span>
                <button onClick={goBackFromClubLeague} className="text-blue-400 hover:text-blue-600 text-sm ml-2">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 pb-4">
                {(EUROPEAN_LEAGUES.find(l => l.name === pendingLeague)?.clubs ?? []).map(club => (
                  <button key={club} onClick={() => { setPendingEntity(club); addStep(pendingPlayer, club) }}
                    className="py-2.5 px-3 bg-white border border-[#e5e5e5] rounded-lg text-sm font-medium text-[#1a1a1a] hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                  >
                    {club}
                  </button>
                ))}
              </div>
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
  aPlayer: Player
  bPlayer: Player | null
  chain: ChainStep[]
  won: boolean
  compact?: boolean
}) {
  return (
    <div className={compact ? 'space-y-0' : 'px-4 pb-4 space-y-0'}>
      <ChainNode player={aPlayer} label="Start" compact={compact} isStart />

      {chain.map((step, i) => (
        <div key={i}>
          <ChainConnector
            linkType={step.linkType}
            entity={step.entity}
            evidence={step.evidence}
            compact={compact}
          />
          <ChainNode
            player={step.player}
            label={`Step ${i + 1}`}
            compact={compact}
            isEnd={i === chain.length - 1 && won && bPlayer !== null}
          />
        </div>
      ))}

      {bPlayer && !won && (
        <>
          <div className="flex items-center gap-3 py-0.5">
            <div className="w-6 flex justify-center">
              <div className="w-px h-5 bg-[#e5e5e5]" />
            </div>
          </div>
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
  player: Player
  label: string
  compact: boolean
  isStart?: boolean
  isEnd?: boolean
  isTarget?: boolean
}) {
  const dimmed = isTarget && !isEnd

  return (
    <div className={`flex items-center gap-3 ${compact ? 'py-1.5' : 'py-2'}`}>
      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
        isEnd ? 'border-[#1a7a3e] bg-[#1a7a3e]' :
        isStart ? 'border-blue-500 bg-blue-500' :
        isTarget ? 'border-dashed border-[#ccc] bg-white' :
        'border-[#1a7a3e] bg-[#1a7a3e]'
      }`}>
        {isEnd ? <span className="text-white text-[8px]">✓</span> :
         isTarget ? <span className="text-[#ccc] text-[8px]">?</span> :
         <span className="text-white text-[8px]">•</span>}
      </div>
      <div className={`flex-1 min-w-0 ${dimmed ? 'opacity-40' : ''}`}>
        <div className="text-sm font-bold text-[#1a1a1a] truncate">{player.name}</div>
        {!compact && (
          <div className="text-xs text-[#999] truncate">{playerClubDisplay(player)}</div>
        )}
      </div>
      <div className="text-[10px] text-[#ccc] font-mono flex-shrink-0">{label}</div>
    </div>
  )
}

function ChainConnector({
  linkType,
  entity,
  evidence,
  compact,
}: {
  linkType: LinkType
  entity: string
  evidence: string
  compact: boolean
}) {
  return (
    <div className="flex items-stretch gap-3">
      <div className="w-6 flex justify-center flex-shrink-0">
        <div className="w-px bg-[#e5e5e5]" />
      </div>
      <div className={`flex items-center gap-1.5 my-0.5 ${compact ? 'py-0.5' : 'bg-[#f8f8f8] rounded-lg px-2 py-1.5 flex-1'}`}>
        <span className="text-xs">{LINK_ICONS[linkType]}</span>
        {!compact && (
          <span className="text-[11px] text-[#666] truncate">{evidence || entity}</span>
        )}
      </div>
    </div>
  )
}

// ─── Player chip ───────────────────────────────────────────────────────────────

function PlayerChip({ player, highlight }: { player: Player; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border flex-shrink-0 max-w-[120px] ${
      highlight ? 'border-[#1a7a3e] bg-[#f0f7f3]' : 'border-[#e5e5e5] bg-white'
    }`}>
      <span className="text-xs">{nationalityFlag(player.nationality)}</span>
      <span className="text-xs font-bold text-[#1a1a1a] truncate">{player.name}</span>
    </div>
  )
}

// ─── Static text ───────────────────────────────────────────────────────────────

const LINK_TYPE_HINTS: Record<LinkType, string> = {
  club: 'Both played for the same club at the same time',
  international: 'Both represented the same country at the same tournament',
}

const ENTITY_PROMPTS: Record<LinkType, string> = {
  club: '',
  international: 'Which tournament?',
}

const ENTITY_PLACEHOLDERS: Record<LinkType, string> = {
  club: '',
  international: 'e.g. World Cup 2018, Euro 2020…',
}

const LINK_TYPE_CONNECTORS: Record<LinkType, string> = {
  club: 'as a club teammate of',
  international: 'at',
}

// ─── Tournament list ───────────────────────────────────────────────────────────

const TOURNAMENTS: { name: string; year: number }[] = [
  // FIFA World Cup
  { name: 'World Cup 2022', year: 2022 },
  { name: 'World Cup 2018', year: 2018 },
  { name: 'World Cup 2014', year: 2014 },
  { name: 'World Cup 2010', year: 2010 },
  { name: 'World Cup 2006', year: 2006 },
  { name: 'World Cup 2002', year: 2002 },
  { name: 'World Cup 1998', year: 1998 },
  { name: 'World Cup 1994', year: 1994 },
  { name: 'World Cup 1990', year: 1990 },
  // UEFA Euro
  { name: 'Euro 2024', year: 2024 },
  { name: 'Euro 2020', year: 2021 },
  { name: 'Euro 2016', year: 2016 },
  { name: 'Euro 2012', year: 2012 },
  { name: 'Euro 2008', year: 2008 },
  { name: 'Euro 2004', year: 2004 },
  { name: 'Euro 2000', year: 2000 },
  { name: 'Euro 1996', year: 1996 },
  { name: 'Euro 1992', year: 1992 },
  // Copa América
  { name: 'Copa América 2024', year: 2024 },
  { name: 'Copa América 2021', year: 2021 },
  { name: 'Copa América 2019', year: 2019 },
  { name: 'Copa América 2016', year: 2016 },
  { name: 'Copa América 2015', year: 2015 },
  { name: 'Copa América 2011', year: 2011 },
  { name: 'Copa América 2007', year: 2007 },
  { name: 'Copa América 2004', year: 2004 },
  { name: 'Copa América 2001', year: 2001 },
  { name: 'Copa América 1999', year: 1999 },
  // Africa Cup of Nations
  { name: 'AFCON 2024', year: 2024 },
  { name: 'AFCON 2022', year: 2022 },
  { name: 'AFCON 2019', year: 2019 },
  { name: 'AFCON 2017', year: 2017 },
  { name: 'AFCON 2015', year: 2015 },
  { name: 'AFCON 2013', year: 2013 },
  { name: 'AFCON 2012', year: 2012 },
  { name: 'AFCON 2010', year: 2010 },
  { name: 'AFCON 2008', year: 2008 },
  { name: 'AFCON 2006', year: 2006 },
  { name: 'AFCON 2004', year: 2004 },
  // AFC Asian Cup
  { name: 'Asian Cup 2023', year: 2023 },
  { name: 'Asian Cup 2019', year: 2019 },
  { name: 'Asian Cup 2015', year: 2015 },
  { name: 'Asian Cup 2011', year: 2011 },
  { name: 'Asian Cup 2007', year: 2007 },
  { name: 'Asian Cup 2004', year: 2004 },
  // CONCACAF Gold Cup
  { name: 'Gold Cup 2023', year: 2023 },
  { name: 'Gold Cup 2021', year: 2021 },
  { name: 'Gold Cup 2019', year: 2019 },
  { name: 'Gold Cup 2017', year: 2017 },
  { name: 'Gold Cup 2015', year: 2015 },
  { name: 'Gold Cup 2013', year: 2013 },
]

// ─── Tournament groups (derived from TOURNAMENTS for browse UI) ────────────────

interface TournamentGroup {
  category: string
  flag: string
  entries: { name: string; displayYear: string }[]
}

const TOURNAMENT_CATEGORY_FLAGS: Record<string, string> = {
  'World Cup': '🌍',
  'Euro': '🇪🇺',
  'Copa América': '🌎',
  'AFCON': '🌍',
  'Asian Cup': '🌏',
  'Gold Cup': '🌎',
}

const TOURNAMENT_GROUPS: TournamentGroup[] = (() => {
  const map = new Map<string, { name: string; displayYear: string }[]>()
  for (const t of TOURNAMENTS) {
    const m = t.name.match(/^(.+?)\s+(\d{4})$/)
    if (!m) continue
    const [, category, year] = m
    if (!map.has(category)) map.set(category, [])
    map.get(category)!.push({ name: t.name, displayYear: year })
  }
  return Array.from(map.entries()).map(([category, entries]) => ({
    category,
    flag: TOURNAMENT_CATEGORY_FLAGS[category] ?? '🏆',
    entries,
  }))
})()

// ─── European leagues for club browsing ───────────────────────────────────────

const EUROPEAN_LEAGUES = [
  {
    name: 'Premier League',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    clubs: [
      'Arsenal', 'Aston Villa', 'Chelsea', 'Everton', 'Leeds United',
      'Leicester City', 'Liverpool', 'Manchester City', 'Manchester United',
      'Newcastle United', 'Tottenham Hotspur', 'West Ham United',
      'Blackburn Rovers', 'Middlesbrough', 'Bolton Wanderers', 'Sunderland',
      'Fulham', 'Nottingham Forest', 'Sheffield United', 'Wolves',
    ],
  },
  {
    name: 'La Liga',
    flag: '🇪🇸',
    clubs: [
      'Athletic Club', 'Atlético Madrid', 'Barcelona', 'Celta Vigo',
      'Deportivo La Coruña', 'Real Betis', 'Real Madrid', 'Real Sociedad',
      'Sevilla', 'Valencia', 'Villarreal', 'Espanyol', 'Getafe',
      'Osasuna', 'Málaga', 'Racing Santander',
    ],
  },
  {
    name: 'Bundesliga',
    flag: '🇩🇪',
    clubs: [
      'Bayer Leverkusen', 'Bayern Munich', 'Borussia Dortmund',
      'Borussia Mönchengladbach', 'Eintracht Frankfurt', 'Hamburger SV',
      'Hertha BSC', 'RB Leipzig', 'Schalke 04', 'VfB Stuttgart',
      'VfL Wolfsburg', 'Werder Bremen', 'Bochum', 'Karlsruher SC',
    ],
  },
  {
    name: 'Serie A',
    flag: '🇮🇹',
    clubs: [
      'AC Milan', 'AS Roma', 'Atalanta', 'Fiorentina', 'Inter Milan',
      'Juventus', 'Lazio', 'Napoli', 'Parma', 'Sampdoria',
      'Torino', 'Udinese', 'Bologna', 'Cagliari', 'Genoa',
    ],
  },
  {
    name: 'Ligue 1',
    flag: '🇫🇷',
    clubs: [
      'Bordeaux', 'Lens', 'Lille', 'Lyon', 'Marseille',
      'Monaco', 'Montpellier', 'Nice', 'Paris Saint-Germain',
      'Rennes', 'Saint-Étienne', 'Strasbourg',
    ],
  },
]
