'use client'

import { useState } from 'react'
import { apps } from '@/data/apps'
import SoukScene from './SoukScene'

// ─── NPC definitions ────────────────────────────────────────────────────────

const NPCS = [
  {
    id: 'ssalem',
    emoji: '🐍',
    name: 'Sssalem',
    title: 'Holiday Planner',
    position: { bottom: '38%', left: '6%' },
    dialogues: [
      'Yesss… I know exactly where you should go. Follow the sssun.',
      'A hat for the journey? The ssshop is just down the street.',
      'Every holiday needsss a destination. And a sssnake.',
      'You look lossst. Good. That isss when the real trip beginsss.',
    ],
  },
  {
    id: 'achilles',
    emoji: '🩺',
    name: 'Dr. Achilles',
    title: 'Physio Vendor',
    position: { bottom: '38%', right: '6%' },
    dialogues: [
      'Phase 1 complete? No? Then rest. Doctor\'s orders.',
      'The tendon does not care about your schedule.',
      'Ice. Stretch. Log. Repeat. Also buy a hat.',
      'Pain is data. Have you logged it today?',
    ],
  },
  {
    id: 'merchant',
    emoji: '🎩',
    name: 'The Merchant',
    title: 'Hat Emporium',
    position: { bottom: '18%', left: '50%', transform: 'translateX(-50%)' },
    dialogues: [
      'You came all this way and you\'re not buying a hat?',
      'Two words. Embroidered. Cap.',
      'Every great app deserves an ironic hat. This is known.',
      'The hat finds its owner. Are you its owner?',
    ],
  },
  {
    id: 'madame',
    emoji: '🔮',
    name: 'Madame Randomorium',
    title: 'Soothsayer',
    position: { bottom: '55%', left: '50%', transform: 'translateX(-50%)' },
    dialogues: [
      'I see… an app idea. And a hat. Mostly a hat.',
      'The stars say you have not checked your Achilles log today.',
      'Your holiday is coming. Sssalem already knows.',
      'All roads lead to shop.randomorium.ai. It is written.',
    ],
  },
]

// ─── App → stall mapping ─────────────────────────────────────────────────────

const APP_VENDORS: Record<string, { color: string; items: string[]; npcId: string }> = {
  'holiday-bazaar': {
    color: '#C0392B',
    items: ['🗺️', '🧭', '✈️', '🏖️'],
    npcId: 'ssalem',
  },
  achilles: {
    color: '#3A7CA5',
    items: ['🦵', '🩹', '🏃', '📋'],
    npcId: 'achilles',
  },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NPC({ npc }: { npc: (typeof NPCS)[0] }) {
  const [dialogueIdx, setDialogueIdx] = useState(0)
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    if (!open) {
      setOpen(true)
    } else {
      setDialogueIdx((i) => (i + 1) % npc.dialogues.length)
    }
  }

  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer select-none z-20"
      style={npc.position as React.CSSProperties}
      onClick={handleClick}
    >
      {open && (
        <div className="relative mb-2 max-w-[160px]">
          <div
            className="bg-white rounded-xl px-3 py-2 text-xs text-zinc-800 shadow-lg leading-snug text-center"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            {npc.dialogues[dialogueIdx]}
          </div>
          {/* speech bubble tail */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
        </div>
      )}
      <div className="text-3xl drop-shadow-md hover:scale-110 transition-transform">
        {npc.emoji}
      </div>
      <div className="mt-1 text-center">
        <div className="text-white text-[10px] font-bold drop-shadow">{npc.name}</div>
        <div className="text-amber-200 text-[9px] drop-shadow">{npc.title}</div>
      </div>
      {!open && (
        <div className="text-[8px] text-amber-300 mt-0.5 animate-pulse">tap to talk</div>
      )}
      {open && (
        <div className="text-[8px] text-amber-300 mt-0.5">tap for more</div>
      )}
    </div>
  )
}

