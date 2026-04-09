import type { Metadata } from 'next'
import PlayerWordleGame from './PlayerWordleGame'

export const metadata: Metadata = {
  title: 'Player Wordle · Footballorium · randomorium',
  description: 'Guess the mystery footballer in 6 clues.',
}

export default function PlayerWordlePage() {
  return <PlayerWordleGame />
}
