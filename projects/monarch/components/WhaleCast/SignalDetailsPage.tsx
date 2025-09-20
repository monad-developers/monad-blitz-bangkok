"use client"

import { useEffect, useState } from "react"
import { getUser } from "../../lib/kv"
import { User } from "../../types"
import { CopyTradeModal } from "./CopyTradeModal"
import { useDemoMode } from "./DemoMode"
import { UserProfile } from "./UserProfile"

interface Trade {
  id: string
  tokenIn: string
  tokenOut: string
  amountIn: number
  amountOut: number
  timestamp: Date
  pnl: number
  txHash: string
}

interface SignalDetailsPageProps {
  userId: number
  tradeId: string
  onBack: () => void
  onShareAlpha: (user: User, trade: Trade) => void
}

export function SignalDetailsPage({
  userId,
  tradeId,
  onBack,
  onShareAlpha
}: SignalDetailsPageProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { demoUser } = useDemoMode()

  // Mock trade data
  const mockTrade: Trade = {
    id: tradeId,
    tokenIn: "USDC",
    tokenOut: "PEPE",
    amountIn: 1000,
    amountOut: 50000000,
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    pnl: 35.4,
    txHash: "0x1234567890abcdef1234567890abcdef12345678"
  }

  // Mock recent trades from same actor
  const recentTrades: Trade[] = [
    {
      id: "1",
      tokenIn: "ETH",
      tokenOut: "DOGE",
      amountIn: 2.5,
      amountOut: 15000,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      pnl: 12.7,
      txHash: "0xabcdef1234567890abcdef1234567890abcdef12"
    },
    {
      id: "2",
      tokenIn: "USDT",
      tokenOut: "SHIB",
      amountIn: 500,
      amountOut: 25000000,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      pnl: 8.9,
      txHash: "0x9876543210fedcba9876543210fedcba98765432"
    },
    {
      id: "3",
      tokenIn: "USDC",
      tokenOut: "BONK",
      amountIn: 200,
      amountOut: 1000000,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      pnl: -25.1,
      txHash: "0xfedcba9876543210fedcba9876543210fedcba98"
    }
  ]

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUser(userId)
        if (userData) {
          setUser(userData)
        } else {
          // Use demo user if not found in Redis
          setUser(demoUser(userId))
        }
      } catch (error) {
        console.error("Failed to load user from Redis, using demo user:", error)
        // Use demo user on error
        setUser(demoUser(userId))
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [userId, demoUser])

  const handleCopyTrade = () => {
    setIsModalOpen(true)
  }

  const handleMuteSource = () => {
    console.log("Muting source:", userId)
  }

  const handleShareAlpha = () => {
    if (user) {
      onShareAlpha(user, mockTrade)
    }
  }

  const handleConfirmTrade = (amount: number, slippage: number) => {
    console.log("Confirming trade:", { amount, slippage, trade: mockTrade })
  }

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`
    }
    return amount.toFixed(0)
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading signal details...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">❌ User not found</div>
          <button
            onClick={onBack}
            className="whale-button"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Signal Details</h1>
              <p className="text-sm text-gray-400">Trade #{tradeId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* User Profile */}
        <UserProfile
          user={user}
          onMuteSource={handleMuteSource}
          onShareAlpha={handleShareAlpha}
        />

        {/* Trade Info */}
        <div className="whale-card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Trade Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-2">Token Pair</div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mb-1">
                    {mockTrade.tokenIn.charAt(0)}
                  </div>
                  <div className="text-sm font-medium text-white">
                    {mockTrade.tokenIn}
                  </div>
                </div>
                <div className="text-2xl">→</div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mb-1">
                    {mockTrade.tokenOut.charAt(0)}
                  </div>
                  <div className="text-sm font-medium text-white">
                    {mockTrade.tokenOut}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-2">Amounts</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Input:</span>
                  <span className="text-white font-medium">
                    {formatAmount(mockTrade.amountIn)} {mockTrade.tokenIn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Output:</span>
                  <span className="text-white font-medium">
                    {formatAmount(mockTrade.amountOut)} {mockTrade.tokenOut}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-medium">
                    ${(mockTrade.amountOut / mockTrade.amountIn).toFixed(6)} per{" "}
                    {mockTrade.tokenIn}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Transaction: {mockTrade.txHash.slice(0, 10)}...
                {mockTrade.txHash.slice(-8)}
              </div>
              <div className="text-sm text-gray-400">
                {formatTimeAgo(mockTrade.timestamp)}
              </div>
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleCopyTrade}
              className="whale-button flex items-center space-x-2"
            >
              <span>⚡</span>
              <span>Copy Trade</span>
            </button>
            <button className="px-4 py-2 rounded-xl border border-gray-400 text-gray-300 hover:bg-gray-200 hover:text-white transition-all duration-200">
              View on Explorer
            </button>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="whale-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Trades from @{user.username}
          </h3>

          <div className="space-y-3">
            {recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 bg-gray-200 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="text-sm font-medium text-white">
                      {formatAmount(trade.amountIn)} {trade.tokenIn}
                    </div>
                    <div className="text-xs text-gray-400">→</div>
                    <div className="text-sm font-medium text-white">
                      {formatAmount(trade.amountOut)} {trade.tokenOut}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatTimeAgo(trade.timestamp)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-medium ${
                      trade.pnl >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {trade.pnl >= 0 ? "+" : ""}
                    {trade.pnl}%
                  </div>
                  <div className="text-xs text-gray-400">PnL</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copy Trade Modal */}
      <CopyTradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trade={{
          tokenIn: mockTrade.tokenIn,
          tokenOut: mockTrade.tokenOut,
          amountIn: mockTrade.amountIn,
          amountOut: mockTrade.amountOut,
          price: mockTrade.amountOut / mockTrade.amountIn
        }}
        onConfirm={handleConfirmTrade}
      />
    </div>
  )
}
