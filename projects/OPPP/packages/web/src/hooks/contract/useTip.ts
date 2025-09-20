import { QueryClient, useQuery } from "@tanstack/react-query"
import { useWallets } from "@privy-io/react-auth"

export const refreshTokenBalances = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === "token-balances",
  })
}

export const useTokenBalances = () => {
  const { wallets } = useWallets()
  const address = wallets.find(wallet => wallet.walletClientType === 'privy')?.address

  return useQuery({
    queryKey: ["token-balances", address],
    queryFn: async () => {
      if (!address) return { usdc: 0, weth: 0 }

      return {
        usdc: 0,
        weth: 0,
      }
    },
    refetchInterval: 1000 * 30, // 30 seconds
  })
}
