"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSonadContract, useOracleContract } from "@/hooks/contract/useSonadContract"
import { parseEther } from "viem"

export default function SonadAppExample() {
  const {
    verifyAndRegisterPost,
    voteOnPost,
    tipCreator,
    deactivatePost,
    walletAccount,
    isReady
  } = useSonadContract()

  const {
    configVerifier,
    verifyDek,
    verifyMia
  } = useOracleContract()

  const [isLoading, setIsLoading] = useState(false)
  const [tweetId, setTweetId] = useState("")
  const [content, setContent] = useState("")
  const [postId, setPostId] = useState("")
  const [tipAmount, setTipAmount] = useState("")

  // Example 1: Register a new post
  const handleRegisterPost = async () => {
    if (!isReady || !tweetId || !content) return

    setIsLoading(true)
    try {
      const txHash = await verifyAndRegisterPost(
        tweetId,
        walletAccount.address as `0x${string}`,
        content
      )
      console.log("Post registered:", txHash)
      alert(`Post registered! TX: ${txHash}`)
    } catch (error) {
      console.error("Register post failed:", error)
      alert("Register post failed!")
    } finally {
      setIsLoading(false)
    }
  }

  // Example 2: Vote LIT on a post
  const handleVoteLit = async () => {
    if (!isReady || !postId) return

    setIsLoading(true)
    try {
      const txHash = await voteOnPost(parseInt(postId), true) // true = LIT
      console.log("Voted LIT:", txHash)
      alert(`Voted LIT! TX: ${txHash}`)
    } catch (error) {
      console.error("Vote failed:", error)
      alert("Vote failed!")
    } finally {
      setIsLoading(false)
    }
  }

  // Example 3: Vote SHIT on a post
  const handleVoteShit = async () => {
    if (!isReady || !postId) return

    setIsLoading(true)
    try {
      const txHash = await voteOnPost(parseInt(postId), false) // false = SHIT
      console.log("Voted SHIT:", txHash)
      alert(`Voted SHIT! TX: ${txHash}`)
    } catch (error) {
      console.error("Vote failed:", error)
      alert("Vote failed!")
    } finally {
      setIsLoading(false)
    }
  }

  // Example 4: Tip creator
  const handleTipCreator = async () => {
    if (!isReady || !postId || !tipAmount) return

    setIsLoading(true)
    try {
      const txHash = await tipCreator(parseInt(postId), tipAmount)
      console.log("Tip sent:", txHash)
      alert(`Tip sent! TX: ${txHash}`)
    } catch (error) {
      console.error("Tip failed:", error)
      alert("Tip failed!")
    } finally {
      setIsLoading(false)
    }
  }

  // Example 5: Deactivate post
  const handleDeactivatePost = async () => {
    if (!isReady || !postId) return

    setIsLoading(true)
    try {
      const txHash = await deactivatePost(parseInt(postId))
      console.log("Post deactivated:", txHash)
      alert(`Post deactivated! TX: ${txHash}`)
    } catch (error) {
      console.error("Deactivate failed:", error)
      alert("Deactivate failed!")
    } finally {
      setIsLoading(false)
    }
  }

  // Example 6: Oracle verification
  const handleVerifyProof = async () => {
    if (!isReady) return

    setIsLoading(true)
    try {
      const key = "0x1234567890123456789012345678901234567890123456789012345678901234"
      const proof = "0xproof..."
      const publicInputs = ["0x123", "0x456"]

      const txHash = await verifyDek(key, proof, publicInputs)
      console.log("Proof verified:", txHash)
      alert(`Proof verified! TX: ${txHash}`)
    } catch (error) {
      console.error("Verification failed:", error)
      alert("Verification failed!")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sonad Contract Interactions</h1>

      {/* Wallet Status */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">Wallet Status</h3>
        <p className="text-sm text-muted-foreground">
          State: {walletAccount.state}
        </p>
        <p className="text-sm text-muted-foreground">
          Address: {walletAccount.address || "Not connected"}
        </p>
        <p className="text-sm text-muted-foreground">
          Ready: {isReady ? "Yes" : "No"}
        </p>
      </div>

      {/* Register Post */}
      <div className="p-4 border rounded-lg space-y-3">
        <h3 className="font-semibold">Register New Post</h3>
        <Input
          placeholder="Tweet ID"
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
          Register Post
        </Button>
      </div>

      {/* Voting */}
      <div className="p-4 border rounded-lg space-y-3">
        <h3 className="font-semibold">Vote on Post</h3>
        <Input
          placeholder="Post ID"
          type="number"
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleVoteLit}
            disabled={!isReady || isLoading || !postId}
            variant="default"
            className="flex-1"
          >
            Vote LIT 🔥
          </Button>
          <Button
            onClick={handleVoteShit}
            disabled={!isReady || isLoading || !postId}
            variant="destructive"
            className="flex-1"
          >
            Vote SHIT 💩
          </Button>
        </div>
      </div>

      {/* Tipping */}
      <div className="p-4 border rounded-lg space-y-3">
        <h3 className="font-semibold">Tip Creator</h3>
        <Input
          placeholder="Post ID"
          type="number"
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
        />
        <Input
          placeholder="Tip amount (MON)"
          value={tipAmount}
          onChange={(e) => setTipAmount(e.target.value)}
        />
        <Button
          onClick={handleTipCreator}
          disabled={!isReady || isLoading || !postId || !tipAmount}
          className="w-full"
        >
          Send Tip 💰
        </Button>
      </div>

      {/* Admin Functions */}
      <div className="p-4 border rounded-lg space-y-3">
        <h3 className="font-semibold">Admin Functions</h3>
        <Button
          onClick={handleDeactivatePost}
          disabled={!isReady || isLoading || !postId}
          variant="outline"
          className="w-full"
        >
          Deactivate Post
        </Button>
        <Button
          onClick={handleVerifyProof}
          disabled={!isReady || isLoading}
          variant="outline"
          className="w-full"
        >
          Verify Oracle Proof
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">
            Transaction in progress... Check console for details.
          </p>
        </div>
      )}
    </div>
  )
}