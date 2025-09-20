import { useState } from 'react'
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther } from 'viem'

// Arena contract ABI for joinMatch function
const ARENA_ABI = [
  {
    name: 'joinMatch',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'matchId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'getEntryFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// Entry fee: 0.025 MON
const ENTRY_FEE = parseEther('0.025')

interface UseJoinMatchProps {
  arenaAddress?: `0x${string}`
  matchId: string
}

export function useJoinMatch({ arenaAddress, matchId }: UseJoinMatchProps) {
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prepare the contract write
  const { config } = usePrepareContractWrite({
    address: arenaAddress,
    abi: ARENA_ABI,
    functionName: 'joinMatch',
    args: [matchId as `0x${string}`],
    value: ENTRY_FEE,
    enabled: Boolean(arenaAddress && matchId),
  })

  // Contract write hook
  const { data, write } = useContractWrite(config)

  // Wait for transaction
  const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const joinMatch = async () => {
    if (!write) {
      setError('Contract write not ready')
      return
    }

    try {
      setIsJoining(true)
      setError(null)
      write()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join match')
      setIsJoining(false)
    }
  }

  // Reset joining state when transaction completes
  if (isJoining && (isSuccess || error)) {
    setIsJoining(false)
  }

  return {
    joinMatch,
    isJoining: isJoining || isTransactionLoading,
    isSuccess,
    error,
    entryFee: '0.025 MON',
    transactionHash: data?.hash,
  }
}