import { useMemo } from "react"
import {
  useLogin,
  useLogout,
  usePrivy,
  useSendTransaction,
} from "@privy-io/react-auth"
import { Address, encodeFunctionData } from "viem"

import { publicClient } from "@/lib/contract"

import { useEmbeddedPrivyWallet } from "./useEmbeddedPrivyWallet"
import { monadTestnet } from "viem/chains"

interface ContractCallOptions {
  address: Address
  abi: any[]
  functionName: string
  args?: any[]
  value?: bigint
  gasBuffer?: number
}

interface WalletAccountStateBase {
  state: "connected" | "disconnected"
  walletName: string | null
  connector: string | null
  address: string | null

  connectModalVisible: boolean
  connect(): Promise<void>
  disconnect(): Promise<void>

  sendTransaction?: (
    to: Address,
    value?: bigint,
    data?: `0x${string}`
  ) => Promise<string>
  contractCall?: (options: ContractCallOptions) => Promise<string>
  signMessage?: (message: string) => Promise<string>
}

interface WalletAccountStateConnected extends WalletAccountStateBase {
  state: "connected"
  connected: boolean
  walletName: string
  address: string

  sendTransaction: NonNullable<WalletAccountStateBase["sendTransaction"]>
  contractCall: NonNullable<WalletAccountStateBase["contractCall"]>
  signMessage: NonNullable<WalletAccountStateBase["signMessage"]>
}

interface WalletAccountStateDisconnected extends WalletAccountStateBase {
  state: "disconnected"
  connected: boolean
  walletName: null
  address: null
}

export type WalletAccountState =
  | WalletAccountStateConnected
  | WalletAccountStateDisconnected

/**
 * useWalletAccount abstracts away the wallet connection layer for EVM.
 * Provides unified interface for Privy embedded wallets and external wallets.
 */
export const useWalletAccount = (): WalletAccountState => {
  const { ready, authenticated, isModalOpen } = usePrivy()
  const embeddedWallet = useEmbeddedPrivyWallet()
  const { login } = useLogin()
  const { logout } = useLogout()

  const { sendTransaction: privySendTransaction } = useSendTransaction({
    onSuccess: (txReceipt) => {
      console.log("Transaction confirmed:", txReceipt.hash)
    },
    onError: (error) => {
      console.error("Transaction failed:", error)
    },
  })

  const state = useMemo<WalletAccountState["state"]>(() => {
    if (ready && authenticated && embeddedWallet) return "connected"
    return "disconnected"
  }, [authenticated, ready, embeddedWallet])

  const walletAccount = useMemo<WalletAccountState>(() => {
    if (state !== "connected" || !authenticated || !embeddedWallet) {
      const notConnectedResult: WalletAccountStateDisconnected = {
        state: "disconnected",
        connected: false,
        connector: null,
        walletName: null,
        address: null,
        connectModalVisible: isModalOpen,
        connect: async () => {
          login()
          return Promise.resolve()
        },
        disconnect: async () => {
          await logout()
        },
      }
      return notConnectedResult
    }

    const connectedResult: WalletAccountStateConnected = {
      state: "connected",
      connected: true,
      connector: embeddedWallet.connectorType,
      walletName: embeddedWallet.walletClientType,
      address: embeddedWallet.address,

      connectModalVisible: isModalOpen,
      connect: async () => {
        login()
        return Promise.resolve()
      },
      disconnect: async () => {
        await logout()
        return
      },

      // Simple ETH/MON transfer
      sendTransaction: async (
        to: Address,
        value: bigint = 0n,
        data?: `0x${string}`
      ) => {
        try {
          console.log("Sending transaction:", {
            to,
            value: value.toString(),
            data,
          })

          const txResult = await privySendTransaction({
            to,
            value,
            data,
            chainId: monadTestnet.id,
          })

          console.log("Transaction sent:", txResult.hash)
          return txResult.hash
        } catch (error: any) {
          console.error("Send transaction failed:", error)
          throw new Error(`Transaction failed: ${error.message}`)
        }
      },

      // Contract function call
      contractCall: async ({
        address: contractAddress,
        abi,
        functionName,
        args = [],
        value = 0n,
      }: ContractCallOptions) => {
        try {
          console.log("Calling contract function:", {
            contractAddress,
            functionName,
            args,
            value: value.toString(),
          })

          // Encode function data
          const data = encodeFunctionData({
            abi,
            functionName,
            args,
          })

          // Gas estimation
          const gasEstimate = await publicClient.estimateGas({
            to: contractAddress,
            data,
            value,
            account: embeddedWallet.address as Address,
          })

          const txResult = await privySendTransaction({
            to: contractAddress,
            data,
            value,
            chainId: monadTestnet.id,
          })

          console.log("Contract call successful:", txResult.hash)
          return txResult.hash
        } catch (error: any) {
          console.error("Contract call failed:", error)
          throw new Error(`Contract call failed: ${error.message}`)
        }
      },

      // Sign message
      signMessage: async (message: string) => {
        try {
          // For embedded wallets, we'll use a simplified approach
          // In production, you'd want to use the actual wallet client
          console.log("Sign message requested:", message)
          return `0x${"a".repeat(130)}` // Placeholder signature
        } catch (error: any) {
          console.error("Sign message failed:", error)
          throw new Error(`Sign message failed: ${error.message}`)
        }
      },
    }

    return connectedResult
  }, [
    authenticated,
    state,
    embeddedWallet,
    isModalOpen,
    login,
    logout,
    privySendTransaction,
  ])

  return walletAccount
}

// Convenience hooks for specific use cases
export const useContractInteractionV2 = () => {
  const walletAccount = useWalletAccount()

  const callContract = async (options: ContractCallOptions) => {
    if (walletAccount.state !== "connected") {
      throw new Error("Wallet not connected")
    }

    console.log("Encoding contract call:", options)

    // Encode the function data
    const data = encodeFunctionData({
      abi: options.abi,
      functionName: options.functionName,
      args: options.args || [],
    })

    console.log("Encoded data:", data)

    // Send transaction with encoded data
    return walletAccount.sendTransaction(
      options.address,
      options.value || 0n,
      data
    )
  }

  const sendMON = async (to: Address, amount: bigint) => {
    if (walletAccount.state !== "connected") {
      throw new Error("Wallet not connected")
    }
    return walletAccount.sendTransaction(to, amount)
  }

  const signMessage = async (message: string) => {
    if (walletAccount.state !== "connected") {
      throw new Error("Wallet not connected")
    }
    return walletAccount.signMessage(message)
  }

  return {
    walletAccount,
    callContract,
    sendMON,
    signMessage,
    isReady: walletAccount.state === "connected",
  }
}
