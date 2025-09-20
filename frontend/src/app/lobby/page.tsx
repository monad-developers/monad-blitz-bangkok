'use client'

import { useState } from 'react'
import { Plus, Clock, Trophy, Users, Coins } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { useJoinMatch } from '@/hooks/useJoinMatch'
import { useEntryFee } from '@/hooks/useEntryFee'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'

// Mock arena contract address - replace with actual deployed address
const ARENA_ADDRESS = process.env.NEXT_PUBLIC_ARENA_ADDRESS as `0x${string}` | undefined

export default function LobbyPage() {
  const [matches] = useState([
    {
      id: '1',
      creator: '0x1234...5678',
      mode: 'Speed Solve',
      stake: '100 GAME',
      challenge: 'Two Sum',
      timeLeft: '4m 32s'
    },
    {
      id: '2', 
      creator: '0x9abc...def0',
      mode: 'Optimization',
      stake: '250 GAME',
      challenge: 'Fibonacci',
      timeLeft: '7m 18s'
    }
  ])

  const { formattedFee } = useEntryFee({ arenaAddress: ARENA_ADDRESS })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Battle Lobby</h1>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create Match</span>
          </button>
        </div>

        {/* Entry Fee Info Banner */}
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Coins className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-blue-100 font-medium">Entry Fee Required</div>
              <div className="text-blue-300 text-sm">
                Players must pay {formattedFee} to join any match. This fee is transferred to the main mempool to support the platform.
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users />} label="Active Players" value="23" />
          <StatCard icon={<Clock />} label="Open Matches" value="7" />
          <StatCard icon={<Trophy />} label="Completed Today" value="156" />
          <StatCard icon={<Coins />} label="Entry Fee" value={formattedFee} />
        </div>

        {/* Match List */}
        <div className="bg-slate-800/50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Open Matches</h2>
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
      <div className="flex justify-center mb-2 text-purple-400">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  )
}

function MatchCard({ match }: any) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isJoining, setIsJoining] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  const entryFee = '0.025 MON'; // test transaction amount

  const handleJoinMatch = async () => {
    // setError(null);
    
    if (!isConnected || !address) {
      // setError('Please connect your wallet first');
      return;
    }

    const confirmed = confirm(
      `Send test transaction to join the match?\n\n` +
      `Amount: ${entryFee}\n` +
      `To: 0x0000000000000000000000000000000000000000\n` +
      `Match: ${match.challenge}\n` +
      `Mode: ${match.mode}\n\n` +
      `After the transaction is sent, you will be redirected to the match.`
    );
    
    if (!confirmed) return;

    // setIsJoining(true);
    
    try {
      // Check if we have ethereum provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not detected');
      }

      // Send test transaction to 0x00
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: "0xF82333fF467338B67b631BD677A85dd2AC2B39dC",
            value: "0x8d8e64b8e8000", // 0.025 ETH/MON in wei (0.025 * 10^18)
            gas: "0x5208", // 21000 gas for simple transfer
          },
        ],
      });

      console.log('Test transaction sent:', txHash);
      
      // Redirect to match after successful transaction
      router.push('/match/1');
      
    } catch (err: any) {
      console.error('Transaction failed:', err);
      if (err.code === 4001) {
        // setError('Transaction cancelled by user');
      } else if (err.code === -32603) {
        // setError('Insufficient funds for transaction');
      } else {
        // setError(err.message || 'Transaction failed');
      }
    } finally {
      // setIsJoining(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="text-white font-mono">{match.creator}</div>
        <div className="px-2 py-1 bg-purple-600 text-white text-sm rounded">{match.mode}</div>
      </div>
      <div className="text-slate-300">{match.challenge}</div>
      <div className="text-yellow-400">{match.stake}</div>
      <div className="text-orange-400">{match.timeLeft}</div>
      <div className="flex flex-col items-end space-y-1">
        <div className="text-xs text-slate-400">Test Fee: {entryFee}</div>
        <button 
          onClick={handleJoinMatch}
          disabled={isJoining || !isConnected}
          className={`px-4 py-2 rounded text-white font-medium ${
            isJoining 
              ? 'bg-gray-600 cursor-not-allowed' 
              : !isConnected
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isJoining ? 'Sending...' : !isConnected ? 'Connect Wallet' : 'Join'}
        </button>
        {/* {error && (
          <div className="text-xs text-red-400 max-w-32 truncate" title={error}>
            Error: {error}
          </div>
        )} */}
      </div>
    </div>
  );
}