'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { apps } from '@/data/apps'

// ─── Scene data ──────────────────────────────────────────────────────────────

const SCENE_W = 1100

interface HotspotDef {
  id: string
  label: string
  x: number; y: number; w: number; h: number
  icon: string
  name: string
  desc: string
  hatHook: string
  url?: string
  talk: string[]
  npc?: boolean
}

// Map apps to scene positions
const appMap: Record<string, { x:number; y:number; w:number; h:number; label:string }> = {
  'holiday-bazaar': { x:0,   y:'12%' as unknown as number, w:296, h:200, label:"MOKHTAR'S BABOUCHE EMPORIUM" },
  'achilles':       { x:680, y:'12%' as unknown as number, w:280, h:240, label:"DR ACHILLES PHYSIO SOUK"     },
}

const HOTSPOTS: HotspotDef[] = [
  // ── LEFT stalls ──
  {
    id:'holiday', label:"SSSALEM'S HOLIDAY BAZAAR", x:0, y:90, w:300, h:290,
    icon:'🗺️', name:'Holiday Bazaar',
    desc:'Plan a group holiday with a snake charmer salesman. Sssalem knows every route, every detour, every unreliable ferry.',
    hatHook:"Sssalem recommends a holiday hat before you travel",
    url: apps.find(a=>a.slug==='holiday-bazaar')?.url,
    talk:[
      "Sssalem: 'Yesss... I know exactly where you should go. Follow the sssun.'",
      "Sssalem: 'Every holiday needsss a destination. And a sssnake. The sssnake is non-negotiable.'",
      "Sssalem: 'A hat for the journey? The sssshop is just around the corner.'",
      "You study the map. It has seventeen destinations circled. Thirteen have snakes drawn on them.",
    ],
  },
  {
    id:'compass', label:"COMPASS & MAP STALL", x:0, y:340, w:200, h:130,
    icon:'🧭', name:'Navigation Goods',
    desc:'Compasses that point to adventure. Maps of places that no longer exist. Guides to places that never did.',
    hatHook:"The Wanderer's Cap — worn brim, compass-rose embroidered, magnetically north-biased",
    talk:[
      "Three compasses spin gently. They are not pointing north. They have opinions.",
      "The map on the back wall shows a route from here to somewhere unspecified. The route is very long.",
      "You pick up a compass. It immediately points at the hat stall. You put it down respectfully.",
    ],
  },
  {
    id:'spice', label:"HASSAN'S SPICE STALL", x:200, y:90, w:230, h:250,
    icon:'🌶️', name:"Hassan's Spice Corner",
    desc:'Thirty-six spices. Hassan identifies every one blindfolded. He has identified yours already.',
    hatHook:"The Saffron Turban — hand-dyed in Fès, woven from thirty-six spice dreams",
    talk:[
      "Hassan: 'Ras el hanout. Thirty-six spices. My machine identifies in 0.3 seconds. I still win on soul.'",
      "A pinch of something orange is offered. Your sinuses file ecstatic paperwork.",
      "The smoke from the brazier has been drifting left for seventeen minutes. This is considered normal.",
    ],
  },
  // ── RIGHT stalls ──
  {
    id:'achilles', label:"DR ACHILLES PHYSIO SOUK", x:680, y:90, w:140, h:310,
    icon:'🦵', name:'Achilles Rebuild',
    desc:'Logging the road back to 5km — 9 months of physio, one tendon at a time. Phase 1 is harder than it looks.',
    hatHook:"Complete Phase 1 and you've earned the 'Limping Forward' cap",
    url: apps.find(a=>a.slug==='achilles')?.url,
    talk:[
      "Dr. Achilles: 'Phase 1 complete? No? Then rest. Doctor's orders.'",
      "Dr. Achilles: 'The tendon does not care about your schedule.'",
      "A foam roller sits on the counter. It has been used. It has opinions about knees.",
      "Dr. Achilles: 'Ice. Stretch. Log. Repeat. Also, buy a hat. Dignity aids recovery.'",
    ],
  },
  {
    id:'lamps', label:"OMAR'S LAMP EMPORIUM", x:820, y:90, w:130, h:240,
    icon:'🏮', name:"Omar's Lamps",
    desc:'Every lamp reads your emotional state and adjusts its glow. The blue one is concerned about you.',
    hatHook:"The Brass Filigreed Cap — perforated dome, dramatic shadow effects, three glow settings",
    talk:[
      "Omar: 'The blue lamp has been watching you since you entered. It seems concerned.'",
      "Omar holds a lamp up. Your shadow becomes extremely dramatic.",
      "Omar: 'This one was in a palace in Fès for forty years. Now it is here. Everything travels.'",
      "You stare into the amber lamp. It stares back with warm, unblinking judgment.",
    ],
  },
  {
    id:'hats', label:"THE HAT EMPORIUM", x:435, y:108, w:230, h:180,
    icon:'🎩', name:'The Hat Emporium',
    desc:'Every app leads here. Every stall points here. This is the reason the alley exists.',
    hatHook:"Two words. Embroidered. Cap.",
    url:'https://shop.randomorium.ai',
    talk:[
      "The Merchant: 'You came all this way and you are not buying a hat?'",
      "The Merchant: 'Every great app deserves an ironic hat. This is known.'",
      "The Merchant: 'The hat finds its owner. Are you its owner?'",
      "The Merchant: 'Two words. Embroidered. Cap. This is the entire pitch.'",
    ],
  },
  // ── NPCs ──
  {
    id:'npc_ssalem', label:"SSSALEM THE SNAKE VENDOR", x:92, y:'44%' as unknown as number, w:68, h:150,
    icon:'🐍', name:'Sssalem',
    desc:"Thirty years planning holidays from this stall. The snake has been with him for twelve. They are business partners.",
    hatHook:"The Serpent Sombrero — Sssalem's personal recommendation. He is never wrong.",
    npc:true,
    talk:[
      "Sssalem: 'Every great holiday begins with a sssingle step. And a sssnake.'",
      "Sssalem: 'I have planned forty-seven thousand holidays. Not one regret. The sssnake has two.'",
      "Sssalem: 'Come. Sit. We talk. You leave with a holiday and possibly a hat.'",
      "Sssalem, to the snake: 'See? Another one. I told you. They always come.'",
    ],
  },
  {
    id:'npc_achilles', label:"DR ACHILLES THE PHYSIO", x:820, y:'52%' as unknown as number, w:56, h:150,
    icon:'🩺', name:'Dr. Achilles',
    desc:'Has completed Phase 3 of his own rehabilitation programme. Is on Phase 4. Phase 4 is very hard.',
    hatHook:"The Physio's Cap — padded brim, ice-pack lining, motivational text on the inside",
    npc:true,
    talk:[
      "Dr. Achilles: 'Ah. You have an Achilles question. Sit.'",
      "Dr. Achilles: 'Pain is data. Have you logged it today? No? Log it now. I will wait.'",
      "Dr. Achilles: 'Phase 3 took me six weeks. Phase 4 is taking longer. Do not tell my patients.'",
      "Dr. Achilles: 'The tendon heals when it heals. You cannot negotiate with tendons.'",
    ],
  },
  {
    id:'npc_gerald', label:"GERALD FROM SWINDON", x:500, y:220, w:46, h:150,
    icon:'🎒', name:'Gerald from Swindon',
    desc:'Has been in this exact spot for 52 minutes. Has ordered a rug while standing here. Is at peace.',
    hatHook:"The Tourist Beige — Gerald's hat. His. Not for sale. He is wearing it.",
    npc:true,
    talk:[
      "Gerald: 'The right side is completely different now. When did that happen?'",
      "Gerald: 'I have been here 52 minutes. I have ordered a rug. It is being delivered.'",
      "Gerald: 'There are three stalls on the right. I can only see two from here. I accept this.'",
      "Gerald, quietly: 'One of those bags has been watching me for half an hour.'",
    ],
  },
  {
    id:'npc_cat', label:"THE SOUK CAT", x:530, y:390, w:48, h:50,
    icon:'🐈', name:'The Souk Cat',
    desc:'Geometric centre of the alley. Has occupied this position for eleven years. Non-negotiable.',
    hatHook:"The Cat Does Not Wear Hats — the cat IS the hat",
    npc:true,
    talk:[
      "The cat is exactly in your path. The cat knows. The cat does not adjust.",
      "You step over the cat. Three seconds of petting. Withdrawal. The cat resumes its position.",
      "The cat has seen every tourist, every merchant, every lamp. The cat has opinions about all of them.",
      "The cat blinks once, slowly. This is either affection or a threat assessment.",
    ],
  },
]

