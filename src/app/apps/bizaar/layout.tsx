import { Playfair_Display, DM_Sans } from 'next/font/google'
import './styles/bizaar.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-bizaar-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bizaar-body',
  display: 'swap',
})

export default function BizaarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${dmSans.variable} bzr-root`}>
      {children}
    </div>
  )
}
