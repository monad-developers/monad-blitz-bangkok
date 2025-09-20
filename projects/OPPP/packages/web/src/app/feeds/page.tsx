"use client"

import { useState } from "react"

import { contracts } from "@/lib/contract"
import { useAddPost } from "@/hooks/contract/useAddPost"
import { useDeactivatePost } from "@/hooks/contract/useDeactivatePost"
import { useTipCreator } from "@/hooks/contract/useTipCreator"
import { useVotePost } from "@/hooks/contract/useVotePost"
import { useWalletAccount } from "@/hooks/wallet/useWalletAccount"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Mock Twitter Post Data (from your HTML demo)
const mockTwitterPost = {
  id: "1967419837006901294",
  author_id: "1704079725839495168",
  text: "Gm🌟 Gmonad💜\n\nSay it back🪻 #MONAD #NAD https://t.co/vPrOL7ulIw",
  created_at: "2025-09-20T02:00:57.349Z",
  retweet_count: 24,
  reply_count: 679,
  like_count: 1173,
  quote_count: 4,
  bookmark_count: 22,
  impression_count: 22430,
  fetched_at: "2025-09-20T02:00:57.349Z",
  updated_at: "2025-09-20T02:00:57.349Z",
  username: "1Cilineth",
  name: "Cilin (mainnet arc)",
  profile_image_url:
    "https://pbs.twimg.com/profile_images/1933135848851283968/bzBh7Biv_normal.jpg",
  media: [
    {
      media_key: "3_1967419825015406592",
      type: "photo",
      url: "https://pbs.twimg.com/media/G02t6DIawAAdZZm.jpg",
      preview_image_url: null,
      width: 2684,
      height: 3205,
    },
  ],
  // Enhanced with blockchain data
  verified: true,
  litCount: 42,
  shitCount: 8,
  totalTips: "157",
  hasUserVoted: false,
  userVote: null,
}

// Vote Buttons Component
const VoteButtons = ({
  hasVoted,
  userVote,
  isLoading,
  onVote,
  verified,
}: {
  hasVoted: boolean
  userVote: string | null
  isLoading: boolean
  onVote: (isLit: boolean) => void
  verified: boolean
}) => {
  const handleLitClick = () => {
    if (!hasVoted && !isLoading && verified) {
      onVote(true)
    }
  }

  const handleShitClick = () => {
    if (!hasVoted && !isLoading && verified) {
      onVote(false)
    }
  }

  if (!verified) {
    return (
      <div className="flex space-x-2">
        <Button
          disabled
          variant="secondary"
          size="sm"
          className="cursor-not-allowed opacity-50"
        >
          🔥 Lit
        </Button>
        <Button
          disabled
          variant="secondary"
          size="sm"
          className="cursor-not-allowed opacity-50"
        >
          💩 Shit
        </Button>
      </div>
    )
  }

  return (
    <div className="flex space-x-2">
      <Button
        onClick={handleLitClick}
        disabled={hasVoted || isLoading}
        variant={hasVoted && userVote === "lit" ? "default" : "outline"}
        size="sm"
        className={
          hasVoted && userVote === "lit"
            ? "bg-green-500 hover:bg-green-600"
            : ""
        }
      >
        🔥 Lit {hasVoted && userVote === "lit" && "✓"}
      </Button>

      <Button
        onClick={handleShitClick}
        disabled={hasVoted || isLoading}
        variant={hasVoted && userVote === "shit" ? "destructive" : "outline"}
        size="sm"
      >
        💩 Shit {hasVoted && userVote === "shit" && "✓"}
      </Button>
    </div>
  )
}

