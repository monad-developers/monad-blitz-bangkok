"use client"

import { useEffect, useState } from "react"
import { getAllUsers } from "../../lib/kv"
import { User } from "../../types"
import { CopyTradeModal } from "./CopyTradeModal"
import { useDemoMode } from "./DemoMode"
import { SignalCard } from "./SignalCard"

interface Trade {
  id: string
  tokenIn: string
  tokenOut: string
  amountIn: number
  amountOut: number
  timestamp: Date
  pnl: number
}

interface FeedPageProps {
  onViewDetails: (userId: number, tradeId: string) => void
  onOpenSettings: () => void
}

export function FeedPage({ onViewDetails, onOpenSettings }: FeedPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { demoUsers } = useDemoMode()

  // Mock trade data - in a real app, this would come from your trading API
  const mockTrades: Trade[] = [
    {
      id: "1",
      tokenIn: "USDC",
      tokenOut: "PEPE",
      amountIn: 1000,
      amountOut: 50000000,
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      pnl: 35.4
    },
    {
      id: "2",
      tokenIn: "ETH",
      tokenOut: "DOGE",
      amountIn: 2.5,
      amountOut: 15000,
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      pnl: 12.7
    },
    {
      id: "3",
      tokenIn: "USDT",
      tokenOut: "SHIB",
      amountIn: 500,
      amountOut: 25000000,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      pnl: 8.9
    },
    {
      id: "4",
      tokenIn: "USDC",
      tokenOut: "BONK",
      amountIn: 200,
      amountOut: 1000000,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      pnl: -25.1
    },
    {
      id: "5",
      tokenIn: "ETH",
      tokenOut: "PEPE",
      amountIn: 1.2,
      amountOut: 30000000,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      pnl: 28.6
    },
    {
      id: "6",
      tokenIn: "USDC",
      tokenOut: "FLOKI",
      amountIn: 800,
      amountOut: 40000000,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      pnl: 19.8
    },
    {
      id: "7",
      tokenIn: "WETH",
      tokenOut: "ARB",
      amountIn: 5.0,
      amountOut: 2500,
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      pnl: 42.1
    },
    {
      id: "8",
      tokenIn: "USDC",
      tokenOut: "WIF",
      amountIn: 1500,
      amountOut: 7500,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      pnl: 18.3
    },
    {
      id: "9",
      tokenIn: "SOL",
      tokenOut: "BOME",
      amountIn: 10.0,
      amountOut: 500000,
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      pnl: -12.4
    },
    {
      id: "10",
      tokenIn: "USDC",
      tokenOut: "POPCAT",
      amountIn: 300,
      amountOut: 150000,
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      pnl: 67.8
    }
  ]

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Try to load from Redis first
        const userData = await getAllUsers()
        if (userData && userData.length > 0) {
          setUsers(userData)
        } else {
          // Use demo data if no users found in Redis
          setUsers(demoUsers)
        }
      } catch (error) {
        console.error(
          "Failed to load users from Redis, using demo data:",
          error
        )
        // Use demo data on error
        setUsers(demoUsers)
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [demoUsers])

  const handleCopyTrade = (trade: Trade) => {
    setSelectedTrade(trade)
    setIsModalOpen(true)
  }

  const handleViewDetails = (userId: number, tradeId: string) => {
    onViewDetails(userId, tradeId)
  }

  const handleConfirmTrade = (amount: number, slippage: number) => {
    console.log("Confirming trade:", { amount, slippage, trade: selectedTrade })
    // Here you would integrate with your trading API
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">🐋 Manorch</h1>
                <p className="text-sm text-gray-400">Follow the smart money</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                  <span className="text-xl">🔍</span>
                </button>
                <button
                  onClick={onOpenSettings}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <span className="text-xl">⚙️</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
              <div className="text-gray-400">Loading whale signals...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">🐋 Manorch</h1>
              <p className="text-sm text-gray-400">Follow the smart money</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                <span className="text-xl">🔍</span>
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="text-xl">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {users.map((user, index) => {
          const trade = mockTrades[index % mockTrades.length]
          return (
            <SignalCard
              key={user.fid}
              user={user}
              trade={trade}
              onCopyTrade={() => handleCopyTrade(trade)}
              onViewDetails={() => handleViewDetails(user.fid, trade.id)}
            />
          )
        })}
      </div>

      {/* Copy Trade Modal */}
      {selectedTrade && (
        <CopyTradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          trade={{
            tokenIn: selectedTrade.tokenIn,
            tokenOut: selectedTrade.tokenOut,
            amountIn: selectedTrade.amountIn,
            amountOut: selectedTrade.amountOut,
            price: selectedTrade.amountOut / selectedTrade.amountIn
          }}
          onConfirm={handleConfirmTrade}
        />
      )}
    </div>
  )
}
