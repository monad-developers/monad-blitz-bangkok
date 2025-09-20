"use client"

import { useEffect } from "react"
import {
  useCreateWallet,
  useLogin,
  useLogout,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth"

import {
  useEmbeddedPrivyWallet,
  useTwitterAuthenticatedWallet,
} from "@/hooks/wallet/useEmbeddedPrivyWallet"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const { login } = useLogin()
  const { logout } = useLogout()
  const { createWallet } = useCreateWallet()

  // Use the new hooks
  const embeddedWallet = useEmbeddedPrivyWallet()
  const {
    wallet: twitterWallet,
    twitterUsername,
    isTwitterAuthenticated,
  } = useTwitterAuthenticatedWallet()

  useEffect(() => {
    if (authenticated && user) {
      console.log("User authenticated:", user)
      console.log("User ID:", user.id)
      console.log("Twitter account:", user.twitter)
      console.log("Wallet:", user.wallet)
      console.log("Email:", user.email)
      console.log("Full user object:", JSON.stringify(user, null, 2))

      // Log all wallets (including embedded wallets)
      console.log("All wallets:", wallets)

      // Log embedded wallet using new hook
      if (embeddedWallet) {
        console.log("Embedded wallet found:", embeddedWallet)
        console.log("Embedded wallet address:", embeddedWallet.address)
        console.log("Embedded wallet type:", embeddedWallet.walletClientType)
      }

      // Log Twitter authenticated wallet
      if (isTwitterAuthenticated && twitterWallet) {
        console.log("Twitter authenticated wallet:", twitterWallet)
        console.log("Twitter username:", twitterUsername)
        console.log("Twitter wallet address:", twitterWallet.address)
      }

      // Find external wallets
      const externalWallets = wallets.filter(
        (wallet) => wallet.walletClientType !== "privy"
      )
      if (externalWallets.length > 0) {
        console.log("External wallets:", externalWallets)
      }
    }
  }, [authenticated, user, wallets])

  if (!ready) {
    return (
      <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <span className="hidden font-bold sm:inline-block">Sonad</span>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <div className="bg-muted h-9 w-24 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <span className="hidden font-bold sm:inline-block">Sonad</span>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {authenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground text-sm">
                  {user?.wallet?.address
                    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                    : user?.email?.address || "Connected"}
                </span>

                {/* Show create wallet button if no embedded wallet exists */}
                {!embeddedWallet && (
                  <Button
                    onClick={() => {
                      createWallet()
                        .then((wallet) => {
                          console.log("Embedded wallet created:", wallet)
                          console.log("New wallet address:", wallet.address)
                        })
                        .catch((error) => {
                          console.error("Failed to create wallet:", error)
                        })
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Create Wallet
                  </Button>
                )}

                <Button onClick={logout} variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={login} size="sm">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
