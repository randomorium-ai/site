import type { Metadata } from 'next'
import PlayerWordleGame from './PlayerWordleGame'

export const metadata: Metadata = {
  title: 'Player Wordle · Footballorium · randomorium',
  description: 'Guess the mystery footballer in 6 clues.',
}

interface Props { searchParams: Promise<{ date?: string }> }

export default async function PlayerWordlePage({ searchParams }: Props) {
  const { date } = await searchParams
  return <PlayerWordleGame date={date} />
}
