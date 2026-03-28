import { DM_Sans } from 'next/font/google'
import HatBanner from '@/components/HatBanner'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export default function FootballGamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.className} min-h-screen bg-[#fafafa] text-[#1a1a1a] flex flex-col`}>
      {children}
      <HatBanner />
    </div>
  )
}
