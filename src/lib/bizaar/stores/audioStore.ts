// ── Bizaar Audio Store ──
// Zustand store for mute toggle and volume control.

import { create } from 'zustand'

export type VolumePreset = 'muted' | 'low' | 'medium' | 'full'

const VOLUME_LEVELS: Record<VolumePreset, number> = {
  muted: 0,
  low: 0.25,
  medium: 0.55,
  full: 1,
}

const PRESET_ORDER: VolumePreset[] = ['full', 'medium', 'low', 'muted']

interface AudioStore {
  muted: boolean
  volume: number
  volumePreset: VolumePreset
  toggleMute: () => void
  cycleVolume: () => void
  setVolume: (volume: number) => void
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  muted: false,
  volume: 1,
  volumePreset: 'full',
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  cycleVolume: () => {
    const current = get().volumePreset
    const idx = PRESET_ORDER.indexOf(current)
    const next = PRESET_ORDER[(idx + 1) % PRESET_ORDER.length]
    const vol = VOLUME_LEVELS[next]
    set({ volumePreset: next, volume: vol, muted: next === 'muted' })

    // Update shared master gain if available
    import('../audio/audioContext').then(({ setMasterVolume }) => {
      setMasterVolume(vol)
    }).catch(() => { /* not yet initialized */ })
  },
  setVolume: (volume: number) => set({ volume, muted: volume === 0 }),
}))

export function getVolumeIcon(preset: VolumePreset): string {
  switch (preset) {
    case 'full': return '\u{1F50A}'   // 🔊
    case 'medium': return '\u{1F509}' // 🔉
    case 'low': return '\u{1F508}'    // 🔈
    case 'muted': return '\u{1F507}'  // 🔇
  }
}
