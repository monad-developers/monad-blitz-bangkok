"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useContractInteraction } from "@/hooks/useContractInteraction"
import { contracts, YOUNG_GU_RU_PIKAD_PROXY_ABI } from "@/lib/contract"
import { parseEther } from "viem"

export default function ContractInteractionExample() {
  const { writeContract, sendTransaction, getWalletInfo } = useContractInteraction()
  const [isLoading, setIsLoading] = useState(false)

  const { wallet, address, isReady } = getWalletInfo(0)

  // Example 1: Any contract function call
  const handleAnyContractCall = async () => {
    if (!isReady) return

    setIsLoading(true)
    try {
      const txHash = await writeContract({
        address: contracts.youngGuRuPikadProxy,
        abi: YOUNG_GU_RU_PIKAD_PROXY_ABI,
        functionName: "getOwner", // Any function name
        args: [], // Any arguments
        value: 0n, // Any value
        gasBuffer: 25 // Custom gas buffer
      })
      console.log("Contract call successful:", txHash)
    } catch (error) {
      console.error("Contract call failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Example 2: Transfer ownership
  const handleTransferOwnership = async () => {
    if (!isReady) return

    setIsLoading(true)
    try {
      const newOwner = "0x1234567890123456789012345678901234567890" // Replace with real address
      const txHash = await writeContract({
        address: contracts.youngGuRuPikadProxy,
        abi: YOUNG_GU_RU_PIKAD_PROXY_ABI,
        functionName: "transferOwnership",
        args: [newOwner]
      })
      console.log("Ownership transferred:", txHash)
    } catch (error) {
      console.error("Transfer ownership failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Example 3: Configure verifier
  const handleConfigVerifier = async () => {
    if (!isReady) return

    setIsLoading(true)
    try {
      const key = "0x1234567890123456789012345678901234567890123456789012345678901234"
      const verifierAddress = "0x1234567890123456789012345678901234567890"

      const txHash = await writeContract({
        address: contracts.youngGuRuPikadProxy,
        abi: YOUNG_GU_RU_PIKAD_PROXY_ABI,
        functionName: "configVerifier",
        args: [key, verifierAddress]
      })
      console.log("Verifier configured:", txHash)
    } catch (error) {
      console.error("Config verifier failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Example 4: Simple MON transfer
  const handleSendMON = async () => {
    if (!isReady) return

    setIsLoading(true)
    try {
      const recipient = "0x1234567890123456789012345678901234567890" // Replace with real address
      const amount = parseEther("1.0") // 1 MON

      const txHash = await sendTransaction({
        to: recipient as `0x${string}`,
        value: amount
      })
      console.log("MON sent:", txHash)
    } catch (error) {
      console.error("Send MON failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Generic Contract Interaction</h3>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Wallet Address: {address || "Not connected"}
        </p>
        <p className="text-sm text-muted-foreground">
          Wallet Ready: {isReady ? "Yes" : "No"}
        </p>
        <p className="text-sm text-muted-foreground">
          Contract: {contracts.youngGuRuPikadProxy}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleAnyContractCall}
          disabled={!isReady || isLoading}
          variant="outline"
        >
          Any Contract Call
        </Button>

        <Button
          onClick={handleTransferOwnership}
          disabled={!isReady || isLoading}
          variant="outline"
        >
          Transfer Ownership
        </Button>

        <Button
          onClick={handleConfigVerifier}
          disabled={!isReady || isLoading}
          variant="outline"
        >
          Config Verifier
        </Button>

        <Button
          onClick={handleSendMON}
          disabled={!isReady || isLoading}
          variant="outline"
        >
          Send 1 MON
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Transaction in progress...</p>
      )}
    </div>
  )
}