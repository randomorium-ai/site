'use client'

// Each card gets a unique CSS-generated portrait with distinct colors and character silhouette.
// No external images needed — pure CSS/SVG art.

interface PortraitConfig {
  bg: string        // gradient background
  accent: string    // accent color
  silhouette: string // SVG path for character silhouette
  details: string[]  // multiple detail SVG paths for richer art
  patternType?: 'cloth' | 'gem' | 'spice' | 'smoke' | 'daggers'
}

const PORTRAITS: Record<string, PortraitConfig> = {
  // ── TEXTILE EMPIRE ──
  'cloth-merchant': {
    bg: 'linear-gradient(135deg, #4A3060 0%, #6B4090 40%, #8854B8 60%, #3D2550 100%)',
    accent: '#C9A0E8',
    silhouette: 'M12 3.5a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm-1.5 8.5h3c3 0 5.5 2 5.5 4.5V19H5v-2.5c0-2.5 2.5-4.5 5.5-4.5z',
    details: [
      'M7 14c1.5-1.5 3-.5 4 .5s2.5 1.5 4-.5',  // flowing cloth drape
      'M6 16.5c2-1 3 0 4.5.8s3 1.2 5-.8',        // second cloth layer
      'M9 3.5c.5-1 2-1.5 3-1s2.5.5 3 1.5',       // hat/turban top
      'M8 9.5l-1.5 2.5M16 9.5l1.5 2.5',           // collar detail
    ],
    patternType: 'cloth',
  },
  'wool-merchant': {
    bg: 'linear-gradient(135deg, #3D3055 0%, #5A4070 40%, #7450A0 60%, #2D2040 100%)',
    accent: '#B8A0D8',
    silhouette: 'M12 2.5a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zm-2 10h4c2.8 0 5 2 5 4.5V19H5v-2c0-2.5 2.2-4.5 5-4.5z',
    details: [
      'M8 5c0-1.5 1.5-3 2.5-2s1.5 1.5 3 .5 2 1.5 .5 2.5',  // curly wool hair
      'M7.5 5.5c-.5-1 .5-2 1.5-1.5',                          // extra curl
      'M16 5c.5-1-.5-2-1.5-1.5',                               // another curl
      'M8 13c1 0 2 .5 2 1.5M14 13c1 0 2 .5 2 1.5',           // wool garment texture
    ],
    patternType: 'cloth',
  },
  'rug-seller': {
    bg: 'linear-gradient(135deg, #5A2D50 0%, #7A3D70 40%, #A04890 60%, #4A1D40 100%)',
    accent: '#E8A0C8',
    silhouette: 'M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2.2 6 5v2H4.5v-2c0-2.8 2.7-5 6-5z',
    details: [
      'M6 15h12M6 17h12',                                     // rug pattern lines
      'M8 15v2M10 15v2M12 15v2M14 15v2M16 15v2',             // rug fringes
      'M10 3c.5-1 3-1 4 0',                                    // headband
      'M8 11l-2 3M16 11l2 3',                                 // rolled rug sides
    ],
    patternType: 'cloth',
  },

  // ── TREASURE EMPIRE ──
  'ruby-trader': {
    bg: 'linear-gradient(135deg, #1C2840 0%, #2A3A60 40%, #354878 60%, #152030 100%)',
    accent: '#7BB8E8',
    silhouette: 'M12 3a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm-1.5 8.5h3c3 0 5.5 2 5.5 4.5V19H5v-2.5c0-2.5 2.5-4.5 5.5-4.5z',
    details: [
      'M10 7.5l2-1.5 2 1.5',                                  // jewelled necklace
      'M12 6l-.5-.8.5-.7.5.7z',                                // pendant gem
      'M7 14l1-1.5M17 14l-1-1.5',                             // outstretched arms
      'M14.5 14a1 1 0 100 2 1 1 0 000-2z',                    // held ruby
    ],
    patternType: 'gem',
  },
  'gold-curator': {
    bg: 'linear-gradient(135deg, #1A2535 0%, #253550 40%, #304568 60%, #0F1A28 100%)',
    accent: '#5AA0D0',
    silhouette: 'M12 3.5a3 3 0 100 6 3 3 0 000-6zm-3 9h6c2.5 0 4.5 1.8 4.5 4V19H4.5v-2.5c0-2.2 2-4 4.5-4z',
    details: [
      'M8.5 3.5h7l.5 1.5h-8z',                               // wide flat-top hat
      'M8 4h8',                                                // hat brim
      'M16 14l2 0 0 3-2 0z',                                  // book/ledger
      'M9 9c0-.5.5-1 1-.8',                                   // monocle chain
    ],
    patternType: 'gem',
  },
  'relic-broker': {
    bg: 'linear-gradient(135deg, #20304A 0%, #304868 40%, #3C5880 60%, #182438 100%)',
    accent: '#90C0E8',
    silhouette: 'M12 4a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zm-2 8h4c3 0 5 2 5 4v3H5v-3c0-2 2-4 5-4z',
    details: [
      'M14 13l2.5-1.5 1.5 2.5-2 .5',                         // holding relic/staff
      'M18 14l0 4',                                            // staff line
      'M9 4c.3-.8 1-1.2 1.8-1.2',                             // hood left
      'M15 4c-.3-.8-1-1.2-1.8-1.2',                           // hood right
      'M9 3.5c1-1.5 5-1.5 6 0',                               // hood top arc
    ],
    patternType: 'gem',
  },

  // ── SPICE EMPIRE ──
  'saffron-merchant': {
    bg: 'linear-gradient(135deg, #3A2510 0%, #5A3818 40%, #704820 60%, #2A1808 100%)',
    accent: '#E8B040',
    silhouette: 'M12 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 9c3.5 0 6 2 6 4.5V19H6v-3c0-2.5 2.5-4.5 6-4.5z',
    details: [
      'M8 3c1.5-2.5 6-2.5 8 0l-1 1c-1.5-2-4.5-2-6 0z',    // elaborate turban
      'M9 2.5c1-1.5 5-1.5 6 0',                               // turban fold
      'M12 1.5l.5 1',                                          // turban jewel
      'M8 13l-2 2v2M16 13l2 2v2',                             // holding spice jars
    ],
    patternType: 'spice',
  },
  'herb-peddler': {
    bg: 'linear-gradient(135deg, #2A3018 0%, #3D4520 40%, #4D5828 60%, #1A2010 100%)',
    accent: '#A0C850',
    silhouette: 'M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2 6 4.5V19H4.5v-3c0-2.5 2.7-4.5 6-4.5z',
    details: [
      'M7 12c1.5.5 2-1 3-.5s1.5 1.5 3 .5 2-1 3.5.5',       // herb sprigs
      'M6 13c.5-1.5 1.5-.5 2 .5',                             // leaf left
      'M17 13c-.5-1.5-1.5-.5-2 .5',                           // leaf right
      'M9 3c.3-.5 1-.8 1.5-.5',                                // straw hat edge
      'M15 3c-.3-.5-1-.8-1.5-.5',                              // straw hat edge R
    ],
    patternType: 'spice',
  },
  'pepper-seller': {
    bg: 'linear-gradient(135deg, #3A2015 0%, #582D1A 40%, #703820 60%, #28150A 100%)',
    accent: '#E87830',
    silhouette: 'M12 3a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm-1.5 8.5h3c3 0 5.5 2 5.5 4V19H5v-3.5c0-2 2.5-4 5.5-4z',
    details: [
      'M15 7l2-3 .5 1.5-1 2',                                // pepper stem held up
      'M16 4a1.5 2 0 011 2c-.5.8-1.5.5-1.5-.5',              // pepper shape
      'M9 4c.5-1 2-1 3-.5',                                    // head wrap
      'M8 12l-1.5 1.5M16 12l1.5 1.5',                         // pepper baskets
    ],
    patternType: 'spice',
  },

  // ── NEUTRALS & DISRUPTION ──
  'highwayman': {
    bg: 'linear-gradient(135deg, #1A1015 0%, #2A1820 40%, #381E28 60%, #100810 100%)',
    accent: '#E85050',
    silhouette: 'M12 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm-3 9h6c3 0 5 2 5 4v3.5H4v-3.5c0-2 2-4 5-4z',
    details: [
      'M7.5 6h9',                                              // mask band
      'M7 5.5c0 .8.5 1.5 1 1.5h.5',                           // mask left
      'M17 5.5c0 .8-.5 1.5-1 1.5h-.5',                        // mask right
      'M6 14l-1 4 2-.5M18 14l1 4-2-.5',                       // daggers at sides
      'M7 16l-.5 2M17 16l.5 2',                                // dagger blades
    ],
    patternType: 'daggers',
  },
  'bazaar-guard': {
    bg: 'linear-gradient(135deg, #35283A 0%, #4D3850 40%, #604868 60%, #25182A 100%)',
    accent: '#D090E0',
    silhouette: 'M12 2c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm-2.5 10h5c3 0 5.5 2.5 5.5 5V20H4v-3c0-2.5 2.5-5 5.5-5z',
    details: [
      'M9 1.5h6l1.5 2.5H7.5z',                               // helmet top
      'M8 4h8',                                                // helmet brim
      'M7.5 2l.5 2M16.5 2l-.5 2',                             // helmet sides
      'M17 13l2 0v5l-1 .5',                                   // spear
      'M19 13v5',                                              // spear shaft
    ],
  },
  'camel-driver': {
    bg: 'linear-gradient(135deg, #382D18 0%, #504020 40%, #685428 60%, #282010 100%)',
    accent: '#D8B060',
    silhouette: 'M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2.2 6 5v2H4.5v-2c0-2.8 2.7-5 6-5z',
    details: [
      'M7 3c2.5-1.5 7.5-1.5 10 0',                           // wide head wrap
      'M8 2.5c1.5-1 5.5-1 7 0',                               // wrap fold
      'M7 3.5l-1 2M17 3.5l1 2',                               // wrap tails
      'M8 13l-2 4M16 13l2 4',                                 // riding stance
    ],
    patternType: 'spice',
  },
  'fortune-teller': {
    bg: 'linear-gradient(135deg, #1A1830 0%, #2A2548 40%, #383060 60%, #101020 100%)',
    accent: '#A080E0',
    silhouette: 'M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2 6 4.5V19H4.5v-3c0-2.5 2.7-4.5 6-4.5z',
    details: [
      'M12 14a2 2 0 100 4 2 2 0 000-4z',                     // crystal ball
      'M10 16.5c.5-.8 1.2-1 2-1s1.5.2 2 1',                   // ball glow arc
      'M8 3c1-2 7-2 8 0',                                      // mystic hood
      'M7.5 4c.5-.5 1.5-1 2-1',                                // hood drape L
      'M16.5 4c-.5-.5-1.5-1-2-1',                              // hood drape R
    ],
    patternType: 'smoke',
  },
  'silk-thief': {
    bg: 'linear-gradient(135deg, #181520 0%, #252030 40%, #302840 60%, #0E0C18 100%)',
    accent: '#C070A0',
    silhouette: 'M12 3a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm-2 8.5h4c2.5 0 4.5 1.8 4.5 4V19H6v-3.5c0-2.2 2-4 4-4z',
    details: [
      'M6 12l-1 3 2-.8',                                      // dagger left hand
      'M5 15l.3-1.5',                                          // blade
      'M8 5h8',                                                // mask/cowl
      'M14 10l2 .5 1-1',                                      // silk sash flowing
      'M16 10c1-.5 2 0 2.5 1',                                // sash end
    ],
    patternType: 'daggers',
  },
  'water-bearer': {
    bg: 'linear-gradient(135deg, #152530 0%, #1E3545 40%, #284558 60%, #0D1A25 100%)',
    accent: '#60B8D8',
    silhouette: 'M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2.2 6 5v2H4.5v-2c0-2.8 2.7-5 6-5z',
    details: [
      'M15 12c1.5 0 2.5 1 2.5 2.5v1c0 .5-.5 1-1 1h-1',      // water jug shape
      'M15.5 13v2.5',                                          // jug body
      'M14 15.5c.5.5 1.5.5 2.5 0',                            // water splash
      'M9 3c.5-.5 1.5-.8 2-.5',                                // simple head wrap
    ],
  },
  'snake-charmer': {
    bg: 'linear-gradient(135deg, #25200A 0%, #3A3010 40%, #4A3D15 60%, #181505 100%)',
    accent: '#C8B030',
    silhouette: 'M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2 6 4.5V19H4.5v-3c0-2.5 2.7-4.5 6-4.5z',
    details: [
      'M16 8c1-2.5 2-5 1-7',                                  // snake body rising
      'M17 1c.5.5.2 1-.3 1.2',                                // snake head
      'M16.5 1.5l.8-.3',                                       // tongue
      'M8 13l-2 1v3l1 .5',                                    // flute/pipe
      'M6 14v2.5',                                             // pipe body
    ],
    patternType: 'smoke',
  },
  'jewel-appraiser': {
    bg: 'linear-gradient(135deg, #1A2538 0%, #283850 40%, #344868 60%, #101828 100%)',
    accent: '#70A8D0',
    silhouette: 'M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2.2 6 5v2H4.5v-2c0-2.8 2.7-5 6-5z',
    details: [
      'M16 7.5a2 2 0 100 4 2 2 0 000-4z',                    // monocle
      'M15 9.5c-.3.3-.8.3-1 0',                                // monocle chain
      'M14 10l-2 3',                                            // chain to vest
      'M7 12l-1 2 2 0',                                        // loupe/tool
      'M9 3h6v.5H9z',                                          // flat cap brim
    ],
    patternType: 'gem',
  },
  'carpet-weaver': {
    bg: 'linear-gradient(135deg, #30203A 0%, #483058 40%, #583870 60%, #201528 100%)',
    accent: '#C890D8',
    silhouette: 'M12 3.5a3 3 0 100 6 3 3 0 000-6zm-2 8.5h4c3 0 5.5 2 5.5 4.5V19H4.5v-2.5c0-2.5 2.5-4.5 5.5-4.5z',
    details: [
      'M6 15h12M6 16.5h12M6 18h12',                           // loom threads
      'M7 15v3M9 15v3M11 15v3M13 15v3M15 15v3M17 15v3',      // vertical threads
      'M9 3c1-.8 5-.8 6 0',                                    // scarf/bandana
      'M8 4l-1 1M16 4l1 1',                                    // scarf tails
    ],
    patternType: 'cloth',
  },
}

