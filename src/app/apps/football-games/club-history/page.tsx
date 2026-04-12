import type { Metadata } from 'next'
import ClubHistoryGame from './ClubHistoryGame'

export const metadata: Metadata = {
  title: 'Club History · Footballorium · randomorium',
  description: 'Name every club a player has represented. Any era.',
}

interface Props { searchParams: Promise<{ date?: string }> }

export default async function ClubHistoryPage({ searchParams }: Props) {
  const { date } = await searchParams
  return <ClubHistoryGame date={date} />
}
