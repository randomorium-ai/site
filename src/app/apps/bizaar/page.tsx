import type { Metadata } from 'next'
import BizaarApp from './BizaarApp'

export const metadata: Metadata = {
  title: 'Bizaar · randomorium',
  description: 'A Gwent-style card battler set in a fantasy bazaar. Build empires. Outsmart the serpent.',
}

export default function Page() {
  return <BizaarApp />
}
