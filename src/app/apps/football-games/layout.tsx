import HatBanner from '@/components/HatBanner'

export default function FootballGamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] flex flex-col">
      {children}
      <HatBanner />
    </div>
  )
}
