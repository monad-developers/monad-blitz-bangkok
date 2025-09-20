"use client"

import { useEffect, useState } from "react"
import { getAllUsers } from "../../lib/kv"
import { User } from "../../types"
import { useDemoMode } from "./DemoMode"

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { demoUsers } = useDemoMode()

  // Filter settings
  const [minNotional, setMinNotional] = useState(100)
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [onlyWhales, setOnlyWhales] = useState(false)

  // Notification settings
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [discordNotifications, setDiscordNotifications] = useState(false)
  const [telegramNotifications, setTelegramNotifications] = useState(false)

  // Follow management
  const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set())

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userData = await getAllUsers()
        if (userData && userData.length > 0) {
          setUsers(userData)
        } else {
          // Use demo users if no data found in Redis
          setUsers(demoUsers)
        }
        // Mock some followed users
        setFollowedUsers(new Set([201, 203, 205]))
      } catch (error) {
        console.error(
          "Failed to load users from Redis, using demo data:",
          error
        )
        // Use demo users on error
        setUsers(demoUsers)
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [demoUsers])

  const handleToggleFollow = (userId: number) => {
    const newFollowed = new Set(followedUsers)
    if (newFollowed.has(userId)) {
      newFollowed.delete(userId)
    } else {
      newFollowed.add(userId)
    }
    setFollowedUsers(newFollowed)
  }

  const handleSaveSettings = () => {
    console.log("Saving settings:", {
      minNotional,
      onlyVerified,
      onlyWhales,
      inAppNotifications,
      discordNotifications,
      telegramNotifications,
      followedUsers: Array.from(followedUsers)
    })
    // Here you would save to your backend
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Settings</h1>
              <p className="text-sm text-gray-400">
                Customize your Manorch experience
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Filters Section */}
        <div className="whale-card">
          <h3 className="text-lg font-semibold text-white mb-4">🔍 Filters</h3>

          {/* Minimum Notional */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Minimum Notional: ${minNotional}
            </label>
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={minNotional}
              onChange={(e) => setMinNotional(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$0</span>
              <span>$10K</span>
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>✅</span>
                <span className="text-white">Only Verified Traders</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>🐋</span>
                <span className="text-white">Only Whales (50+ Score)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyWhales}
                  onChange={(e) => setOnlyWhales(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="whale-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            🔔 Notifications
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>📱</span>
                <span className="text-white">In-App Notifications</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={inAppNotifications}
                  onChange={(e) => setInAppNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>💬</span>
                <span className="text-white">Discord Notifications</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={discordNotifications}
                  onChange={(e) => setDiscordNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>📨</span>
                <span className="text-white">Telegram Notifications</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramNotifications}
                  onChange={(e) => setTelegramNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Manage Follows Section */}
        <div className="whale-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            👥 Manage Follows
          </h3>

          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.fid}
                className="flex items-center justify-between p-3 bg-gray-200 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {user.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">
                        @{user.username}
                      </span>
                      {user.verified && (
                        <span className="text-green-400">✅</span>
                      )}
                      {user.whale_score >= 50 && (
                        <span className="text-blue-400">🐋</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {user.followers} followers • {user.whale_score} whale
                      score
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followedUsers.has(user.fid)}
                    onChange={() => handleToggleFollow(user.fid)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="whale-button px-8 py-3"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
