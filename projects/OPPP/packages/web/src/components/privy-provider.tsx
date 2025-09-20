"use client"

import React from "react"
import {
  PrivyProvider as BasePrivyProvider,
  PrivyClientConfig,
} from "@privy-io/react-auth"
import { monadTestnet } from "viem/chains"

import { env } from "@/env.mjs"

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const config: PrivyClientConfig = {
    loginMethods: ["twitter"],
    appearance: {
      theme: "dark",
      walletChainType: "ethereum-only",
    },
    defaultChain: monadTestnet,
    supportedChains: [monadTestnet],
    _experimentsConfig: {
      is_preview_mode: true,
    },
  }

  return (
    <BasePrivyProvider appId={env.NEXT_PUBLIC_PRIVY_APP_ID} config={config}>
      {children}
    </BasePrivyProvider>
  )
}
