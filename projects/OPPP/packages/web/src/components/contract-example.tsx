"use client"

import { useState } from "react"
import { useWalletClient, useWallets } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { useContract, useContractRead } from "@/hooks/oracle/useContract"
import { useContractTransaction, useYoungGuRuPikadTransaction } from "@/hooks/useContractTransaction"
import { useEmbeddedPrivyWallet } from "@/hooks/wallet/useEmbeddedPrivyWallet"
import { contracts } from "@/lib/contract"

export default function ContractExample() {
  const { wallets } = useWallets()
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)

  // Contract instance for writing (requires wallet client)
  const writeContract = useContract(contracts.youngGuRuPikadProxy)

  // Contract instance for reading (public client only)
  const readContract = useContractRead(contracts.youngGuRuPikadProxy)

  // New transaction hooks
  const { executeContractTransaction, executeSimpleTransaction, isWalletReady } = useContractTransaction()
  const { configVerifier, verifyDek, transferOwnership, setAdmin } = useYoungGuRuPikadTransaction()
  const embeddedWallet = useEmbeddedPrivyWallet()

  const handleReadContract = async () => {
    if (!readContract) return

    try {
      // Example: Read owner
      const owner = await readContract.read.getOwner()
      console.log("Contract owner:", owner)

      // Example: Read admin
      const admin = await readContract.read.getAdmin()
      console.log("Contract admin:", admin)

      // Example: Read pause status
      const isPaused = await readContract.read.getPause()
      console.log("Contract paused:", isPaused)
    } catch (error) {
      console.error("Error reading contract:", error)
    }
  }

  const handleWriteContract = async () => {
    if (!writeContract || !embeddedWallet) return

    setIsLoading(true)
    try {
      // Example: Transfer ownership (if you're the owner)
      // const newOwner = "0x..." // New owner address
      // const hash = await writeContract.write.transferOwnership([newOwner])
      // console.log("Transaction hash:", hash)

      // Example: Set admin (if you're the owner)
      // const newAdmin = "0x..." // New admin address
      // const hash = await writeContract.write.setAdmin([newAdmin])
      // console.log("Transaction hash:", hash)

      console.log("Write contract is ready for transactions")
      console.log("Connected wallet:", embeddedWallet.address)
    } catch (error) {
      console.error("Error writing to contract:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Contract Interaction Example</h3>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Contract Address: {contracts.youngGuRuPikadProxy}
        </p>
        <p className="text-sm text-muted-foreground">
          Connected Wallet: {embeddedWallet?.address || "None"}
        </p>
        <p className="text-sm text-muted-foreground">
          Wallet Client Ready: {walletClient ? "Yes" : "No"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleReadContract} variant="outline">
          Read Contract
        </Button>

        <Button
          onClick={handleWriteContract}
          disabled={!writeContract || !embeddedWallet || isLoading}
        >
          {isLoading ? "Loading..." : "Write Contract (Test)"}
        </Button>
      </div>
    </div>
  )
}