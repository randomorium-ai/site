'use client'

// Bizaar Card Portraits — Multi-color SVG characters with faces, props, and personality.
// Each merchant is a recognizable character, not a blank silhouette.

interface SvgEl {
  d: string
  fill?: string
  stroke?: string
  sw?: number  // strokeWidth
  op?: number  // opacity
}

interface PortraitConfig {
  bg: string
  accent: string      // main clothing color
  secondary: string   // props, accessories
  skin: string        // face/hands
  eyes: [number, number][]  // [cx, cy] for each eye
  layers: SvgEl[]     // SVG elements, back to front
}

// ── Helper: build standard body ──
function body(d: string, fill: string, op = 0.9): SvgEl {
  return { d, fill, op }
}
function strk(d: string, stroke: string, sw = 1.2, op = 0.7): SvgEl {
  return { d, fill: 'none', stroke, sw, op }
}
function prop(d: string, fill: string, op = 0.85): SvgEl {
  return { d, fill, op }
}

const P: Record<string, PortraitConfig> = {
  // ════════════════════════════════════════
  // TEXTILE EMPIRE
  // ════════════════════════════════════════
  'cloth-merchant': {
    bg: 'linear-gradient(135deg, #4A3060 0%, #6B4090 40%, #8854B8 60%, #3D2550 100%)',
    accent: '#C9A0E8',
    secondary: '#FFD700',
    skin: '#D4A574',
    eyes: [[10.5, 6.2], [13.5, 6.2]],
    layers: [
      // Body & robe
      body('M12 3.5a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm-1.5 8.5h3c3 0 5.5 2 5.5 4.5V19H5v-2.5c0-2.5 2.5-4.5 5.5-4.5z', '#C9A0E8'),
      // Face
      body('M12 3.8a2.9 2.9 0 100 5.8 2.9 2.9 0 000-5.8z', '#D4A574', 0.85),
      // Turban
      prop('M8.5 4c1.2-2 5.8-2 7 0l-.5 1.5c-1.2-1.5-4.8-1.5-6 0z', '#C9A0E8'),
      prop('M9 3.5c1-1.2 5-1.2 6 0', '#9B72CF', 0.6),
      // Turban jewel
      prop('M12 2.8a.6.6 0 100 1.2.6.6 0 000-1.2z', '#FFD700'),
      // Flowing cloth drapes
      strk('M7 14c1.5-1.5 3-.5 4 .5s2.5 1.5 4-.5', '#C9A0E8'),
      strk('M6 16.5c2-1 3 0 4.5.8s3 1.2 5-.8', '#C9A0E8'),
      // Outstretched arms showing cloth
      strk('M5 13l-1 3h3', '#FFD700', 1, 0.5),
      strk('M19 13l1 3h-3', '#FFD700', 1, 0.5),
      // Smile
      strk('M11 8.5c.3.3.8.5 1 .5s.7-.2 1-.5', '#A0724A', 0.8, 0.5),
    ],
  },
  'wool-merchant': {
    bg: 'linear-gradient(135deg, #3D3055 0%, #5A4070 40%, #7450A0 60%, #2D2040 100%)',
    accent: '#B8A0D8',
    secondary: '#F0E0C0',
    skin: '#C8956A',
    eyes: [[10.3, 6], [13.7, 6]],
    layers: [
      body('M12 2.5a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zm-2 10h4c2.8 0 5 2 5 4.5V19H5v-2c0-2.5 2.2-4.5 5-4.5z', '#B8A0D8'),
      // Face
      body('M12 3a3.3 3.3 0 100 6.6 3.3 3.3 0 000-6.6z', '#C8956A', 0.85),
      // Fluffy curly hair (wool-like)
      prop('M8 5c0-1.5 1.5-3 2.5-2s1.5 1.5 3 .5 2 1.5.5 2.5', '#F0E0C0', 0.7),
      prop('M7.5 5.5c-.5-1 .5-2 1.5-1.5', '#F0E0C0', 0.6),
      prop('M16 5c.5-1-.5-2-1.5-1.5', '#F0E0C0', 0.6),
      prop('M8.5 3.5c.5-.8 1.5-1.2 2-1', '#F0E0C0', 0.5),
      prop('M15 3.5c-.5-.8-1.5-1.2-2-1', '#F0E0C0', 0.5),
      // Wool garment texture
      strk('M8 13c1 0 2 .5 2 1.5', '#F0E0C0', 1, 0.4),
      strk('M14 13c1 0 2 .5 2 1.5', '#F0E0C0', 1, 0.4),
      // Warm scarf
      strk('M9 10c1.5.5 4.5.5 6 0', '#B8A0D8', 1.3, 0.6),
      // Smile
      strk('M10.5 8c.5.4 1 .6 1.5.6s1-.2 1.5-.6', '#9A6B45', 0.8, 0.5),
    ],
  },
  'rug-seller': {
    bg: 'linear-gradient(135deg, #5A2D50 0%, #7A3D70 40%, #A04890 60%, #4A1D40 100%)',
    accent: '#E8A0C8',
    secondary: '#FFB347',
    skin: '#D4A574',
    eyes: [[10.5, 6], [13.5, 6]],
    layers: [
      body('M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2.2 6 5v2H4.5v-2c0-2.8 2.7-5 6-5z', '#E8A0C8'),
      body('M12 3.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z', '#D4A574', 0.85),
      // Headband
      prop('M10 3.5c.5-1 3-1 4 0', '#FFB347'),
      // Rug over shoulder (prominent prop)
      prop('M5 12l2-1 1 7H6z', '#FFB347', 0.8),
      strk('M6 12v6', '#E8A0C8', 0.8, 0.4),
      strk('M7 12v6', '#E8A0C8', 0.8, 0.4),
      // Rug pattern lines
      strk('M5.5 14h2', '#E8A0C8', 0.8, 0.5),
      strk('M5.5 16h2', '#E8A0C8', 0.8, 0.5),
      // Rolled rug on back
      strk('M16 11l2 3', '#FFB347', 1.3, 0.5),
      // Smile
      strk('M11 8c.3.3.7.4 1 .4s.7-.1 1-.4', '#A0724A', 0.8, 0.5),
    ],
  },

  // ════════════════════════════════════════
  // TREASURE EMPIRE
  // ════════════════════════════════════════
  'ruby-trader': {
    bg: 'linear-gradient(135deg, #1C2840 0%, #2A3A60 40%, #354878 60%, #152030 100%)',
    accent: '#7BB8E8',
    secondary: '#FF4444',
    skin: '#C8956A',
    eyes: [[10.5, 6.2], [13.5, 6.2]],
    layers: [
      body('M12 3a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm-1.5 8.5h3c3 0 5.5 2 5.5 4.5V19H5v-2.5c0-2.5 2.5-4.5 5.5-4.5z', '#7BB8E8'),
      body('M12 3.3a2.9 2.9 0 100 5.8 2.9 2.9 0 000-5.8z', '#C8956A', 0.85),
      // Jewelled necklace
      strk('M9 9.5c1 .5 2 .8 3 .8s2-.3 3-.8', '#FFD700', 1, 0.6),
      prop('M12 10.3a.5.5 0 100 1 .5.5 0 000-1z', '#FF4444'),
      // Turban
      prop('M9 3.5c1-1.5 5-1.5 6 0l-.5 1c-1-1-4-1-5 0z', '#7BB8E8'),
      // Held ruby (key prop - big and glowing)
      prop('M15 13l1.5-1 1.5 1-1.5 1.5z', '#FF4444'),
      prop('M15.5 12.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z', '#FF4444', 0.9),
      // Outstretched arm presenting ruby
      strk('M14 12l2 .5', '#C8956A', 1, 0.5),
      // Confident expression
      strk('M10.8 8c.4.3.8.4 1.2.4s.8-.1 1.2-.4', '#9A6B45', 0.8, 0.5),
    ],
  },
  'gold-curator': {
    bg: 'linear-gradient(135deg, #1A2535 0%, #253550 40%, #304568 60%, #0F1A28 100%)',
    accent: '#5AA0D0',
    secondary: '#FFD700',
    skin: '#D4A574',
    eyes: [[10.5, 6.5], [13.5, 6.5]],
    layers: [
      body('M12 3.5a3 3 0 100 6 3 3 0 000-6zm-3 9h6c2.5 0 4.5 1.8 4.5 4V19H4.5v-2.5c0-2.2 2-4 4.5-4z', '#5AA0D0'),
      body('M12 3.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z', '#D4A574', 0.85),
      // Wide flat-top hat
      prop('M8 4h8l.5 1.5H7.5z', '#5AA0D0'),
      prop('M7.5 5.5h9', '#5AA0D0', 0.7),
      strk('M7.5 5.5h9', '#3878A8', 1, 0.5),
      // Monocle (key feature)
      strk('M14 6.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z', '#FFD700', 0.8, 0.8),
      strk('M15.2 7.5l1.5 2', '#FFD700', 0.6, 0.4),
      // Ledger/book
      prop('M16 14l2 0v3.5l-2 0z', '#FFD700', 0.6),
      strk('M16.5 15h1M16.5 16h1', '#5AA0D0', 0.6, 0.3),
      // Stern expression
      strk('M10.5 8.5h3', '#A0724A', 0.8, 0.4),
    ],
  },
  'relic-broker': {
    bg: 'linear-gradient(135deg, #20304A 0%, #304868 40%, #3C5880 60%, #182438 100%)',
    accent: '#90C0E8',
    secondary: '#C8F0FF',
    skin: '#B8845A',
    eyes: [[10.5, 6.5], [13.5, 6.5]],
    layers: [
      body('M12 4a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zm-2 8h4c3 0 5 2 5 4v3H5v-3c0-2 2-4 5-4z', '#90C0E8'),
      body('M12 4.3a2.5 2.5 0 100 5 2.5 2.5 0 000-5z', '#B8845A', 0.85),
      // Deep hood
      prop('M9 3.5c1-1.5 5-1.5 6 0', '#90C0E8', 0.8),
      prop('M8.5 4c1.5-2 6-2 7 0l-1 1c-1-1.2-4.5-1.2-5.5 0z', '#6A98C0'),
      strk('M8 4.5l-.5 2', '#90C0E8', 0.8, 0.4),
      strk('M16 4.5l.5 2', '#90C0E8', 0.8, 0.4),
      // Staff with glowing artifact
      strk('M18 10v8', '#C8F0FF', 1.3, 0.7),
      prop('M17.2 9.5a1 1 0 101.6 0 1 1 0 00-1.6 0z', '#C8F0FF', 0.9),
      // Mysterious expression - just a line
      strk('M11 8.2h2', '#8A6440', 0.7, 0.4),
    ],
  },

  // ════════════════════════════════════════
  // SPICE EMPIRE
  // ════════════════════════════════════════
  'saffron-merchant': {
    bg: 'linear-gradient(135deg, #3A2510 0%, #5A3818 40%, #704820 60%, #2A1808 100%)',
    accent: '#E8B040',
    secondary: '#FF8C00',
    skin: '#D4A574',
    eyes: [[10.5, 5.8], [13.5, 5.8]],
    layers: [
      body('M12 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 9c3.5 0 6 2 6 4.5V19H6v-3c0-2.5 2.5-4.5 6-4.5z', '#E8B040'),
      body('M12 3a3 3 0 100 6 3 3 0 000-6z', '#D4A574', 0.85),
      // Grand turban
      prop('M8 3c1.5-2.5 6-2.5 8 0l-1 1c-1.5-2-4.5-2-6 0z', '#E8B040'),
      prop('M9 2.5c1-1.5 5-1.5 6 0', '#C8960A', 0.6),
      // Turban jewel
      prop('M12 1.5a.7.7 0 100 1.4.7.7 0 000-1.4z', '#FF8C00'),
      // Saffron strands in hand
      strk('M7 13l-1.5 2', '#FF8C00', 1, 0.6),
      strk('M6 14l-.5 2', '#FF8C00', 0.8, 0.5),
      strk('M5.5 14l-1 1.5', '#FF8C00', 0.8, 0.4),
      // Spice jar other hand
      prop('M16.5 13.5a1 1.5 0 101 0 1 1.5 0 00-1 0z', '#FF8C00', 0.6),
      // Proud smile
      strk('M10.5 8c.5.4 1 .5 1.5.5s1-.1 1.5-.5', '#A0724A', 0.8, 0.5),
    ],
  },
  'herb-peddler': {
    bg: 'linear-gradient(135deg, #2A3018 0%, #3D4520 40%, #4D5828 60%, #1A2010 100%)',
    accent: '#A0C850',
    secondary: '#70E830',
    skin: '#C8956A',
    eyes: [[10.3, 6], [13.7, 6]],
    layers: [
      body('M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2 6 4.5V19H4.5v-3c0-2.5 2.7-4.5 6-4.5z', '#A0C850'),
      body('M12 3.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z', '#C8956A', 0.85),
      // Straw hat (wide, round)
      prop('M7 4.5h10l.5-.8c0-.8-3.2-2-5.5-2s-5.5 1.2-5.5 2z', '#D8C878', 0.7),
      strk('M7 4.5h10', '#A0C850', 0.8, 0.4),
      // Herb sprigs around (key feature)
      strk('M6 11c.5-1 1.5-.8 2 0', '#70E830', 1, 0.7),
      strk('M5 12c.3-.8 1-.5 1.2.2', '#70E830', 0.8, 0.5),
      strk('M17 11c-.5-1-1.5-.8-2 0', '#70E830', 1, 0.7),
      strk('M18 12c-.3-.8-1-.5-1.2.2', '#70E830', 0.8, 0.5),
      // Cheerful wide smile
      strk('M10 8c.6.6 1.2.8 2 .8s1.4-.2 2-.8', '#9A6B45', 0.8, 0.6),
    ],
  },
  'pepper-seller': {
    bg: 'linear-gradient(135deg, #3A2015 0%, #582D1A 40%, #703820 60%, #28150A 100%)',
    accent: '#E87830',
    secondary: '#FF2200',
    skin: '#D4A574',
    eyes: [[10.5, 6], [13.5, 6]],
    layers: [
      body('M12 3a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm-1.5 8.5h3c3 0 5.5 2 5.5 4V19H5v-3.5c0-2 2.5-4 5.5-4z', '#E87830'),
      body('M12 3.3a2.9 2.9 0 100 5.8 2.9 2.9 0 000-5.8z', '#D4A574', 0.85),
      // Head wrap
      prop('M9 3.5c.5-1 2-1 3-.5s2 .3 3-.5', '#E87830'),
      prop('M9.5 3c1-.8 4-.8 5 0', '#C06020', 0.5),
      // Pepper held up (key prop)
      prop('M16 5c.5 0 1 .5 1 1.2s-.3 1.5-1 1.5-.8-.5-1-1c0-.7.3-1.5 1-1.7z', '#FF2200', 0.8),
      strk('M16.5 4l-.5 1', '#70E830', 0.8, 0.5),
      // Pepper baskets at sides
      strk('M7 14l-1.5 1.5v1.5', '#E87830', 1, 0.4),
      strk('M17 14l1.5 1.5v1.5', '#E87830', 1, 0.4),
      // Expression
      strk('M11 8c.3.3.7.4 1 .4s.7-.1 1-.4', '#A0724A', 0.8, 0.5),
    ],
  },

  // ════════════════════════════════════════
  // NEUTRALS & DISRUPTION
  // ════════════════════════════════════════
  'highwayman': {
    bg: 'linear-gradient(135deg, #1A1015 0%, #2A1820 40%, #381E28 60%, #100810 100%)',
    accent: '#E85050',
    secondary: '#C0C0C0',
    skin: '#B8845A',
    eyes: [[10.5, 5.8], [13.5, 5.8]],
    layers: [
      body('M12 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm-3 9h6c3 0 5 2 5 4v3.5H4v-3.5c0-2 2-4 5-4z', '#3A2028'),
      body('M12 3a3 3 0 100 6 3 3 0 000-6z', '#B8845A', 0.85),
      // Mask over face (key feature)
      prop('M8 5.5h8v2.5H8z', '#1A1015', 0.7),
      // Only eyes visible through mask
      strk('M8 5.5h8', '#E85050', 0.8, 0.5),
      // Hood
      prop('M9 3c1-1.5 5-1.5 6 0l-.5 1c-1-1-4-1-5 0z', '#3A2028', 0.8),
      // Dual daggers (key props)
      strk('M5 13l-1.5 4', '#C0C0C0', 1.3, 0.8),
      strk('M4.5 13l-1 1', '#C0C0C0', 0.8, 0.4),
      strk('M19 13l1.5 4', '#C0C0C0', 1.3, 0.8),
      strk('M19.5 13l1 1', '#C0C0C0', 0.8, 0.4),
      // Menacing look (narrowed eyes handled by eye size)
    ],
  },
  'bazaar-guard': {
    bg: 'linear-gradient(135deg, #35283A 0%, #4D3850 40%, #604868 60%, #25182A 100%)',
    accent: '#D090E0',
    secondary: '#C0C0C0',
    skin: '#C8956A',
    eyes: [[10.5, 6.5], [13.5, 6.5]],
    layers: [
      body('M12 2c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm-2.5 10h5c3 0 5.5 2.5 5.5 5V20H4v-3c0-2.5 2.5-5 5.5-5z', '#D090E0'),
      body('M12 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z', '#C8956A', 0.85),
      // Helmet (key feature)
      prop('M9 1.5h6l1.5 2.5H7.5z', '#C0C0C0', 0.8),
      strk('M8 4h8', '#C0C0C0', 1, 0.6),
      prop('M7.5 2l.5 2', '#C0C0C0', 0.6),
      prop('M16.5 2l-.5 2', '#C0C0C0', 0.6),
      // Helmet crest
      prop('M11.5 1l1-0.5 1 0.5v1h-2z', '#D090E0', 0.6),
      // Spear
      strk('M19 11v8', '#C0C0C0', 1.3, 0.7),
      prop('M18.3 10l1.4-2 1.4 2z', '#C0C0C0', 0.8),
      // Stern expression
      strk('M10.5 8.5h3', '#9A6B45', 0.8, 0.4),
    ],
  },
  'camel-driver': {
    bg: 'linear-gradient(135deg, #382D18 0%, #504020 40%, #685428 60%, #282010 100%)',
    accent: '#D8B060',
    secondary: '#F0D890',
    skin: '#B8845A',
    eyes: [[10.5, 6], [13.5, 6]],
    layers: [
      body('M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2.2 6 5v2H4.5v-2c0-2.8 2.7-5 6-5z', '#D8B060'),
      body('M12 3.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z', '#B8845A', 0.85),
      // Wide headdress/keffiyeh (key feature)
      prop('M7 3c2.5-1.5 7.5-1.5 10 0', '#F0D890', 0.7),
      prop('M8 2.5c1.5-1 5.5-1 7 0', '#D8B060', 0.6),
      strk('M7 3.5l-1 2', '#F0D890', 0.8, 0.4),
      strk('M17 3.5l1 2', '#F0D890', 0.8, 0.4),
      // Rope/reins
      strk('M7 13l-2 3', '#D8B060', 1, 0.4),
      strk('M17 13l2 3', '#D8B060', 1, 0.4),
      // Weathered expression
      strk('M11 8c.3.2.7.3 1 .3s.7-.1 1-.3', '#8A6440', 0.8, 0.4),
    ],
  },
  'fortune-teller': {
    bg: 'linear-gradient(135deg, #1A1830 0%, #2A2548 40%, #383060 60%, #101020 100%)',
    accent: '#A080E0',
    secondary: '#60F0FF',
    skin: '#C8956A',
    eyes: [[10.5, 6], [13.5, 6]],
    layers: [
      body('M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2 6 4.5V19H4.5v-3c0-2.5 2.7-4.5 6-4.5z', '#A080E0'),
      body('M12 3.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z', '#C8956A', 0.85),
      // Mystic hood
      prop('M8 3c1-2 7-2 8 0l-.5 1.5c-1.5-1.5-5.5-1.5-7 0z', '#6A50B0'),
      strk('M7.5 4c.5-.5 1.5-1 2-1', '#A080E0', 0.8, 0.3),
      strk('M16.5 4c-.5-.5-1.5-1-2-1', '#A080E0', 0.8, 0.3),
      // Crystal ball (key prop - glowing!)
      prop('M12 14a2.2 2.2 0 100 4.4 2.2 2.2 0 000-4.4z', '#60F0FF', 0.5),
      strk('M12 14a2.2 2.2 0 100 4.4 2.2 2.2 0 000-4.4z', '#60F0FF', 0.8, 0.8),
      strk('M10.5 16c.8-.5 1.5-.5 2.5 0', '#60F0FF', 0.6, 0.4),
      // Hands around ball
      strk('M9.5 15.5c-.3.5-.3 1.5 0 2', '#C8956A', 0.8, 0.4),
      strk('M14.5 15.5c.3.5.3 1.5 0 2', '#C8956A', 0.8, 0.4),
      // Mysterious expression
      strk('M11 8h2', '#9A6B45', 0.7, 0.4),
    ],
  },
  'silk-thief': {
    bg: 'linear-gradient(135deg, #181520 0%, #252030 40%, #302840 60%, #0E0C18 100%)',
    accent: '#C070A0',
    secondary: '#E8D0F0',
    skin: '#B8845A',
    eyes: [[10.5, 5.8], [13.5, 5.8]],
    layers: [
      body('M12 3a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm-2 8.5h4c2.5 0 4.5 1.8 4.5 4V19H6v-3.5c0-2.2 2-4 4-4z', '#302840'),
      body('M12 3.3a2.9 2.9 0 100 5.8 2.9 2.9 0 000-5.8z', '#B8845A', 0.85),
      // Mask/cowl
      prop('M8 5.5h8v1.5H8z', '#181520', 0.7),
      prop('M9 3.5c1-1.2 5-1.2 6 0l-.3.8c-1-.8-4.5-.8-5.5 0z', '#302840'),
      // Flowing silk sash (key feature)
      strk('M14 10c1-.5 2.5 0 3.5.8s2 1.5 2.5 2', '#E8D0F0', 1.2, 0.6),
      strk('M15 11c1 0 2.5.8 3 1.5', '#E8D0F0', 0.8, 0.4),
      // Dagger in hand
      strk('M6 12l-1.5 3.5', '#C0C0C0', 1, 0.7),
      prop('M4 15l.5.8.8-.3z', '#C0C0C0', 0.6),
      // Sly eyes (narrowed)
    ],
  },
  'water-bearer': {
    bg: 'linear-gradient(135deg, #152530 0%, #1E3545 40%, #284558 60%, #0D1A25 100%)',
    accent: '#60B8D8',
    secondary: '#90E0FF',
    skin: '#D4A574',
    eyes: [[10.3, 6], [13.7, 6]],
    layers: [
      body('M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2.2 6 5v2H4.5v-2c0-2.8 2.7-5 6-5z', '#60B8D8'),
      body('M12 3.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z', '#D4A574', 0.85),
      // Simple head wrap
      prop('M9 3.5c.5-.5 1.5-.8 2-.5', '#60B8D8', 0.7),
      prop('M15 3.5c-.5-.5-1.5-.8-2-.5', '#60B8D8', 0.7),
      // Water jug on shoulder (key prop)
      prop('M15 11c1.5 0 2.5 1 2.5 2.5v1.5c0 .5-.5 1-1.2 1h-1.3', '#90E0FF', 0.6),
      strk('M16.5 11l.5-1', '#90E0FF', 0.8, 0.5),
      // Water splash
      strk('M14 16c.5.5 1.5.5 2.5 0', '#90E0FF', 0.8, 0.5),
      strk('M14.5 17c.3.3 1 .3 1.5 0', '#90E0FF', 0.6, 0.3),
      // Friendly smile
      strk('M10.5 8c.5.4 1 .5 1.5.5s1-.1 1.5-.5', '#A0724A', 0.8, 0.5),
    ],
  },
  'snake-charmer': {
    bg: 'linear-gradient(135deg, #25200A 0%, #3A3010 40%, #4A3D15 60%, #181505 100%)',
    accent: '#C8B030',
    secondary: '#50B030',
    skin: '#C8956A',
    eyes: [[10.5, 6], [13.5, 6]],
    layers: [
      body('M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2 6 4.5V19H4.5v-3c0-2.5 2.7-4.5 6-4.5z', '#C8B030'),
      body('M12 3.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z', '#C8956A', 0.85),
      // Turban
      prop('M9 3.5c1-1.2 5-1.2 6 0l-.3.8c-1-.8-4.5-.8-5.5 0z', '#C8B030', 0.7),
      // Rising snake (key feature!)
      strk('M17 9c0-2 .5-4 0-6', '#50B030', 1.5, 0.8),
      strk('M17 3c.3-.3.6-.2.8 0', '#50B030', 1, 0.7),
      prop('M17.3 2.5l.5-.3.3.5-.5.2z', '#50B030', 0.8),
      // Snake eyes
      prop('M17.5 2.8a.3.3 0 100 .6.3.3 0 000-.6z', '#FF4444', 0.8),
      // Flute/pipe
      strk('M7 12l-1 2v3', '#C8B030', 1, 0.5),
      strk('M6 14h.8', '#C8B030', 0.8, 0.3),
      // Focused expression
      strk('M11 8h2', '#9A6B45', 0.7, 0.4),
    ],
  },
  'jewel-appraiser': {
    bg: 'linear-gradient(135deg, #1A2538 0%, #283850 40%, #344868 60%, #101828 100%)',
    accent: '#70A8D0',
    secondary: '#FFD700',
    skin: '#D4A574',
    eyes: [[10.5, 6.2], [13.8, 6.2]],
    layers: [
      body('M12 3.5a3 3 0 100 6 3 3 0 000-6zm-1.5 8h3c3.3 0 6 2.2 6 5v2H4.5v-2c0-2.8 2.7-5 6-5z', '#70A8D0'),
      body('M12 3.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z', '#D4A574', 0.85),
      // Flat cap
      prop('M9 3.5h6v.8H9z', '#70A8D0'),
      strk('M8.5 4.3h7', '#5888A8', 0.8, 0.4),
      // Monocle (key feature - larger)
      strk('M14.5 5.8a1.5 1.5 0 100 3 1.5 1.5 0 000-3z', '#FFD700', 0.8, 0.8),
      strk('M16 7.3l1 1.5', '#FFD700', 0.5, 0.3),
      // Loupe in hand examining gem
      strk('M6 13l-1 2', '#FFD700', 1, 0.5),
      prop('M4.5 14.5a1 1 0 100 2 1 1 0 000-2z', '#FFD700', 0.5),
      // Tiny gem being examined
      prop('M5 16a.5.5 0 100 1 .5.5 0 000-1z', '#60F0FF', 0.7),
      // Squinting expression (one eye bigger due to monocle)
      strk('M11 8h2', '#A0724A', 0.7, 0.4),
    ],
  },
  'carpet-weaver': {
    bg: 'linear-gradient(135deg, #30203A 0%, #483058 40%, #583870 60%, #201528 100%)',
    accent: '#C890D8',
    secondary: '#FFB347',
    skin: '#C8956A',
    eyes: [[10.5, 6], [13.5, 6]],
    layers: [
      body('M12 3.5a3 3 0 100 6 3 3 0 000-6zm-2 8.5h4c3 0 5.5 2 5.5 4.5V19H4.5v-2.5c0-2.5 2.5-4.5 5.5-4.5z', '#C890D8'),
      body('M12 3.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z', '#C8956A', 0.85),
      // Bandana/scarf
      prop('M9 3.5c1-.8 5-.8 6 0', '#C890D8', 0.7),
      strk('M8 4l-1 1', '#C890D8', 0.8, 0.4),
      strk('M16 4l1 1', '#C890D8', 0.8, 0.4),
      // Loom threads (key feature — colorful!)
      strk('M6 15h12', '#FFB347', 0.8, 0.5),
      strk('M6 16.5h12', '#C890D8', 0.8, 0.5),
      strk('M6 18h12', '#FFB347', 0.8, 0.5),
      strk('M8 14.5v4', '#C890D8', 0.6, 0.3),
      strk('M10 14.5v4', '#FFB347', 0.6, 0.3),
      strk('M12 14.5v4', '#C890D8', 0.6, 0.3),
      strk('M14 14.5v4', '#FFB347', 0.6, 0.3),
      strk('M16 14.5v4', '#C890D8', 0.6, 0.3),
      // Focused expression
      strk('M11 8c.3.2.7.3 1 .3s.7-.1 1-.3', '#9A6B45', 0.8, 0.4),
    ],
  },
}