function SoukStall({ app }: { app: (typeof apps)[0] }) {
  const vendor = APP_VENDORS[app.slug]
  const awningColor = vendor?.color ?? '#8B4513'
  const items = vendor?.items ?? ['🛍️', '✨']

  return (
    <a
      href={app.url}
      target={app.url.startsWith('http') ? '_blank' : undefined}
      rel={app.url.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="block group"
    >
      {/* Awning stripes */}
      <div
        className="h-8 rounded-t-lg overflow-hidden"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            ${awningColor} 0px,
            ${awningColor} 18px,
            #F5DEB3 18px,
            #F5DEB3 26px
          )`,
          boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
        }}
      />
      {/* Stall body */}
      <div
        className="rounded-b-lg p-4 group-hover:brightness-95 transition-all"
        style={{ background: '#FDF6E3', border: `2px solid ${awningColor}`, borderTop: 'none' }}
      >
        <div className="flex gap-2 mb-3 text-xl">
          {items.map((item, i) => (
            <span key={i} className="drop-shadow-sm">{item}</span>
          ))}
        </div>
        <div className="font-bold text-zinc-900 text-sm mb-1">{app.name}</div>
        <p className="text-xs text-zinc-600 leading-relaxed mb-3">{app.description}</p>
        <div
          className="text-[10px] italic border-t pt-2 text-zinc-500"
          style={{ borderColor: `${awningColor}40` }}
        >
          🎩 {app.hatHook}
        </div>
      </div>
    </a>
  )
}

// ─── Views ───────────────────────────────────────────────────────────────────

function NormalHome({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      <header className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-sm font-medium tracking-tight">randomorium.ai</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onEnter}
            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors border border-zinc-200 px-3 py-1.5 rounded-full hover:border-zinc-400"
          >
            🎪 enter the bazaar
          </button>
          <a
            href="https://shop.randomorium.ai"
            className="text-xs bg-black text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            buy a hat →
          </a>
        </div>
      </header>

      <main className="flex-1 px-6 py-20 max-w-3xl mx-auto w-full">
        <p className="font-mono text-xs text-zinc-400 mb-3">est. 2025</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 mb-4">
          random apps.<br />ironic hats.
        </h1>
        <p className="text-zinc-500 text-base max-w-md leading-relaxed mb-16">
          We build whatever seems funny. Every app is a thin excuse to sell you an embroidered cap.
        </p>

        <section>
          <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-6">
            the apps
          </h2>
          {apps.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-xl p-10 text-center">
              <p className="text-zinc-400 text-sm">apps loading... check back soon.</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {apps.map((app) => (
                <li key={app.slug}>
                  <a
                    href={app.url}
                    target={app.url.startsWith('http') ? '_blank' : undefined}
                    rel={app.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group block border border-zinc-100 rounded-xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-zinc-900">{app.name}</span>
                      <span className="text-xs text-zinc-400 font-mono">by {app.author}</span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{app.description}</p>
                    <p className="text-xs text-zinc-400 italic border-t border-zinc-100 pt-3">
                      🎩 {app.hatHook}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-24 border border-zinc-100 rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-mono text-zinc-400 mb-1">the real reason this exists</p>
            <h3 className="text-lg font-semibold text-zinc-900">Buy an ironic hat.</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Embroidered caps. Two-word phrases. Free shipping of dignity not included.
            </p>
          </div>
          <a
            href="https://shop.randomorium.ai"
            className="shrink-0 bg-black text-white text-sm px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors"
          >
            shop now →
          </a>
        </section>
      </main>

      <footer className="border-t border-zinc-100 px-6 py-6 text-xs text-zinc-400 font-mono flex justify-between">
        <span>randomorium.ai</span>
        <span>harry · matt · sol</span>
      </footer>
    </div>
  )
}

function SoukView({ onExit }: { onExit: () => void }) {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-[family-name:var(--font-geist-sans)]"
      style={{
        background: 'linear-gradient(180deg, #7B2D00 0%, #C8600A 12%, #E8892A 35%, #D4752A 70%, #8B4513 100%)',
      }}
    >
      {/* Overhead canopy stripes */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-10"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            #C0392B 0px, #C0392B 40px,
            #F39C12 40px, #F39C12 80px,
            #2ECC71 80px, #2ECC71 120px,
            #3498DB 120px, #3498DB 160px,
            #9B59B6 160px, #9B59B6 200px
          )`,
          opacity: 0.85,
        }}
      />

      {/* Exit button */}
      <button
        onClick={onExit}
        className="fixed top-4 right-4 z-50 bg-black/70 text-white text-xs px-4 py-2 rounded-full hover:bg-black transition-colors backdrop-blur-sm"
      >
        ← leave the souk
      </button>

      {/* Header */}
      <div className="relative z-10 pt-20 pb-6 text-center">
        <div className="flex justify-center gap-6 text-3xl mb-3">
          <span>🏮</span>
          <span>🏮</span>
          <span>🏮</span>
        </div>
        <h1 className="text-3xl font-bold text-white drop-shadow-lg tracking-wide">
          Randomorium Bazaar
        </h1>
        <p className="text-amber-200 text-lg mt-1 drop-shadow" style={{ fontFamily: 'serif' }}>
          سوق العشوائية
        </p>
        <p className="text-amber-100/70 text-xs mt-2 font-mono">est. 2025 · somewhere in the medina</p>
      </div>

      {/* Street scene */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-32">

        {/* Stalls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {apps.map((app) => (
            <SoukStall key={app.slug} app={app} />
          ))}
        </div>

        {/* Street perspective hint */}
        <div className="relative flex justify-center my-6">
          <div
            className="w-full max-w-xs h-32 opacity-20"
            style={{
              background: 'linear-gradient(180deg, #8B4513 0%, #D2691E 100%)',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-px h-full border-l-2 border-dashed border-amber-200/40" />
          </div>
        </div>

        {/* Hat Shop stall — prominent at end of street */}
        <div className="mb-12">
          <div className="text-center mb-3">
            <span className="text-amber-200 text-xs font-mono uppercase tracking-widest">
              ✦ the destination ✦
            </span>
          </div>
          <a
            href="https://shop.randomorium.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="block group max-w-md mx-auto"
          >
            {/* Gold/black awning */}
            <div
              className="h-10 rounded-t-xl overflow-hidden"
              style={{
                background: `repeating-linear-gradient(
                  90deg,
                  #111 0px, #111 20px,
                  #F0B429 20px, #F0B429 30px
                )`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            />
            <div
              className="rounded-b-xl p-6 text-center group-hover:brightness-95 transition-all"
              style={{ background: '#1a1a1a', border: '2px solid #F0B429', borderTop: 'none' }}
            >
              <div className="text-4xl mb-2">🎩</div>
              <div className="text-yellow-400 font-bold text-lg mb-1">The Hat Emporium</div>
              <p className="text-zinc-400 text-sm mb-3">
                Embroidered caps. Two-word phrases.<br />Free shipping of dignity not included.
              </p>
              <span className="inline-block bg-yellow-400 text-black text-xs font-bold px-5 py-2 rounded-full">
                shop now →
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* NPCs */}
      {NPCS.map((npc) => (
        <NPC key={npc.id} npc={npc} />
      ))}

      {/* Arch footer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: '80px' }}
      >
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,80 L0,40 Q180,0 360,40 Q540,80 720,40 Q900,0 1080,40 Q1260,80 1440,40 L1440,80 Z"
            fill="#7B2D00"
            opacity="0.9"
          />
          <path
            d="M0,80 L0,50 Q180,15 360,50 Q540,85 720,50 Q900,15 1080,50 Q1260,85 1440,50 L1440,80 Z"
            fill="#5C1F00"
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-3">
          <span className="text-amber-200/50 text-xs font-mono">randomorium.ai</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [isSouk, setIsSouk] = useState(false)

  return isSouk
    ? <SoukScene onExit={() => setIsSouk(false)} />
    : <NormalHome onEnter={() => setIsSouk(true)} />
}
