'use client'

import { useState, useEffect } from 'react'
import { Trophy, Crown, Coins, Clock, User, ArrowRight, Home } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'

export default function ResultPage() {
  const router = useRouter()
  const { address } = useAccount()
  const [showReward, setShowReward] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Mock match data - user always wins
  const matchResult = {
    winner: address || '0x1234...5678', // User always wins
    loser: '0x9abc...def0',
    winnerTime: '03:42',
    loserTime: 'DNF', // Did not finish
    problem: 'Sum of All Elements Except Largest',
    mode: 'Speed Solve',
    totalPrizePool: '0.050', // 2 * 0.025
    memPoolFee: '0.025', // 5% of prize pool
    reward: '0.0475', // 95% of prize pool goes to winner
    submissionTime: new Date().toLocaleTimeString(),
    testsPassed: '3/3'
  }

  useEffect(() => {
    // Show confetti and reward animation
    setTimeout(() => setShowConfetti(true), 500)
    setTimeout(() => setShowReward(true), 1000)
  }, [])

  const backToLobby = () => {
    router.push('/lobby')
  }

  // const viewMatch = () => {
  //   router.push('/match/1')
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][
                    Math.floor(Math.random() * 5)
                  ]
                }}
              />
            ))}
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Victory Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Crown className="h-20 w-20 text-yellow-400 animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
            VICTORY!
          </h1>
          <p className="text-xl text-slate-300">
            You dominated the code battle!
          </p>
        </div>

        {/* Match Summary Card */}
        <div className="max-w-4xl mx-auto bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Match Results</h2>
            <div className="flex items-center space-x-2 text-green-400">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">Winner</span>
            </div>
          </div>

          {/* Problem Info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Challenge</h3>
              <p className="text-slate-300">{matchResult.problem}</p>
              <div className="mt-2 text-sm text-slate-400">
                Mode: {matchResult.mode}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Performance</h3>
              <div className="text-green-400 font-bold text-xl">{matchResult.winnerTime}</div>
              <div className="text-sm text-slate-400">
                Tests Passed: {matchResult.testsPassed}
              </div>
            </div>
          </div>

          {/* Player Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Winner (You) */}
            <div className="bg-gradient-to-r from-green-600/20 to-green-700/20 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">You</div>
                    <div className="text-green-400 text-sm font-mono">
                      {matchResult.winner.slice(0, 6)}...{matchResult.winner.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="text-2xl">🏆</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">Time:</span>
                  <span className="text-green-400 font-bold">{matchResult.winnerTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Status:</span>
                  <span className="text-green-400 font-semibold">Winner</span>
                </div>
              </div>
            </div>

            {/* Opponent */}
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Opponent</div>
                    <div className="text-slate-400 text-sm font-mono">
                      {matchResult.loser.slice(0, 6)}...{matchResult.loser.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="text-2xl">😔</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">Time:</span>
                  <span className="text-red-400">{matchResult.loserTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Status:</span>
                  <span className="text-red-400">Defeated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reward Section */}
          <div className={`transition-all duration-1000 ${showReward ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <Coins className="h-8 w-8 text-yellow-400 mr-3" />
                <h3 className="text-2xl font-bold text-white">Reward Earned</h3>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  {matchResult.reward} MON
                </div>
                <div className="text-slate-300">
                  Prize pool winner's share
                </div>
              </div>

              {/* Reward Breakdown */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">Total Pool</div>
                  <div className="text-white font-semibold">{matchResult.totalPrizePool} MON</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">Platform Fee (5%)</div>
                  <div className="text-orange-400 font-semibold">{matchResult.memPoolFee} MON</div>
                </div>
                <div className="bg-yellow-600/20 rounded-lg p-3 border border-yellow-500/30">
                  <div className="text-slate-400 text-sm">Your Reward</div>
                  <div className="text-yellow-400 font-bold">{matchResult.reward} MON</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 max-w-md mx-auto">
          <button
            onClick={backToLobby}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Lobby</span>
          </button>
          {/* <button
            // onClick={viewMatch}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
            <span>View Match</span>
          </button> */}
        </div>
      </main>

      <style jsx>{`
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear infinite;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}