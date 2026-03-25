import type { Metadata } from 'next'
import AchillesApp from './AchillesApp'

export const metadata: Metadata = {
  title: 'Operation Achilles Rebuild · randomorium',
  description: 'Logging the road back to 5km — 9 months of physio, one tendon at a time.',
}

export default function Page() {
  return <AchillesApp />
}
