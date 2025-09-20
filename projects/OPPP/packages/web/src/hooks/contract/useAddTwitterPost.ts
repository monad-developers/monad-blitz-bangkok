import { Address, encodeFunctionData } from "viem"

import { contracts, SonadAbi } from "../../lib/contract"
import { useWalletAccount } from "../wallet/useWalletAccount"

export const useAddPost = () => {
  const walletAccount = useWalletAccount()
  const sendTx = async (tweetId: string, creator: Address, content: string) => {
    const txBuidler = encodeFunctionData({
      abi: SonadAbi,
      functionName: "verifyAndRegisterPost",
      args: [tweetId, creator, content],
    })

    const tx = await walletAccount.sendTransaction(
      contracts.SonadContract,
      0n,
      txBuidler
    )
    console.log(tx)
  }
  return sendTx
}