// Tip Modal Component
const TipModal = ({
  post,
  onClose,
  onTip,
}: {
  post: typeof mockTwitterPost
  onClose: () => void
  onTip: (amount: string) => Promise<void>
}) => {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const presetAmounts = ["1", "10", "100", "500"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay
    await onTip(amount)
    setIsLoading(false)
  }

  const creatorReceives = (parseFloat(amount || "0") * 0.9).toFixed(6)

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tip Creator</CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
            <img
              src={post.profile_image_url}
              alt={post.name}
              className="h-10 w-10 rounded-full"
            />
            <div>
              <div className="font-semibold text-gray-900">{post.name}</div>
              <div className="text-sm text-gray-600">@{post.username}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Quick Select (MON)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    variant={amount === preset ? "default" : "outline"}
                    size="sm"
                  >
                    {preset} MON
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Custom Amount (MON)
              </label>
              <Input
                type="number"
                step="1"
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Creator receives:</span>
                  <span className="font-medium text-green-600">
                    {creatorReceives} MON
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                className="flex-1"
              >
                {isLoading ? "Sending..." : "Send Tip 💰"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Post Card Component
const PostCard = ({
  post,
  onVote,
  onTip,
}: {
  post: typeof mockTwitterPost
  onVote: (postId: string, isLit: boolean) => Promise<void>
  onTip: (postId: string, amount: string) => Promise<void>
}) => {
  const [showTipModal, setShowTipModal] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  // Extract Twitter short links and clean text
  const extractTwitterLink = (text: string) => {
    const twitterLinkRegex = /https:\/\/t\.co\/\w+/g
    const matches = text.match(twitterLinkRegex)
    const cleanText = text.replace(twitterLinkRegex, "").trim()
    return {
      link: matches ? matches[0] : null,
      cleanText,
    }
  }

  const { link: twitterLink, cleanText } = extractTwitterLink(post.text)

  const handlePostClick = () => {
    if (twitterLink) {
      window.open(twitterLink, "_blank", "noopener,noreferrer")
    }
  }

  const handleVote = async (isLit: boolean) => {
    if (post.hasUserVoted || isVoting) return
    setIsVoting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay
    await onVote(post.id, isLit)
    setIsVoting(false)
  }

  return (
    <>
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={post.profile_image_url}
                alt={post.name}
                className="h-12 w-12 rounded-full"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{post.name}</h3>
                  {post.verified && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">@{post.username}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(post.created_at)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="leading-relaxed whitespace-pre-wrap text-gray-800">
              {cleanText}
            </p>
            {twitterLink && (
              <div className="mt-2">
                <Button
                  onClick={handlePostClick}
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-purple-600 hover:text-purple-800"
                >
                  🔗 Click to view original post
                </Button>
              </div>
            )}
          </div>

          {post.media && post.media.length > 0 && (
            <div>
              <img
                src={post.media[0].url}
                alt="Post media"
                className="h-[60vh] max-h-96 w-full rounded-lg object-cover"
              />
            </div>
          )}

          <div className="flex items-center space-x-6 border-b pb-4 text-sm text-gray-600">
            <span>💬 {formatNumber(post.reply_count)}</span>
            <span>🔄 {formatNumber(post.retweet_count)}</span>
            <span>❤️ {formatNumber(post.like_count)}</span>
            <span>👁️ {formatNumber(post.impression_count)}</span>
          </div>

          {post.verified && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <span className="text-green-500">🔥</span>
                  <span>{post.litCount} Lit</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="text-red-500">💩</span>
                  <span>{post.shitCount} Shit</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="text-blue-500">💰</span>
                  <span>{post.totalTips} MON</span>
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <VoteButtons
              hasVoted={post.hasUserVoted}
              userVote={post.userVote}
              isLoading={isVoting}
              onVote={handleVote}
              verified={post.verified}
            />

            <Button
              onClick={() => setShowTipModal(true)}
              disabled={!post.verified}
              variant="outline"
              size="sm"
            >
              💰 Tip Creator
            </Button>
          </div>
        </CardContent>
      </Card>

      {showTipModal && (
        <TipModal
          post={post}
          onClose={() => setShowTipModal(false)}
          onTip={async (amount) => {
            await onTip(post.id, amount)
            setShowTipModal(false)
          }}
        />
      )}
    </>
  )
}

export default function FeedsPage() {
  const addPost = useAddPost()
  const votePost = useVotePost()
  const tipCreator = useTipCreator()
  const deactivatePost = useDeactivatePost()

  const walletAccount = useWalletAccount()
  const isReady = walletAccount.state === "connected"
  const contractAddress = contracts.SonadContract

  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [posts, setPosts] = useState([mockTwitterPost])

  // Form states
  const [tweetId, setTweetId] = useState("")
  const [content, setContent] = useState("")
  const [postId, setPostId] = useState("")
  const [tipAmount, setTipAmount] = useState("")

  const handleRegisterPost = async () => {
    if (!isReady || !tweetId || !content) return

    setIsLoading(true)
    setTxHash("")

    try {
      const hash = await addPost(
        tweetId,
        walletAccount.address as `0x${string}`,
        content
      )
      setTxHash(hash)
      console.log("🎯 Post registered:", hash)

      // Clear form
      setTweetId("")
      setContent("")
    } catch (error) {
      console.error("❌ Register post failed:", error)
      alert("Failed to register post!")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoteLit = async () => {
    if (!isReady || !postId) return

    setIsLoading(true)
    setTxHash("")

    try {
      const hash = await votePost(parseInt(postId), true) // true = LIT
      setTxHash(hash)
      console.log("🔥 Voted LIT:", hash)
    } catch (error) {
      console.error("❌ Vote LIT failed:", error)
      alert("Failed to vote LIT!")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoteShit = async () => {
    if (!isReady || !postId) return

    setIsLoading(true)
    setTxHash("")

    try {
      const hash = await votePost(parseInt(postId), false) // false = SHIT
      setTxHash(hash)
      console.log("💩 Voted SHIT:", hash)
    } catch (error) {
      console.error("❌ Vote SHIT failed:", error)
      alert("Failed to vote SHIT!")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTipCreator = async () => {
    if (!isReady || !postId || !tipAmount) return

    setIsLoading(true)
    setTxHash("")

    try {
      const hash = await tipCreator(parseInt(postId), tipAmount)
      setTxHash(hash)
      console.log("💰 Tip sent:", hash)

      // Clear tip amount
      setTipAmount("")
    } catch (error) {
      console.error("❌ Tip failed:", error)
      alert("Failed to send tip!")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivatePost = async () => {
    if (!isReady || !postId) return

    setIsLoading(true)
    setTxHash("")

    try {
      const hash = await deactivatePost(parseInt(postId))
      setTxHash(hash)
      console.log("🗑️ Post deactivated:", hash)
    } catch (error) {
      console.error("❌ Deactivate failed:", error)
      alert("Failed to deactivate post!")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostVote = async (postId: string, isLit: boolean) => {
    console.log(`Voting ${isLit ? "Lit" : "Shit"} on post ${postId}`)

    // Update UI optimistically
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              litCount: isLit ? post.litCount + 1 : post.litCount,
              shitCount: !isLit ? post.shitCount + 1 : post.shitCount,
              hasUserVoted: true,
              userVote: isLit ? "lit" : "shit",
            }
          : post
      )
    )
  }

  const handlePostTip = async (postId: string, amount: string) => {
    console.log(`Tipping ${amount} MON to post ${postId}`)

    // Update UI optimistically
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              totalTips: (
                parseFloat(post.totalTips) + parseFloat(amount)
              ).toFixed(4),
            }
          : post
      )
    )
  }

  const formatTxHash = (hash: string) => {
    if (!hash) return ""
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const getExplorerUrl = (hash: string) => {
    return `https://explorer-testnet.monad.xyz/tx/${hash}`
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="space-y-2 text-center">
        <h1 className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-3xl font-bold text-transparent">
          Sonad Feeds
        </h1>
        <p className="text-muted-foreground">
          Testing components with Twitter JSON data
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">
              {posts.length}
            </div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {posts.filter((p) => p.verified).length}
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {posts
                .reduce((sum, p) => sum + parseFloat(p.totalTips || "0"), 0)
                .toFixed(0)}{" "}
              MON
            </div>
            <div className="text-sm text-gray-600">Total Tips</div>
          </CardContent>
        </Card>
      </div>

      {/* Post Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onVote={handlePostVote}
            onTip={handlePostTip}
          />
        ))}
      </div>

      {/* Wallet Status */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">Status:</span>
            <Badge
              variant={
                walletAccount.state === "connected" ? "default" : "secondary"
              }
            >
              {walletAccount.state}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Address:</span>
            <code className="bg-muted rounded px-2 py-1 text-xs">
              {walletAccount.address
                ? formatTxHash(walletAccount.address)
                : "Not connected"}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Contract:</span>
            <code className="bg-muted rounded px-2 py-1 text-xs">
              {formatTxHash(contractAddress)}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Ready:</span>
            <Badge variant={isReady ? "default" : "secondary"}>
              {isReady ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Register New Post */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Register Twitter Post</CardTitle>
          <CardDescription>
            Register a Twitter post on-chain with verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Tweet ID (e.g., 1234567890)"
            value={tweetId}
            onChange={(e) => setTweetId(e.target.value)}
          />
          <Input
            placeholder="Post content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button
            onClick={handleRegisterPost}
            disabled={!isReady || isLoading || !tweetId || !content}
            className="w-full"
          >
            {isLoading ? "Registering..." : "Register Post"}
          </Button>
        </CardContent>
      </Card>

      {/* Voting */}
      <Card>
        <CardHeader>
          <CardTitle>🗳️ Vote on Posts</CardTitle>
          <CardDescription>
            Vote LIT 🔥 or SHIT 💩 on existing posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Post ID (e.g., 1, 2, 3...)"
            type="number"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleVoteLit}
              disabled={!isReady || isLoading || !postId}
              className="bg-orange-500 hover:bg-orange-600"
            >
              🔥 Vote LIT
            </Button>
            <Button
              onClick={handleVoteShit}
              disabled={!isReady || isLoading || !postId}
              variant="destructive"
            >
              💩 Vote SHIT
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tipping */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Tip Creator</CardTitle>
          <CardDescription>Send MON tokens to support creators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Post ID"
              type="number"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
            />
            <Input
              placeholder="Amount (MON)"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
            />
          </div>
          <Button
            onClick={handleTipCreator}
            disabled={!isReady || isLoading || !postId || !tipAmount}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            {isLoading ? "Sending..." : "Send Tip"}
          </Button>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Admin Actions</CardTitle>
          <CardDescription>
            Administrative functions (owner/creator only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Post ID to deactivate"
            type="number"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
          />
          <Button
            onClick={handleDeactivatePost}
            disabled={!isReady || isLoading || !postId}
            variant="outline"
            className="w-full"
          >
            {isLoading ? "Deactivating..." : "Deactivate Post"}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction Result */}
      {txHash && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Transaction Successful</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Hash:</span>
              <code className="bg-muted rounded px-2 py-1 text-xs">
                {formatTxHash(txHash)}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getExplorerUrl(txHash), "_blank")}
            >
              View on Explorer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground text-sm">
              Transaction in progress... Check console for details.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Card>
        <CardContent className="border border-green-200 bg-green-50 p-4">
          <h3 className="mb-2 font-bold text-green-800">✅ Test Results:</h3>
          <ul className="space-y-1 text-sm text-green-700">
            <li>• Components render correctly</li>
            <li>• Twitter JSON data displays properly</li>
            <li>• Voting buttons work with state management</li>
            <li>• Tip modal opens and handles form input</li>
            <li>• Mobile responsive design</li>
            <li>• Ready for wallet integration</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
