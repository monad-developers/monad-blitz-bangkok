import { encodeFunctionData } from "viem"

import { contracts, SonadAbi } from "../../lib/contract"
import { useWalletAccount } from "../wallet/useWalletAccount"

export const useVotePost = () => {
  const walletAccount = useWalletAccount()

  const sendTx = async (postId: number, isLit: boolean) => {
    if (walletAccount.state !== "connected") {
      throw new Error("Wallet not connected")
    }

    const txBuilder = encodeFunctionData({
      abi: SonadAbi,
      functionName: "vote",
      args: [postId, isLit],
    } as const)

    const tx = await walletAccount.sendTransaction(
      contracts.SonadContract,
      0n,
      txBuilder
    )
    console.log("Vote cast:", tx)
    return tx
  }

  return sendTx
}