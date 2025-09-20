"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import PrivyProvider from "./privy-provider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
    },
  },
})

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PrivyProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PrivyProvider>
  )
}
