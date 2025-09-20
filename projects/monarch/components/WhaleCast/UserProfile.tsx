"use client"

import { User } from "../../types"

interface UserProfileProps {
  user: User
  onMuteSource: () => void
  onShareAlpha: () => void
}

export function UserProfile({
  user,
  onMuteSource,
  onShareAlpha
}: UserProfileProps) {
  const getWhaleBadge = (whaleScore: number) => {
    if (whaleScore >= 70) return "🐋"
    if (whaleScore >= 50) return "🐳"
    return ""
  }

  const getWhaleLevel = (whaleScore: number) => {
    if (whaleScore >= 70) return "Mega Whale"
    if (whaleScore >= 50) return "Whale"
    if (whaleScore >= 30) return "Dolphin"
    return "Minnow"
  }

  return (
    <div className="whale-card mb-6">
      {/* Profile header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {user.displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-xl font-bold text-white">@{user.username}</h2>
              {user.verified && (
                <span className="whale-badge whale-badge-verified">
                  ✅ Verified
                </span>
              )}
              {user.whale_score >= 50 && (
                <span className="whale-badge whale-badge-whale">
                  {getWhaleBadge(user.whale_score)}{" "}
                  {getWhaleLevel(user.whale_score)}
                </span>
              )}
            </div>
            <p className="text-gray-400">{user.displayName}</p>
            <p className="text-sm text-gray-500">
              Wallet: {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onMuteSource}
            className="px-3 py-2 rounded-lg border border-gray-400 text-gray-300 hover:bg-gray-200 hover:text-white transition-all duration-200 flex items-center space-x-1"
          >
            <span>🔕</span>
            <span>Mute</span>
          </button>
          <button
            onClick={onShareAlpha}
            className="whale-button flex items-center space-x-1"
          >
            <span>📤</span>
            <span>Share Alpha</span>
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{user.followers}</div>
          <div className="text-sm text-gray-400">Followers</div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              user.pnl_30d >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {user.pnl_30d >= 0 ? "+" : ""}
            {user.pnl_30d}%
          </div>
          <div className="text-sm text-gray-400">30d PnL</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {(user.winrate_30d * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-400">Winrate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {user.whale_score}
          </div>
          <div className="text-sm text-gray-400">Whale Score</div>
        </div>
      </div>
    </div>
  )
}
