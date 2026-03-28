import HatBanner from '@/components/HatBanner'

export default function FootballGamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col">
      {children}
      <HatBanner />
    </div>
  )
}
