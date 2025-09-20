import { encodeFunctionData } from "viem"

import { contracts, SonadAbi } from "../../lib/contract"
import { useWalletAccount } from "../wallet/useWalletAccount"

export const useDeactivatePost = () => {
  const walletAccount = useWalletAccount()

  const sendTx = async (postId: number) => {
    if (walletAccount.state !== "connected") {
      throw new Error("Wallet not connected")
    }

    const txBuilder = encodeFunctionData({
      abi: SonadAbi,
      functionName: "deactivatePost",
      args: [postId],
    } as const)

    const tx = await walletAccount.sendTransaction(
      contracts.SonadContract,
      0n,
      txBuilder
    )
    console.log("Post deactivated:", tx)
    return tx
  }

  return sendTx
}