import type { Metadata } from 'next'
import TeamsheetGame from './TeamsheetGame'

export const metadata: Metadata = {
  title: 'Teamsheet · Footballorium · randomorium',
  description: 'Name every player in a famous match formation.',
}

export default function TeamsheetPage() {
  return <TeamsheetGame />
}
