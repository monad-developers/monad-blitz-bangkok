"use client"

import { useState } from "react"
import { User } from "../../types"
import { ErrorBoundary } from "./ErrorBoundary"
import { FeedPage } from "./FeedPage"
import { SettingsPage } from "./SettingsPage"
import { ShareAlphaCard } from "./ShareAlphaCard"
import { SignalDetailsPage } from "./SignalDetailsPage"

type AppPage = "feed" | "details" | "settings"

interface ManorchAppProps {
  initialPage?: AppPage
}

export function ManorchApp({ initialPage = "feed" }: ManorchAppProps) {
  const [currentPage, setCurrentPage] = useState<AppPage>(initialPage)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)
  const [shareUser, setShareUser] = useState<User | null>(null)
  const [shareTrade, setShareTrade] = useState<any>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const handleViewDetails = (userId: number, tradeId: string) => {
    setSelectedUserId(userId)
    setSelectedTradeId(tradeId)
    setCurrentPage("details")
  }

  const handleBackToFeed = () => {
    setCurrentPage("feed")
    setSelectedUserId(null)
    setSelectedTradeId(null)
  }

  const handleOpenSettings = () => {
    setCurrentPage("settings")
  }

  const handleBackFromSettings = () => {
    setCurrentPage("feed")
  }

  const handleShareAlpha = (user: User, trade: any) => {
    setShareUser(user)
    setShareTrade(trade)
    setIsShareModalOpen(true)
  }

  const handleShareToFarcaster = async () => {
    try {
      // Here you would integrate with Farcaster API to share the alpha card
      console.log("Sharing to Farcaster:", {
        user: shareUser,
        trade: shareTrade
      })

      // Mock success - in real app, you'd handle the actual sharing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Close modal on success
      setIsShareModalOpen(false)
      setShareUser(null)
      setShareTrade(null)
    } catch (error) {
      console.error("Failed to share to Farcaster:", error)
    }
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "feed":
        return (
          <FeedPage
            onViewDetails={handleViewDetails}
            onOpenSettings={handleOpenSettings}
          />
        )
      case "details":
        return (
          <SignalDetailsPage
            userId={selectedUserId!}
            tradeId={selectedTradeId!}
            onBack={handleBackToFeed}
            onShareAlpha={handleShareAlpha}
          />
        )
      case "settings":
        return <SettingsPage onBack={handleBackFromSettings} />
      default:
        return (
          <FeedPage
            onViewDetails={handleViewDetails}
            onOpenSettings={handleOpenSettings}
          />
        )
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900">
        {renderCurrentPage()}

        {/* Share Alpha Card Modal */}
        {shareUser && shareTrade && (
          <ShareAlphaCard
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            user={shareUser}
            trade={shareTrade}
            onShareToFarcaster={handleShareToFarcaster}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
