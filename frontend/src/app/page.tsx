import Link from 'next/link'
import { Swords, Trophy, Users, Zap } from 'lucide-react'
import { Navbar } from '@/components/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        {/* Monad Setup Info */}
        {/* <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            🌐 Monad Testnet Setup Required
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-purple-400 font-semibold mb-2">1. Setup Network</h3>
              <p className="text-slate-300">Click "🔧 Setup Monad" to add Monad testnet to MetaMask</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">2. Get Test Tokens</h3>
              <p className="text-slate-300">Click "🚰 Get MON" to visit the faucet and get testnet tokens</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">3. Connect & Play</h3>
              <p className="text-slate-300">Connect your wallet and start coding battles!</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            💡 <strong>Your Address:</strong> 0xfb76423b3ec7e0793ac5Adb387a84F42C18A9e5a (for requesting testnet tokens)
          </div>
        </div> */}

        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Code. Battle. Earn.
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Enter the ultimate PvP coding arena on Monad testnet. Stake tokens, solve challenges, 
            and claim victory in real-time coding battles with BlitzNad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/lobby"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Enter Arena
            </Link>
            <Link 
              href="/how-to-play"
              className="border border-slate-600 hover:border-slate-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              How to Play
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <FeatureCard
            icon={<Swords className="h-8 w-8 text-purple-400" />}
            title="PvP Battles"
            description="Challenge opponents in real-time coding duels with stakes on the line"
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-yellow-400" />}
            title="Multiple Modes"
            description="Speed solving, gas optimization, and capture-the-flag challenges"
          />
          <FeatureCard
            icon={<Trophy className="h-8 w-8 text-amber-400" />}
            title="NFT Badges"
            description="Earn unique achievement badges and showcase your coding prowess"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-blue-400" />}
            title="ELO Rankings"
            description="Climb the leaderboard and prove you're the ultimate code warrior"
          />
        </div>

        {/* Stats Section */}
        <div className="bg-slate-800/50 rounded-lg p-8 mb-16 simple-border">
          <h2 className="text-3xl font-bold text-center text-white mb-8">Arena Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <StatCard label="Total Matches" value="1,247" />
            <StatCard label="Active Players" value="342" />
            <StatCard label="Total Rewards" value="50,000 GAME" />
            <StatCard label="Avg Match Time" value="4.2 min" />
          </div>
        </div>

        {/* Recent Matches */}
        <div className="bg-slate-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Battles</h2>
          <div className="space-y-4">
            <MatchCard
              winner="0x1234...5678"
              loser="0x9abc...def0"
              challenge="Two Sum"
              stake="100 GAME"
              time="2m 34s"
            />
            <MatchCard
              winner="0x5555...7777"
              loser="0x1111...3333"
              challenge="Binary Search"
              stake="250 GAME"
              time="5m 12s"
            />
            <MatchCard
              winner="0xaaaa...bbbb"
              loser="0xcccc...dddd"
              challenge="Gas Optimization"
              stake="500 GAME"
              time="8m 45s"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 text-center hover:bg-slate-800/70 transition-colors">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-purple-400">{value}</div>
      <div className="text-slate-400">{label}</div>
    </div>
  )
}

function MatchCard({ winner, loser, challenge, stake, time }: {
  winner: string
  loser: string
  challenge: string
  stake: string
  time: string
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="text-green-400 font-mono">{winner}</div>
        <div className="text-slate-500">vs</div>
        <div className="text-red-400 font-mono">{loser}</div>
      </div>
      <div className="text-slate-300">{challenge}</div>
      <div className="text-yellow-400">{stake}</div>
      <div className="text-slate-400">{time}</div>
    </div>
  )
}