const AMBIENT = [
  ["The alley has two sides. Both sides are watching you.","NARRATOR"],
  ["Babouches on the left, a physio chart on the right, the hat stall dead ahead.","NARRATOR"],
  ["Sssalem: 'The snake likes you. This is a good sign. Usually.'","SSSALEM"],
  ["Gerald has been in the same spot for 52 minutes. He is ordering another thing.","NARRATOR"],
  ["Dr. Achilles: 'Are your hamstrings tight? They look tight from here.'","DR. ACHILLES"],
  ["The cat is between the left stall and the right stall. The cat has assessed both.","NARRATOR"],
  ["The lamps are pulsing. They know something you don't.","NARRATOR"],
  ["A moped appears from the vanishing point. It passes with millimetres to spare. This is normal.","NARRATOR"],
  ["Sssalem: 'Every destination begins with an ironic hat. This is statistically proven.'","SSSALEM"],
  ["The spice smoke has reached the lamp stall. Omar says it's good for business.","NARRATOR"],
  ["The Merchant: 'The hat is already waiting. It has always been waiting.'","THE MERCHANT"],
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function SoukScene({ onExit }: { onExit: () => void }) {
  const [verb, setVerb] = useState('Look at')
  const [dialogue, setDialogue] = useState({ who: 'NARRATOR', line: 'Three stalls. Two sides. One alley. The hats are at the end.' })
  const [modal, setModal] = useState<HotspotDef | null>(null)
  const [hovered, setHovered] = useState('')
  const ambIdx = useRef(0)
  const dragRef = useRef({ active: false, startX: 0, startWX: 0, lx: 0, lt: 0, vel: 0 })
  const worldRef = useRef<HTMLDivElement>(null)
  const wxRef = useRef(0)

  // Load VT323 font
  useEffect(() => {
    if (!document.getElementById('vt323-font')) {
      const link = document.createElement('link')
      link.id = 'vt323-font'
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap'
      document.head.appendChild(link)
    }
  }, [])

  // Ambient messages
  useEffect(() => {
    const t = setInterval(() => {
      if (!modal) {
        const [line, who] = AMBIENT[ambIdx.current % AMBIENT.length]
        setDialogue({ who, line })
        ambIdx.current++
      }
    }, 6200)
    return () => clearInterval(t)
  }, [modal])

  const maxScroll = useCallback(() => -(SCENE_W - (typeof window !== 'undefined' ? window.innerWidth : 1100)), [])

  const applyX = useCallback((x: number) => {
    const clamped = Math.max(maxScroll(), Math.min(0, x))
    wxRef.current = clamped
    if (worldRef.current) worldRef.current.style.transform = `translateX(${clamped}px)`
  }, [maxScroll])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-hs]')) return
    dragRef.current = { active: true, startX: e.clientX, startWX: wxRef.current, lx: e.clientX, lt: Date.now(), vel: 0 }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d.active) return
    applyX(d.startWX + e.clientX - d.startX)
    const now = Date.now(), dt = now - d.lt
    if (dt > 0) d.vel = (e.clientX - d.lx) / dt * 16
    d.lx = e.clientX; d.lt = now
  }, [applyX])

  const onPointerUp = useCallback(() => {
    const d = dragRef.current; if (!d.active) return; d.active = false
    const momentum = () => { d.vel *= 0.90; if (Math.abs(d.vel) < 0.4) return; applyX(wxRef.current + d.vel); requestAnimationFrame(momentum) }
    requestAnimationFrame(momentum)
  }, [applyX])

  const tap = (hs: HotspotDef) => {
    // eslint-disable-next-line react-hooks/purity
    const line = hs.talk[Math.floor(Math.random() * hs.talk.length)]
    if (verb === 'Talk to' || hs.npc) {
      setDialogue({ who: hs.name.toUpperCase(), line })
      if (hs.npc) return
    }
    setDialogue({ who: hs.name.toUpperCase(), line })
    setModal(hs)
  }

  return (
    <div
      style={{ fontFamily: "'VT323', monospace", background: '#0c0703', color: '#f0d080', userSelect: 'none', WebkitUserSelect: 'none' }}
      className="fixed inset-0 flex flex-col"
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{
        background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.07) 2px,rgba(0,0,0,.07) 4px)',
      }} />

      {/* Exit */}
      <button
        onClick={onExit}
        className="fixed top-3 right-3 z-50 text-sm px-4 py-1"
        style={{ fontFamily: "'VT323', monospace", background: '#5a1a08', border: '2px solid #8a3010', color: '#f0d080', letterSpacing: 2 }}
      >
        ← LEAVE THE SOUK
      </button>

      {/* Hovered label bar */}
      <div className="fixed z-30 pointer-events-none text-center" style={{ top: 'calc(100vh - 142px)', left: 0, right: 0, height: 20, background: 'rgba(8,4,1,.85)', fontSize: 15, color: '#ff9a20', letterSpacing: 2, lineHeight: '20px' }}>
        {hovered ? `${verb} ${hovered}` : ''}
      </div>

      {/* Scrollable world */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div ref={worldRef} style={{ position: 'absolute', top: 0, left: 0, width: SCENE_W, height: '100%' }}>

          {/* ── SVG Scene ── */}
          <svg
            viewBox="0 0 1100 600"
            preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', top: 0, left: 0, width: SCENE_W, height: '100%', display: 'block' }}
            shapeRendering="crispEdges"
          >
            <defs>
              <linearGradient id="skg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7a4a02"/><stop offset="45%" stopColor="#bc7806"/>
                <stop offset="85%" stopColor="#dca41e"/><stop offset="100%" stopColor="#f2c838"/>
              </linearGradient>
              <radialGradient id="vpg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff8b0" stopOpacity="1"/>
                <stop offset="42%" stopColor="#ffc030" stopOpacity=".88"/>
                <stop offset="100%" stopColor="#e08010" stopOpacity="0"/>
              </radialGradient>
              <filter id="b2"><feGaussianBlur stdDeviation="2"/></filter>
              <filter id="b4"><feGaussianBlur stdDeviation="4"/></filter>
              <filter id="b7"><feGaussianBlur stdDeviation="7"/></filter>
              <style>{`
                @keyframes sw{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
                @keyframes sw2{0%,100%{transform:rotate(2deg)}50%{transform:rotate(-3deg)}}
                @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
                @keyframes flk{0%,97%,100%{opacity:1}98.5%{opacity:.87}}
                @keyframes lmpa{0%,100%{opacity:.6}50%{opacity:1}}
                @keyframes smk{0%{transform:translateY(0)scaleX(1);opacity:.45}100%{transform:translateY(-36px)scaleX(3.5);opacity:0}}
                .sw{transform-origin:top center;animation:sw 2.6s ease-in-out infinite;}
                .sw2{transform-origin:top center;animation:sw2 2.1s ease-in-out infinite .3s;}
                .bob{animation:bob 1.8s ease-in-out infinite;}
                .lmp{animation:lmpa 2.2s ease-in-out infinite;}
                .lmp2{animation:lmpa 1.8s ease-in-out infinite .6s;}
                .smk{animation:smk 2.6s ease-out infinite;}
              `}</style>
            </defs>

            {/* Sky / VP */}
            <polygon points="408,0 692,0 666,108 434,108" fill="url(#skg)"/>
            <ellipse cx="550" cy="108" rx="100" ry="60" fill="url(#vpg)" filter="url(#b7)" opacity=".96"/>
            <ellipse cx="550" cy="108" rx="38" ry="23" fill="#fff8c0" opacity=".94" filter="url(#b4)"/>

            {/* Walls */}
            <polygon points="0,0 434,0 434,600 0,600" fill="#b05c2a"/>
            <polygon points="0,0 36,0 36,600 0,600" fill="#7a3610" opacity=".65"/>
            <polygon points="666,0 1100,0 1100,600 666,600" fill="#a85420"/>
            <polygon points="1064,0 1100,0 1100,600 1064,600" fill="#7a3610" opacity=".65"/>

            {/* Floor */}
            <polygon points="0,600 1100,600 666,108 434,108" fill="#b08828"/>
            <polygon points="426,108 674,108 730,600 370,600" fill="#ecc840" opacity=".1"/>
            {/* Floor lines */}
            {[212,278,354,440,520].map(y=>(
              <polygon key={y} points={`0,${y} 1100,${y} 1100,${y+7} 0,${y+7}`} fill="#886010" opacity=".48"/>
            ))}
            <line x1="550" y1="108" x2="0" y2="600" stroke="#886010" strokeWidth="1.5" opacity=".36"/>
            <line x1="550" y1="108" x2="275" y2="600" stroke="#886010" strokeWidth="1" opacity=".2"/>
            <line x1="550" y1="108" x2="550" y2="600" stroke="#886010" strokeWidth="1" opacity=".14"/>
            <line x1="550" y1="108" x2="825" y2="600" stroke="#886010" strokeWidth="1" opacity=".2"/>
            <line x1="550" y1="108" x2="1100" y2="600" stroke="#886010" strokeWidth="1.5" opacity=".36"/>
            {/* Cobbles */}
            {[0,53,106,159,212,265,318,371,424,477,530,583,636,689,742,795,848,901,954,1007].map((x,i)=>(
              <rect key={x} x={x} y={448} width={50} height={44} fill={i%2===0?"#a07818":"#886008"} opacity={i%2===0?.27:.22}/>
            ))}
            {/* Dapple light */}
            <ellipse cx="50" cy="504" rx="26" ry="10" fill="#f8d040" opacity=".28"/>
            <ellipse cx="268" cy="464" rx="17" ry="7" fill="#f8d040" opacity=".23"/>
            <ellipse cx="550" cy="408" rx="7" ry="3" fill="#f8d040" opacity=".12"/>
            <ellipse cx="832" cy="464" rx="17" ry="7" fill="#f8d040" opacity=".23"/>
            <ellipse cx="1050" cy="504" rx="26" ry="10" fill="#f8d040" opacity=".28"/>

            {/* Reed ceiling */}
            <polygon points="0,0 434,0 550,108 0,144" fill="#6e3e06"/>
            <polygon points="1100,0 666,0 550,108 1100,144" fill="#6e3e06"/>
            <polygon points="0,144 460,114 460,130 0,160" fill="#5a3004" opacity=".78"/>
            <polygon points="1100,144 640,114 640,130 1100,160" fill="#5a3004" opacity=".78"/>
            {/* Reed radials */}
            {[10,33,60,90,124,162,202].map((y,i)=>(
              <line key={`rl${y}`} x1="550" y1="108" x2="0" y2={y} stroke="#481e04" strokeWidth={i<2?2.5:2} opacity={.68-i*.04}/>
            ))}
            {[10,33,60,90,124,162,202].map((y,i)=>(
              <line key={`rr${y}`} x1="550" y1="108" x2="1100" y2={y} stroke="#481e04" strokeWidth={i<2?2.5:2} opacity={.68-i*.04}/>
            ))}
            {/* Cross reeds */}
            {[4,16,30,46,65,87,112].map(y=>(
              <polygon key={y} points={`0,${y} 1100,${y} 1100,${y+4} 0,${y+4}`} fill="#341402" opacity=".65"/>
            ))}
            {/* Skylights */}
            <polygon points="140,0 260,0 318,84 182,88" fill="#c89020" opacity=".56"/>
            <polygon points="146,0 254,0 312,81 188,85" fill="#fff4a8" opacity=".32"/>
            <polygon points="840,0 960,0 918,88 782,84" fill="#c89020" opacity=".56"/>
            <polygon points="846,0 954,0 912,85 788,81" fill="#fff4a8" opacity=".32"/>

            {/* ══ LEFT — HOLIDAY BAZAAR stall ══ */}
            {/* Main beam */}
            <polygon points="0,100 436,58 436,72 0,116" fill="#301404"/>
            <polygon points="0,98 436,56 436,62 0,102" fill="#7a3808"/>
            <polygon points="0,100 11,100 13,600 0,600" fill="#240e02"/>
            <polygon points="177,90 189,90 191,470 175,472" fill="#240e02"/>
            {/* Awning — teal/blue for travel */}
            <polygon points="0,102 434,60 434,66 0,108" fill="#240e02"/>
            {/* Hanging maps / travel goods — big */}
            {/* Map scroll 1 */}
            <rect x="7" y="108" width="6" height="32" fill="#482004"/>
            <polygon points="-2,140 36,140 38,188 -4,188" fill="#c8a040" className="sw"/>
            <rect x="-1" y="176" width="38" height="5" fill="#8a6010"/>
            <rect x="-2" y="150" width="38" height="3" fill="#7a5010"/><rect x="-2" y="162" width="38" height="3" fill="#7a5010"/>
            {/* Compass hanging */}
            <rect x="32" y="106" width="5" height="30" fill="#482004"/>
            <circle cx="42" cy="148" r="18" fill="#c07020" className="sw2"/>
            <circle cx="42" cy="148" r="13" fill="#e8c040" className="sw2"/>
            <rect x="35" y="145" width="14" height="3" fill="#300800" className="sw2"/>
            <rect x="41" y="139" width="3" height="14" fill="#300800" className="sw2"/>
            {/* Globe */}
            <rect x="62" y="104" width="5" height="28" fill="#482004"/>
            <circle cx="74" cy="144" r="16" fill="#1a6090" className="sw"/>
            <ellipse cx="74" cy="144" rx="16" ry="5" fill="none" stroke="#40a8d0" strokeWidth="1.5" className="sw"/>
            <line x1="74" y1="128" x2="74" y2="160" stroke="#40a8d0" strokeWidth="1" className="sw"/>
            {/* Small maps receding */}
            {[88,102,115,127,138,148,157,166,174,181,188,194].map((x,i)=>{
              const h = 22-i*1.5; const w2 = 14-i*0.8
              return <polygon key={x} points={`${x-w2/2},${104-i*.5} ${x+w2/2},${104-i*.5} ${x+w2/2+1},${104-i*.5+h} ${x-w2/2-1},${104-i*.5+h}`} fill={['#c8a040','#b81810','#346016','#c08828'][i%4]} className={['sw','sw2','sw','sw2'][i%4]}/>
            })}
            {/* Left stall counter */}
            <polygon points="0,350 430,312 430,330 0,370" fill="#5a3004"/>
            <polygon points="0,348 430,310 430,318 0,352" fill="#9a5c18"/>
            {/* Items on counter — travel */}
            <polygon points="8,318 32,315 34,350 6,353" fill="#c8a040"/>{/* map */}
            <polygon points="12,318 28,315 30,346 10,349" fill="#e8c060"/>
            <circle cx="50" cy="320" r="10" fill="#c07020"/>{/* compass */}
            <circle cx="50" cy="320" r="7" fill="#e8c040"/>
            <polygon points="40,60 100,56 98,130 38,134" fill="#183870" opacity=".6"/>{/* upper shelf = luggage */}
            <polygon points="44,60 96,56 94,126 42,130" fill="#244898" opacity=".4"/>
            {/* Bag hanging left */}
            <rect x="80" y="86" width="4" height="28" fill="#482004"/>
            <polygon points="72,114 98,114 100,170 70,170" fill="#8a1010" className="sw"/>
            <polygon points="75,114 95,114 97,166 73,166" fill="#aa2020" className="sw"/>
            {/* Snake basket on counter */}
            <ellipse cx="110" cy="332" rx="18" ry="8" fill="#8a5010"/>
            <ellipse cx="110" cy="327" rx="14" ry="10" fill="#a06020"/>
            {/* Snake coiled — Sssalem's snake */}
            <path d="M110,320 Q130,310 125,300 Q120,290 105,295 Q90,300 100,312" fill="none" stroke="#2a7020" strokeWidth="4"/>
            <circle cx="100" cy="312" r="5" fill="#1a5018"/>
            <polygon points="96,309 104,309 101,303 99,303" fill="#e83020" opacity=".8"/>{/* tongue */}

            {/* ══ LEFT — Sssalem the vendor (NPC) ══ */}
            {/* Body */}
            <polygon points="96,340 124,338 127,450 93,452" fill="#1a4a6a"/>
            <polygon points="99,340 121,338 123,410 97,412" fill="#2a5a7a"/>
            {/* Head */}
            <ellipse cx="110" cy="330" rx="14" ry="14" fill="#8a5020"/>
            {/* Hat — fez */}
            <polygon points="98,320 122,319 120,311 100,312" fill="#c8a010"/>
            <polygon points="100,312 120,311 119,305 101,306" fill="#d4b020"/>
            {/* Arms */}
            <polygon points="124,368 148,360 150,374 126,382" fill="#1a4a6a"/>
            <polygon points="93,372 70,365 68,378 92,384" fill="#1a4a6a"/>
            {/* Snake wrapped on arm */}
            <path d="M145,366 Q160,355 155,345 Q150,338 140,342" fill="none" stroke="#2a7020" strokeWidth="3"/>
            <circle cx="140" cy="342" r="4" fill="#1a5018"/>
            {/* Eyes */}
            <rect x="104" y="326" width="4" height="4" fill="#100802"/>
            <rect x="113" y="326" width="4" height="4" fill="#100802"/>
            {/* Legs */}
            <polygon points="97,450 108,450 107,498 96,498" fill="#1a4a6a"/>
            <polygon points="108,450 118,450 117,494 107,494" fill="#0e3a5a"/>
            <ellipse cx="101" cy="502" rx="8" ry="3.5" fill="#180c04"/>
            <ellipse cx="113" cy="498" rx="8" ry="3.5" fill="#180c04"/>

            {/* ══ SPICE STALL (Zone B left) ══ */}
            <polygon points="177,90 296,84 296,290 175,294" fill="#9a5420" opacity=".8"/>
            <polygon points="177,88 296,82 296,92 175,94" fill="#0e2448"/>
            {/* Spice jars/bowls */}
            <ellipse cx="200" cy="160" rx="14" ry="7" fill="#c83010"/>
            <polygon points="187,125 213,125 215,160 185,160" fill="#a82010"/>
            <ellipse cx="220" cy="155" rx="12" ry="6" fill="#e8a020"/>
            <polygon points="209,122 231,122 233,155 207,155" fill="#c88010"/>
            <ellipse cx="238" cy="150" rx="11" ry="5.5" fill="#30a840"/>
            <ellipse cx="253" cy="146" rx="10" ry="5" fill="#f0d020"/>
            <ellipse cx="268" cy="142" rx="9" ry="4.5" fill="#c83010"/>
            {/* Hassan spice vendor */}
            <polygon points="196,370 222,368 224,450 194,452" fill="#4a2a7a"/>
            <polygon points="199,370 219,368 221,415 197,417" fill="#5a3a8a"/>
            <ellipse cx="209" cy="361" rx="12" ry="12" fill="#7a4818"/>
            <polygon points="198,355 220,354 218,346 200,347" fill="#c8a010"/>
            <polygon points="200,347 218,346 217,340 201,341" fill="#d4b020"/>
            <ellipse cx="198" cy="368" rx="7" ry="4" fill="#382010" opacity=".6"/>
            {/* Smoke from brazier */}
            <ellipse cx="196" cy="172" rx="5" ry="11" fill="#e8e4b0" opacity=".26" className="smk" filter="url(#b2)"/>

            {/* ══ HAT EMPORIUM — end of street ══ */}
            {/* Building */}
            <polygon points="434,108 666,108 666,300 434,300" fill="#1a1a1a" opacity=".9"/>
            <polygon points="440,115 660,115 660,295 440,295" fill="#111"/>
            {/* Gold arch */}
            <path d="M450,220 Q550,140 650,220" fill="none" stroke="#f0b429" strokeWidth="3" opacity=".8"/>
            <path d="M452,222 Q550,144 648,222" fill="none" stroke="#f0b429" strokeWidth="1" opacity=".4"/>
            {/* Sign */}
            <rect x="470" y="150" width="160" height="40" fill="#f0b429" opacity=".15"/>
            <rect x="472" y="152" width="156" height="36" fill="none" stroke="#f0b429" strokeWidth="1" opacity=".5"/>
            {/* Giant hat SVG */}
            <ellipse cx="550" cy="200" rx="55" ry="12" fill="#f0b429" opacity=".9"/>
            <polygon points="505,200 595,200 585,165 515,165" fill="#111" stroke="#f0b429" strokeWidth="1.5"/>
            <ellipse cx="550" cy="165" rx="35" ry="9" fill="#111" stroke="#f0b429" strokeWidth="1.5"/>
            {/* Glow */}
            <ellipse cx="550" cy="175" rx="70" ry="50" fill="#f0b429" opacity=".08" filter="url(#b4)"/>
            {/* Merchant figure */}
            <polygon points="536,258 562,256 564,330 534,332" fill="#1a1a1a"/>
            <polygon points="539,258 559,256 561,302 537,304" fill="#2a2a2a"/>
            <ellipse cx="549" cy="249" rx="13" ry="13" fill="#c8a060"/>
            {/* Top hat on merchant */}
            <ellipse cx="549" cy="237" rx="16" ry="4" fill="#111"/>
            <polygon points="537,212 561,212 559,237 539,237" fill="#111"/>
            <ellipse cx="549" cy="212" rx="11" ry="4" fill="#222"/>
            <rect x="537" y="235" width="24" height="3" fill="#f0b429" opacity=".6"/>
            <polygon points="534,330 546,330 545,372 533,372" fill="#1a1a1a"/>
            <polygon points="546,330 556,330 555,368 545,368" fill="#111"/>

            {/* ══ RIGHT — ACHILLES REBUILD stall ══ */}
            <polygon points="666,100 1100,100 1100,116 664,118" fill="#301404"/>
            <polygon points="666,98 1100,98 1100,104 664,100" fill="#7a3808"/>
            <polygon points="1089,100 1100,100 1100,600 1087,600" fill="#240e02"/>
            {/* Awning — teal/blue */}
            <polygon points="666,102 820,74 820,82 666,108" fill="#1a3a6a"/>
            <polygon points="666,100 820,72 820,78 664,104" fill="#0e2448"/>
            {/* Awning stripes */}
            {[676,694,712,730,748,766,784,802].map(x=>(
              <polygon key={x} points={`${x},102 ${x+4},101 ${x+4},80 ${x},81`} fill="#2a5090" opacity=".45"/>
            ))}
            {/* Physio items hanging */}
            {/* Foam roller */}
            <rect x="672" y="108" width="4" height="26" fill="#482004"/>
            <ellipse cx="680" cy="148" rx="8" ry="18" fill="#3a7ca5" className="sw"/>
            <ellipse cx="680" cy="148" rx="5" ry="13" fill="#4a9cc5" className="sw"/>
            {/* Resistance bands */}
            <rect x="694" y="106" width="4" height="24" fill="#482004"/>
            <polygon points="686,130 708,130 710,182 684,182" fill="#c83010" className="sw2"/>
            <rect x="686" y="158" width="24" height="3" fill="#a02010"/>
            {/* Ice pack */}
            <rect x="714" y="105" width="3" height="22" fill="#482004"/>
            <polygon points="706,127 726,127 728,174 704,174" fill="#90c8e0" className="sw"/>
            <rect x="706" y="150" width="22" height="3" fill="#60a8c0"/>
            {/* Chart/diagram */}
            <rect x="730" y="104" width="3" height="20" fill="#482004"/>
            <polygon points="722,124 744,122 746,170 720,172" fill="#f0f0e0" className="sw2"/>
            {/* Lines on chart */}
            <rect x="724" y="134" width="18" height="2" fill="#888"/>
            <rect x="724" y="142" width="14" height="2" fill="#888"/>
            <rect x="724" y="150" width="16" height="2" fill="#888"/>
            <rect x="724" y="158" width="10" height="2" fill="#c83010"/>
            {/* More hanging items receding */}
            {[748,763,776,788,799,809].map((x,i)=>{
              const h = 38-i*5
              return <g key={x}>
                <rect x={x} y={103-i*.5} width={2.5-i*.1} height={18-i*1.5} fill="#482004"/>
                <polygon points={`${x-8+i},${121-i*.5} ${x+8-i},${121-i*.5} ${x+9-i},${121-i*.5+h} ${x-9+i},${121-i*.5+h}`} fill={['#3a7ca5','#c83010','#90c8e0','#c8a010','#6b8f71','#3a7ca5'][i]} className={['sw','sw2','sw','sw2','sw','sw2'][i]}/>
              </g>
            })}
            {/* Achilles stall upper shelf — physio kit */}
            <polygon points="1100,196 680,160 680,176 1100,214" fill="#4e2806"/>
            <polygon points="1100,194 680,158 680,165 1100,198" fill="#886018"/>
            {/* Items on upper shelf */}
            <ellipse cx="696" cy="165" rx="14" ry="6" fill="#3a7ca5"/>
            <polygon points="683,138 709,138 711,165 681,165" fill="#2a6c95"/>
            <ellipse cx="720" cy="162" rx="12" ry="5.5" fill="#c83010"/>
            <polygon points="709,136 731,136 733,162 707,162" fill="#a82010"/>
            <ellipse cx="740" cy="158" rx="11" ry="5" fill="#6b8f71"/>
            <ellipse cx="758" cy="154" rx="10" ry="4.5" fill="#90c8e0"/>
            {/* Achilles stall counter */}
            <polygon points="1100,418 680,376 680,400 1100,448" fill="#5a3004"/>
            <polygon points="1100,416 680,374 680,382 1100,420" fill="#9c5c18"/>
            {/* Items on counter */}
            <polygon points="684,382 708,378 709,408 683,412" fill="#3a7ca5"/>
            <polygon points="688,382 704,378 705,404 687,408" fill="#4a9cc5"/>
            <polygon points="712,377 734,374 735,402 711,406" fill="#c83010"/>
            <polygon points="738,373 758,370 759,398 737,402" fill="#6b8f71"/>
            {/* Physio chart on wall */}
            <polygon points="766,70 820,70 820,280 764,280" fill="#f0f0e0" opacity=".9"/>
            <rect x="770" y="80" width="46" height="3" fill="#333"/>
            {/* Stick figure (leg anatomy) */}
            <circle cx="793" cy="100" r="8" fill="#c8a060"/>
            <line x1="793" y1="108" x2="793" y2="145" stroke="#333" strokeWidth="2"/>
            <line x1="793" y1="125" x2="775" y2="140" stroke="#333" strokeWidth="2"/>
            <line x1="793" y1="125" x2="811" y2="140" stroke="#333" strokeWidth="2"/>
            <line x1="793" y1="145" x2="780" y2="175" stroke="#333" strokeWidth="2"/>
            <line x1="793" y1="145" x2="806" y2="175" stroke="#333" strokeWidth="2"/>
            <ellipse cx="783" cy="180" rx="5" ry="4" fill="#c83010" opacity=".7"/>
            <rect x="768" y="195" width="10" height="3" fill="#333"/>
            <rect x="768" y="205" width="35" height="2" fill="#888"/>
            <rect x="768" y="215" width="28" height="2" fill="#888"/>
            <rect x="768" y="225" width="32" height="2" fill="#888"/>
            <rect x="768" y="235" width="20" height="2" fill="#c83010"/>

            {/* ══ Dr. Achilles NPC ══ */}
            <polygon points="832,370 858,368 860,452 830,454" fill="#2a4a8a"/>
            <polygon points="835,370 855,368 857,415 833,417" fill="#3a5aa0"/>
            <ellipse cx="844" cy="361" rx="13" ry="13" fill="#8a5020"/>
            <polygon points="832,355 856,354 854,346 834,347" fill="#f0f0f0"/>{/* white coat */}
            <polygon points="834,347 854,346 853,340 835,341" fill="#e0e0e0"/>
            <ellipse cx="844" cy="362" rx="7" ry="4" fill="#382010" opacity=".6"/>
            <rect x="838" y="356" width="3.5" height="3.5" fill="#100802"/>
            <rect x="846" y="356" width="3.5" height="3.5" fill="#100802"/>
            {/* Clipboard */}
            <polygon points="858,342 872,342 873,375 857,375" fill="#c8a040"/>
            <rect x="860" y="348" width="10" height="2" fill="#333"/>
            <rect x="860" y="355" width="8" height="2" fill="#333"/>
            <rect x="860" y="362" width="9" height="2" fill="#333"/>
            {/* Legs */}
            <polygon points="830,454 842,454 841,500 829,500" fill="#2a4a8a"/>
            <polygon points="842,454 852,454 851,496 841,496" fill="#1a3a7a"/>
            <ellipse cx="835" cy="504" rx="7.5" ry="3.5" fill="#180c04"/>
            <ellipse cx="847" cy="500" rx="7.5" ry="3.5" fill="#180c04"/>

            {/* ══ Lamp stall R2 ══ */}
            <polygon points="820,66 950,66 950,430 818,430" fill="#a85428" opacity=".75"/>
            <polygon points="818,66 952,66 952,90 816,94" fill="#1a3a6a"/>
            {/* Hanging lamps */}
            {[828,844,860,875,889,902,914,925,935,944].map((cx,i)=>(
              <g key={cx}>
                <rect x={cx-1} y={94} width={3} height={20+i} fill="#4a2004"/>
                <polygon points={`${cx-10+i*.5},${116+i} ${cx+10-i*.5},${116+i} ${cx+11-i*.5},${138-i} ${cx-11+i*.5},${138-i}`} fill={['#c8a010','#387888','#801010','#c8a010','#387888'][i%5]}/>
                <ellipse cx={cx} cy={127-i} rx={8-i*.5} ry={8-i*.5} fill={['#ffd060','#58c8d8','#f85828','#ffd060','#58c8d8'][i%5]} opacity=".9" className={['lmp','lmp2','lmp','lmp2','lmp'][i%5]}/>
                <ellipse cx={cx} cy={127-i} rx={16-i} ry={16-i} fill={['#ffc820','#0088c0','#cc1800'][i%3]} opacity=".18" filter="url(#b2)"/>
              </g>
            ))}
            {/* Omar NPC */}
            <polygon points="826,372 852,370 854,452 824,454" fill="#2a4a8a"/>
            <polygon points="829,372 849,370 851,418 827,420" fill="#3a5aa0"/>
            <ellipse cx="839" cy="363" rx="12" ry="12" fill="#8a5020"/>
            <polygon points="827,357 851,356 849,348 829,349" fill="#c8a010"/>
            <polygon points="829,349 849,348 848,342 830,343" fill="#d4b020"/>
            {/* holding lamp */}
            <rect x="851" y="344" width="2.5" height="22" fill="#5a2a08"/>
            <polygon points="845,340 863,340 865,356 843,356" fill="#c8a010"/>
            <ellipse cx="854" cy="348" rx="7" ry="6" fill="#ffd060" opacity=".9" className="lmp"/>
            <ellipse cx="854" cy="348" rx="14" ry="14" fill="#ffc820" opacity=".2" filter="url(#b2)"/>
            <polygon points="824,452 836,452 835,500 823,500" fill="#2a4a8a"/>
            <polygon points="836,452 846,452 845,496 835,496" fill="#1a3a7a"/>
            <ellipse cx="829" cy="504" rx="7" ry="3.5" fill="#180c04"/>
            <ellipse cx="841" cy="500" rx="7" ry="3.5" fill="#180c04"/>

            {/* ══ Gerald from Swindon ══ */}
            <ellipse cx="520" cy="238" rx="10" ry="10" fill="#f0d8c0"/>
            <polygon points="510,248 531,248 533,320 508,322" fill="#4a8a4a"/>
            <polygon points="512,248 529,248 531,305 510,307" fill="#5a9a5a"/>
            {/* Backpack */}
            <polygon points="510,260 496,258 495,295 510,296" fill="#3a2808"/>
            <polygon points="531,260 542,258 541,292 531,293" fill="#3a2808"/>
            {/* Hat — tourist beige */}
            <ellipse cx="520" cy="230" rx="15" ry="4" fill="#c8b060"/>
            <polygon points="509,208 531,208 529,230 511,230" fill="#c8b060"/>
            <ellipse cx="520" cy="208" rx="10" ry="4" fill="#b8a050"/>
            <polygon points="508,320 517,320 516,360 507,360" fill="#3a3a20"/>
            <polygon points="517,320 526,320 525,356 516,356" fill="#2a2a10"/>
            <ellipse cx="512" cy="364" rx="7" ry="3" fill="#7a4810"/>
            <ellipse cx="522" cy="360" rx="7" ry="3" fill="#7a4810"/>
            {/* Phone in hand */}
            <rect x="532" y="285" width="10" height="14" fill="#1a1a1a"/>
            <rect x="534" y="287" width="6" height="10" fill="#304060" opacity=".9"/>

            {/* ══ The Souk Cat ══ */}
            <ellipse cx="550" cy="412" rx="14" ry="9" fill="#2c2418"/>
            <circle cx="559" cy="404" r="8" fill="#2c2418"/>
            <polygon points="553,397 557,390 562,397" fill="#2c2418"/>
            <polygon points="559,396 563,389 568,396" fill="#2c2418"/>
            <path d="M538,418 Q526,413 524,400" fill="none" stroke="#2c2418" strokeWidth="2.8"/>
            <rect x="540" y="418" width="7" height="2.5" fill="#2c2418"/>
            <rect x="543" y="420" width="5" height="10" fill="#2c2418"/>
            <rect x="550" y="420" width="5" height="10" fill="#2c2418"/>
            <rect x="557" y="418" width="5" height="10" fill="#2c2418"/>
            <rect x="564" y="419" width="5" height="10" fill="#2c2418"/>
            <rect x="556" y="403" width="3.5" height="3.5" fill="#50a830"/>
            <rect x="562" y="403" width="3.5" height="3.5" fill="#50a830"/>

            {/* ══ Overhead ropes + lanterns ══ */}
            <line x1="434" y1="108" x2="666" y2="108" stroke="#3c1a02" strokeWidth="1.5" opacity=".92"/>
            {[440,452,464,475,486,497,508,519,530,541,552,563,574,585,596,607,619,631,643,655].map((x,i)=>(
              <g key={x}>
                <rect x={x} y={108} width={i<2||i>17?2:1.5} height={i<2||i>17?11:10} fill="#3c1a02"/>
                <ellipse cx={x+1} cy={i<2||i>17?121:120} rx={i<2||i>17?5.5:4.5} ry={i<2||i>17?4:3.5} fill={['#c8a010','#801010','#c8a010','#346016'][i%4]}/>
              </g>
            ))}

            {/* ══ Textiles jutting from right into alley ══ */}
            <rect x="636" y="138" width="14" height="76" fill="#c83010" opacity=".85"/>
            <rect x="622" y="148" width="11" height="68" fill="#4a1870" opacity=".80"/>
            <rect x="612" y="158" width="8" height="58" fill="#1a6018" opacity=".75"/>
            <rect x="603" y="168" width="7" height="46" fill="#c83010" opacity=".70"/>

            {/* ══ Distance layers — arched stalls receding to VP ══ */}
            {[[376,458,256],[642,724,256]].map(([x1,x2,w2],i)=>(
              <g key={i}>
                <polygon points={`${x1},108 ${x2},104 ${x2},256 ${x1-2},260`} fill="#9e5c1e" opacity=".92"/>
                <polygon points={`${x1+8},118 ${x2-8},115 ${x2-9},254 ${x1+6},257`} fill="#5a2c06" opacity=".70"/>
                <path d={`M${x1+8},158 Q${(x1+x2)/2},136 ${x2-8},156`} fill="#3a1c04" opacity=".64"/>
                <polygon points={`${x1+12},158 ${x2-12},154 ${x2-13},254 ${x1+10},257`} fill="#060302" opacity=".94"/>
                <path d={`M${x1+8},158 Q${(x1+x2)/2},136 ${x2-8},156`} fill="none" stroke="#c8a020" strokeWidth="1.5" opacity=".3"/>
              </g>
            ))}

            {/* Depth shadows */}
            <polygon points="0,600 0,450 78,600" fill="#080402" opacity=".62"/>
            <polygon points="1100,600 1100,450 1022,600" fill="#080402" opacity=".62"/>
            <ellipse cx="550" cy="178" rx="180" ry="90" fill="#f8e880" opacity=".09" filter="url(#b7)"/>
          </svg>

          {/* ── Hotspot divs ── */}
          {HOTSPOTS.map(hs => (
            <div
              key={hs.id}
              data-hs="1"
              onClick={() => tap(hs)}
              onMouseEnter={() => setHovered(hs.label)}
              onMouseLeave={() => setHovered('')}
              style={{
                position: 'absolute',
                left: hs.x,
                top: typeof hs.y === 'number' ? hs.y : hs.y,
                width: hs.w,
                height: hs.h,
                cursor: 'pointer',
                zIndex: 5,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom UI ── */}
      <div style={{ height: 140, background: '#0c0703', borderTop: '3px solid #5a3d10', flexShrink: 0, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        {/* Verb bar */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '2px solid #5a3d10', height: 42, padding: '0 4px', alignItems: 'center' }}>
          {['Look at','Pick up','Talk to','Use','Open','Buy hat'].map(v=>(
            <button
              key={v}
              onClick={()=>setVerb(v)}
              style={{
                fontFamily:"'VT323',monospace", fontSize:16, color: verb===v ? '#ff9a20' : '#f0d080',
                background:'none', border:'none', padding:'4px 10px', letterSpacing:1, cursor:'pointer', whiteSpace:'nowrap',
              }}
            >{v}</button>
          ))}
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:12, color:'#5a3d10', letterSpacing:1, paddingRight:8 }}>← DRAG →</span>
        </div>
        {/* Dialogue + inventory */}
        <div style={{ display:'flex', flex:1, minHeight:0 }}>
          <div style={{ flex:1, padding:'6px 12px', borderRight:'2px solid #5a3d10', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ fontSize:11, color:'#ff9a20', marginBottom:2, letterSpacing:2 }}>{dialogue.who}</div>
            <div style={{ fontSize:14, color:'#f5e8cc', lineHeight:1.4 }}>{dialogue.line}</div>
          </div>
          <div style={{ width:108, flexShrink:0, display:'flex', flexWrap:'wrap', gap:3, padding:6, alignContent:'flex-start' }}>
            {['🧢','💰','🗺️','🩹'].map((item,i)=>(
              <div key={i} style={{ width:36, height:36, border:'2px solid #5a3d10', background:'#080502', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>{item}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          style={{ background:'rgba(0,0,0,.85)', paddingBottom:140 }}
          onClick={e=>{ if(e.target===e.currentTarget) setModal(null) }}
        >
          <div style={{ background:'#0c0703', border:'3px solid #5a3d10', boxShadow:'0 0 40px rgba(200,120,20,.6)', width:'100%', maxWidth:480, maxHeight:'65vh', overflowY:'auto' }}>
            <div style={{ background:'rgba(255,255,255,.04)', borderBottom:'2px solid #5a3d10', padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'#ff9a20', letterSpacing:2, fontFamily:"'VT323',monospace" }}>✦ DISCOVERED ✦</span>
              <button onClick={()=>setModal(null)} style={{ background:'#7a1a08', border:'none', color:'#f5e8cc', fontFamily:"'VT323',monospace", fontSize:22, padding:'0 10px', cursor:'pointer', minWidth:44, minHeight:44, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ padding:14, display:'flex', gap:14 }}>
              <div style={{ fontSize:50, flexShrink:0 }}>{modal.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, color:'#ff9a20', letterSpacing:2, marginBottom:7, fontFamily:"'VT323',monospace" }}>{modal.name.toUpperCase()}</div>
                <div style={{ fontSize:13, color:'#f5e8cc', lineHeight:1.65, marginBottom:10 }}>{modal.desc}</div>
                <div style={{ fontSize:11, color:'#a07830', letterSpacing:1, marginBottom:3 }}>✦ THE COMPANION HAT ✦</div>
                <div style={{ fontSize:13, color:'#f0d080', marginBottom:12 }}>{modal.hatHook}</div>
                {modal.url && (
                  <a
                    href={modal.url}
                    target={modal.url.startsWith('http')?'_blank':undefined}
                    rel={modal.url.startsWith('http')?'noopener noreferrer':undefined}
                    style={{ display:'block', background:'#8b2a10', border:'2px solid #5a1a08', color:'#f5e8cc', fontFamily:"'VT323',monospace", fontSize:19, padding:'10px 24px', letterSpacing:2, width:'100%', cursor:'pointer', textAlign:'center', textDecoration:'none', minHeight:48 }}
                  >
                    → {modal.url.startsWith('http') ? 'OPEN APP' : 'ENTER THE STALL'}
                  </a>
                )}
                {!modal.url && (
                  <button
                    onClick={()=>{ setDialogue({who:'NARRATOR',line:`You acquire "${modal.hatHook}". The alley nods approvingly.`}); setModal(null) }}
                    style={{ background:'#8b2a10', border:'2px solid #5a1a08', color:'#f5e8cc', fontFamily:"'VT323',monospace", fontSize:19, padding:'10px 24px', letterSpacing:2, width:'100%', cursor:'pointer', minHeight:48 }}
                  >→ BUY THE HAT</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
