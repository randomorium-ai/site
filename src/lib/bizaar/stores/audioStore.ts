// ── Bizaar Audio Store ──
// Zustand store for mute toggle. SynthAudio checks this before playing.

import { create } from 'zustand'

interface AudioStore {
  muted: boolean
  toggleMute: () => void
}

export const useAudioStore = create<AudioStore>((set) => ({
  muted: false,
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}))
