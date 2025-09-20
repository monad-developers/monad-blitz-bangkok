import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { MonadSetupButton } from '@/components/MonadSetupButton'
import { BlitzNadLogo } from '@/components/BlitzNadLogo'

export function Navbar() {
  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 items-center">
          {/* Left - Logo */}
          <div className="flex items-center">
            <Link href="/">
              <BlitzNadLogo size="lg" />
            </Link>
          </div>
          
          {/* Center - Navigation */}
          <nav className="flex items-center justify-center space-x-8">
            <Link href="/lobby" className="text-slate-300 hover:text-white transition-colors font-medium">
              Lobby
            </Link>
            <Link href="/leaderboard" className="text-slate-300 hover:text-white transition-colors font-medium">
              Leaderboard
            </Link>
            {/* <Link href="/profile" className="text-slate-300 hover:text-white transition-colors font-medium">
              Profile
            </Link> */}
          </nav>
          
          {/* Right - Wallet Connection */}
          <div className="flex items-center justify-end space-x-4">
            {/* <MonadSetupButton /> */}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}