import { Address, encodeFunctionData } from "viem"

import { contracts, SonadAbi } from "../../lib/contract"
import { useWalletAccount } from "../wallet/useWalletAccount"

export const useAddPost = () => {
  const walletAccount = useWalletAccount()

  const sendTx = async (tweetId: string, creator: Address, content: string) => {
    if (walletAccount.state !== "connected") {
      throw new Error("Wallet not connected")
    }

    console.log("run here", {
      tweetId,
      creator,
      content,
    })

    const txBuilder = encodeFunctionData({
      abi: SonadAbi,
      functionName: "verifyAndRegisterPost",
      args: [tweetId, creator, content],
    } as const)

    console.log("tx builder: ", txBuilder)
    const tx = await walletAccount.sendTransaction(
      contracts.SonadContract,
      0n,
      txBuilder
    )
    console.log("Post registered:", tx)
    return tx
  }

  return sendTx
}
