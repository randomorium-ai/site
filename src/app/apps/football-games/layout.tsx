import HatBanner from '@/components/HatBanner'

export default function FootballGamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      {children}
      <HatBanner />
    </div>
  )
}
