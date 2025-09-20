"use client"

import { useState } from "react"
import { User } from "../../types"

interface SignalCardProps {
  user: User
  trade: {
    id: string
    tokenIn: string
    tokenOut: string
    amountIn: number
    amountOut: number
    timestamp: Date
    pnl: number
  }
  onCopyTrade: () => void
  onViewDetails: () => void
}

export function SignalCard({
  user,
  trade,
  onCopyTrade,
  onViewDetails
}: SignalCardProps) {
  const [isHovered, setIsHovered] = useState(false)

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

  const getWhaleBadge = (whaleScore: number) => {
    if (whaleScore >= 70) return "🐋"
    if (whaleScore >= 50) return "🐳"
    return ""
  }

  return (
    <div
      className={`whale-card transition-all duration-200 ${
        isHovered ? "transform scale-[1.02] shadow-xl" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with user info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user.displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">@{user.username}</span>
              {user.verified && (
                <span className="whale-badge whale-badge-verified">
                  ✅ Verified
                </span>
              )}
              {user.whale_score >= 50 && (
                <span className="whale-badge whale-badge-whale">
                  {getWhaleBadge(user.whale_score)} Whale
                </span>
              )}
            </div>
            <div className="text-sm text-gray-400">{user.displayName}</div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {formatTimeAgo(trade.timestamp)}
        </div>
      </div>

      {/* Trade summary */}
      <div className="mb-4">
        <div className="text-lg font-semibold text-white mb-1">
          Swapped {formatAmount(trade.amountIn)} {trade.tokenIn} →{" "}
          {formatAmount(trade.amountOut)} {trade.tokenOut}
        </div>
        <div className="text-sm text-gray-400">
          Trade executed at ${(trade.amountOut / trade.amountIn).toFixed(4)} per{" "}
          {trade.tokenIn}
        </div>
      </div>

      {/* Metrics line */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">PnL 30d:</span>
            <span
              className={`font-medium ${
                user.pnl_30d >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {user.pnl_30d >= 0 ? "+" : ""}
              {user.pnl_30d}%
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Winrate:</span>
            <span className="font-medium text-white">
              {(user.winrate_30d * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Followers:</span>
            <span className="font-medium text-white">{user.followers}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onCopyTrade}
          className="whale-button flex-1 flex items-center justify-center space-x-2"
        >
          <span>⚡</span>
          <span>Copy Trade</span>
        </button>
        <button
          onClick={onViewDetails}
          className="px-4 py-2 rounded-xl border border-gray-400 text-gray-300 hover:bg-gray-200 hover:text-white transition-all duration-200 flex-1"
        >
          Details
        </button>
      </div>
    </div>
  )
}
