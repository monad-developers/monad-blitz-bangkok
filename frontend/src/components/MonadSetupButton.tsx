'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { addMonadTestnetToMetaMask, switchToMonadTestnet, checkMonBalance } from '@/lib/monadUtils'

export function MonadSetupButton() {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState<{ mon: number; hasBalance: boolean } | null>(null)
  const [showBalance, setShowBalance] = useState(false)

  const handleSetupMonad = async () => {
    setIsLoading(true)
    try {
      console.log('🔧 Setting up Monad testnet...')
      
      // Add/Switch to Monad testnet
      const networkAdded = await addMonadTestnetToMetaMask()
      if (!networkAdded) {
        alert('❌ Failed to add Monad testnet to MetaMask. Please add it manually.')
        return
      }
      
      // Switch to the network
      const networkSwitched = await switchToMonadTestnet()
      if (!networkSwitched) {
        alert('❌ Failed to switch to Monad testnet. Please switch manually.')
        return
      }
      
      console.log('✅ Monad testnet setup complete!')
      alert('✅ Monad testnet added! You can now connect your wallet.')
      
      // Check balance if connected
      if (isConnected && address) {
        await handleCheckBalance()
      }
    } catch (error) {
      console.error('Error setting up Monad:', error)
      alert('❌ Error setting up Monad testnet. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckBalance = async () => {
    if (!address) {
      alert('Please connect your wallet first!')
      return
    }

    setIsLoading(true)
    try {
      const balanceResult = await checkMonBalance(address)
      if (balanceResult) {
        setBalance(balanceResult)
        setShowBalance(true)
        
        if (balanceResult.hasBalance) {
          alert(`💰 Balance: ${balanceResult.mon.toFixed(4)} MON`)
        } else {
          alert(`💰 Balance: 0 MON\n\n🚰 Get testnet tokens at:\nhttps://faucet.monad.xyz\n\nUse address: ${address}`)
        }
      } else {
        alert('❌ Failed to check balance. Make sure you\'re connected to Monad testnet.')
      }
    } catch (error) {
      console.error('Error checking balance:', error)
      alert('❌ Error checking balance. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const openFaucet = () => {
    if (address) {
      alert(`🚰 Get MON tokens at: https://faucet.monad.xyz\n\nYour address: ${address}\n\nCopy your address and visit the faucet!`)
      // Copy address to clipboard
      navigator.clipboard.writeText(address)
    } else {
      alert('Please connect your wallet first to get your address!')
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Setup Monad Button */}
      <button
        onClick={handleSetupMonad}
        disabled={isLoading}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isLoading ? '⚙️' : '🔧'} Setup Monad
      </button>

      {/* Check Balance Button */}
      {isConnected && (
        <button
          onClick={handleCheckBalance}
          disabled={isLoading}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? '⚙️' : '💰'} Check MON
        </button>
      )}

      {/* Get Testnet Tokens Button */}
      <button
        onClick={openFaucet}
        className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 text-sm"
      >
        🚰 Get MON
      </button>

      {/* Balance Display */}
      {showBalance && balance && (
        <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
          balance.hasBalance 
            ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
            : 'bg-red-600/20 text-red-400 border border-red-600/30'
        }`}>
          {balance.mon.toFixed(4)} MON
        </div>
      )}
    </div>
  )
}