import type { Metadata } from 'next'
import ClubHistoryGame from './ClubHistoryGame'

export const metadata: Metadata = {
  title: 'Club History · Footballorium · randomorium',
  description: 'Name every club a player has represented. Any era.',
}

export default function ClubHistoryPage() {
  return <ClubHistoryGame />
}