interface CardPortraitProps {
  cardId: string
  size?: 'sm' | 'md' | 'lg'
}

export default function CardPortrait({ cardId, size = 'md' }: CardPortraitProps) {
  const config = PORTRAITS[cardId]
  if (!config) return null

  const dims = size === 'sm' ? 40 : size === 'md' ? 56 : 80
  const svgSize = size === 'sm' ? 22 : size === 'md' ? 28 : 38

  return (
    <div
      className={`bzr-portrait bzr-portrait--${size}`}
      style={{
        background: config.bg,
        width: dims,
        height: dims,
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 24 24"
        className="bzr-portrait-svg"
      >
        {/* Character silhouette */}
        <path d={config.silhouette} fill={config.accent} opacity="0.9" />
        {/* Character details — multiple paths for richer art */}
        {config.details.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={config.accent}
            strokeWidth={i === 0 ? '1.3' : '1'}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={i === 0 ? 0.7 : 0.45}
          />
        ))}
      </svg>
      {/* Ambient glow */}
      <div
        className="bzr-portrait-glow"
        style={{ background: `radial-gradient(circle, ${config.accent}25 0%, transparent 70%)` }}
      />
    </div>
  )
}

export function getCardAccent(cardId: string): string {
  return PORTRAITS[cardId]?.accent ?? '#888'
}
