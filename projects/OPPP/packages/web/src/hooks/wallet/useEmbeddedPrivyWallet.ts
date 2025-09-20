import { useMemo } from "react"
import { useWallets, usePrivy } from "@privy-io/react-auth"

export const useEmbeddedPrivyWallet = () => {
    const { wallets } = useWallets()

    const embeddedPrivyWallet = useMemo(() => {
        return wallets
            .filter((wallet) => wallet.connectorType === "embedded")
            .find((wallet) => wallet.walletClientType === "privy")
    }, [wallets])
    
    return embeddedPrivyWallet
}

export const useTwitterAuthenticatedWallet = () => {
    const { user } = usePrivy()
    const { wallets } = useWallets()

    const twitterAuthenticatedWallet = useMemo(() => {
        // Check if user authenticated via Twitter
        const hasTwitterAuth = user?.twitter?.username

        if (!hasTwitterAuth) return null

        // Return the embedded Privy wallet for Twitter-authenticated user
        return wallets
            .filter((wallet) => wallet.connectorType === "embedded")
            .find((wallet) => wallet.walletClientType === "privy")
    }, [wallets, user?.twitter])
    
    return {
        wallet: twitterAuthenticatedWallet,
        twitterUsername: user?.twitter?.username,
        isTwitterAuthenticated: !!user?.twitter?.username
    }
}