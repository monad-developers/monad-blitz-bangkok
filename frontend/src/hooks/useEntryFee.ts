import { useContractRead } from 'wagmi'
import { formatEther } from 'viem'

const ARENA_ABI = [
  {
    name: 'getEntryFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

interface UseEntryFeeProps {
  arenaAddress?: `0x${string}`
}

export function useEntryFee({ arenaAddress }: UseEntryFeeProps) {
  const { data: entryFeeWei, isLoading, error } = useContractRead({
    address: arenaAddress,
    abi: ARENA_ABI,
    functionName: 'getEntryFee',
    enabled: Boolean(arenaAddress),
  })

  const entryFeeEther = entryFeeWei ? formatEther(entryFeeWei) : '0.025'

  return {
    entryFee: entryFeeEther,
    entryFeeWei,
    isLoading,
    error,
    formattedFee: `${entryFeeEther} MON`,
  }
}