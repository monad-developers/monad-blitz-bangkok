import { useSendTransaction } from "@privy-io/react-auth"
import { Address, encodeFunctionData } from "viem"

import { publicClient } from "@/lib/contract"

import { useEmbeddedPrivyWallet } from "./wallet/useEmbeddedPrivyWallet"

export const useContractTransaction = () => {
  const { sendTransaction } = useSendTransaction({
    onSuccess: (txReceipt) => {
      // console.log("Contract transaction confirmed:", txReceipt.transactionHash)
      console.log("Transaction receipt:", txReceipt)
    },
    onError: (error) => {
      console.error("Contract transaction failed:", error)
    },
  })

  const embeddedWallet = useEmbeddedPrivyWallet()

  const executeContractTransaction = async ({
    contractAddress,
    abi,
    functionName,
    args = [],
    value = 0n,
    gasBuffer = 20, // 20% gas buffer
  }: {
    contractAddress: Address
    abi: any[]
    functionName: string
    args?: any[]
    value?: bigint
    gasBuffer?: number
  }) => {
    if (!embeddedWallet) {
      throw new Error("No embedded wallet available")
    }

    try {
      console.log("Executing contract transaction:", {
        contractAddress,
        functionName,
        args,
        value: value.toString(),
        wallet: embeddedWallet.address,
      })

      // Encode function data
      const data = encodeFunctionData({
        abi,
        functionName,
        args,
      })

      console.log("Encoded function data:", data)

      // Gas estimation (critical for production)
      const gasEstimate = await publicClient.estimateGas({
        to: contractAddress,
        data,
        value,
        account: embeddedWallet.address as Address,
      })

      console.log("Gas estimate:", gasEstimate.toString())

      const gasLimit = (gasEstimate * BigInt(100 + gasBuffer)) / 100n
      console.log("Gas limit with buffer:", gasLimit.toString())

      // Execute transaction
      const txHash = await sendTransaction({
        to: contractAddress,
        data,
        value,
      })

      console.log("Transaction hash:", txHash)
      return txHash
    } catch (error: any) {
      console.error("Contract transaction error:", error)
      throw new Error(`Contract transaction failed: ${error.message}`)
    }
  }

  // Helper function for common transactions
  const executeSimpleTransaction = async ({
    to,
    value = 0n,
    gasBuffer = 20,
  }: {
    to: Address
    value?: bigint
    gasBuffer?: number
  }) => {
    if (!embeddedWallet) {
      throw new Error("No embedded wallet available")
    }

    try {
      console.log("Executing simple transaction:", {
        to,
        value: value.toString(),
        wallet: embeddedWallet.address,
      })

      // Gas estimation for simple transfer
      const gasEstimate = await publicClient.estimateGas({
        to,
        value,
        account: embeddedWallet.address as Address,
      })

      const gasLimit = (gasEstimate * BigInt(100 + gasBuffer)) / 100n

      // Execute transaction
      const txHash = await sendTransaction({
        to,
        value,
      })

      console.log("Simple transaction hash:", txHash)
      return txHash
    } catch (error: any) {
      console.error("Simple transaction error:", error)
      throw new Error(`Simple transaction failed: ${error.message}`)
    }
  }

  return {
    executeContractTransaction,
    executeSimpleTransaction,
    embeddedWallet,
    isWalletReady: !!embeddedWallet,
  }
}

// Specific hook for your contract
export const useYoungGuRuPikadTransaction = () => {
  const { executeContractTransaction, embeddedWallet, isWalletReady } =
    useContractTransaction()

  const configVerifier = async (key: string, verifierAddress: Address) => {
    const { contracts, YOUNG_GU_RU_PIKAD_PROXY_ABI } = await import(
      "@/lib/contract"
    )

    return executeContractTransaction({
      contractAddress: contracts.youngGuRuPikadProxy,
      abi: YOUNG_GU_RU_PIKAD_PROXY_ABI,
      functionName: "configVerifier",
      args: [key, verifierAddress],
    })
  }

  const verifyDek = async (
    key: string,
    proof: string,
    publicInputs: string[]
  ) => {
    const { contracts, YOUNG_GU_RU_PIKAD_PROXY_ABI } = await import(
      "@/lib/contract"
    )

    return executeContractTransaction({
      contractAddress: contracts.youngGuRuPikadProxy,
      abi: YOUNG_GU_RU_PIKAD_PROXY_ABI,
      functionName: "verifyDek",
      args: [key, proof, publicInputs],
    })
  }

  const verifyMia = async (
    key: string,
    proof: string,
    publicInputs: string[]
  ) => {
    const { contracts, YOUNG_GU_RU_PIKAD_PROXY_ABI } = await import(
      "@/lib/contract"
    )

    return executeContractTransaction({
      contractAddress: contracts.youngGuRuPikadProxy,
      abi: YOUNG_GU_RU_PIKAD_PROXY_ABI,
      functionName: "verifyMia",
      args: [key, proof, publicInputs],
    })
  }

  const transferOwnership = async (newOwner: Address) => {
    const { contracts, YOUNG_GU_RU_PIKAD_PROXY_ABI } = await import(
      "@/lib/contract"
    )

    return executeContractTransaction({
      contractAddress: contracts.youngGuRuPikadProxy,
      abi: YOUNG_GU_RU_PIKAD_PROXY_ABI,
      functionName: "transferOwnership",
      args: [newOwner],
    })
  }

  const setAdmin = async (newAdmin: Address) => {
    const { contracts, YOUNG_GU_RU_PIKAD_PROXY_ABI } = await import(
      "@/lib/contract"
    )

    return executeContractTransaction({
      contractAddress: contracts.youngGuRuPikadProxy,
      abi: YOUNG_GU_RU_PIKAD_PROXY_ABI,
      functionName: "setAdmin",
      args: [newAdmin],
    })
  }

  return {
    configVerifier,
    verifyDek,
    verifyMia,
    transferOwnership,
    setAdmin,
    embeddedWallet,
    isWalletReady,
  }
}
