import { encodeFunctionData, parseEther } from "viem"

import { contracts, SonadAbi } from "../../lib/contract"
import { useWalletAccount } from "../wallet/useWalletAccount"

export const useTipCreator = () => {
  const walletAccount = useWalletAccount()

  const sendTx = async (postId: number, tipAmount: string) => {
    if (walletAccount.state !== "connected") {
      throw new Error("Wallet not connected")
    }

    const value = parseEther(tipAmount)

    const txBuilder = encodeFunctionData({
      abi: SonadAbi,
      functionName: "tipCreator",
      args: [postId],
    } as const)

    const tx = await walletAccount.sendTransaction(
      contracts.SonadContract,
      value,
      txBuilder
    )
    console.log("Tip sent:", tx)
    return tx
  }

  return sendTx
}