interface CardPortraitProps {
  cardId: string
  size?: 'sm' | 'md' | 'lg'
}

export default function CardPortrait({ cardId, size = 'md' }: CardPortraitProps) {
  const config = P[cardId]
  if (!config) return null

  const dims = size === 'sm' ? 40 : size === 'md' ? 56 : 80
  const svgSize = size === 'sm' ? 22 : size === 'md' ? 28 : 38
  const eyeR = size === 'sm' ? 0.6 : 0.7

  return (
    <div
      className={`bzr-portrait bzr-portrait--${size}`}
      style={{ background: config.bg, width: dims, height: dims }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 24 24"
        className="bzr-portrait-svg"
      >
        {/* Render all layers back-to-front */}
        {config.layers.map((el, i) => (
          <path
            key={i}
            d={el.d}
            fill={el.fill ?? 'none'}
            stroke={el.stroke ?? 'none'}
            strokeWidth={el.sw ?? 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={el.op ?? 1}
          />
        ))}
        {/* Eyes — gives every character life */}
        {config.eyes.map(([cx, cy], i) => (
          <circle key={`eye-${i}`} cx={cx} cy={cy} r={eyeR} fill="#1A1008" opacity={0.85} />
        ))}
        {/* Eye highlights */}
        {config.eyes.map(([cx, cy], i) => (
          <circle key={`hl-${i}`} cx={cx + 0.25} cy={cy - 0.2} r={0.25} fill="#FFF" opacity={0.6} />
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
  return P[cardId]?.accent ?? '#888'
}
