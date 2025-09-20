"use client"

import { useState } from "react"
import { User } from "../../types"

interface Trade {
  id: string
  tokenIn: string
  tokenOut: string
  amountIn: number
  amountOut: number
  timestamp: Date
  pnl: number
}

interface ShareAlphaCardProps {
  isOpen: boolean
  onClose: () => void
  user: User
  trade: Trade
  onShareToFarcaster: () => void
}

export function ShareAlphaCard({
  isOpen,
  onClose,
  user,
  trade,
  onShareToFarcaster
}: ShareAlphaCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

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

  const handleShareToFarcaster = async () => {
    setIsGenerating(true)
    try {
      await onShareToFarcaster()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="whale-card max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Share Alpha Card</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Preview Card */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-3">Preview</div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-2xl border-2 border-gray-300">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user.displayName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">
                      @{user.username}
                    </span>
                    {user.verified && (
                      <span className="whale-badge whale-badge-verified">
                        ✅
                      </span>
                    )}
                    {user.whale_score >= 50 && (
                      <span className="whale-badge whale-badge-whale">
                        {getWhaleBadge(user.whale_score)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {user.displayName}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {formatTimeAgo(trade.timestamp)}
                </div>
                <div className="text-xs text-gray-500">via Manorch</div>
              </div>
            </div>

            {/* Trade Info */}
            <div className="mb-4">
              <div className="text-lg font-bold text-white mb-2">
                Swapped {formatAmount(trade.amountIn)} {trade.tokenIn} →{" "}
                {formatAmount(trade.amountOut)} {trade.tokenOut}
              </div>
              <div className="text-sm text-gray-400">
                Trade executed at $
                {(trade.amountOut / trade.amountIn).toFixed(6)} per{" "}
                {trade.tokenIn}
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-400">PnL 30d:</span>
                  <span
                    className={`font-bold ${
                      user.pnl_30d >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {user.pnl_30d >= 0 ? "+" : ""}
                    {user.pnl_30d}%
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-400">Winrate:</span>
                  <span className="font-bold text-white">
                    {(user.winrate_30d * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-gray-400">{user.followers} followers</div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Follow the smart money 🐋
                </div>
                <div className="text-xs text-gray-500">
                  #Manorch #TradingSignals
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-400 text-gray-300 hover:bg-gray-200 hover:text-white transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleShareToFarcaster}
            disabled={isGenerating}
            className="whale-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span>Share to Farcaster</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
