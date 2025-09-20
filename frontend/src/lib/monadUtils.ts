// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

// Helper function to add Monad testnet to MetaMask - Version 2
export const addMonadTestnetToMetaMask = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // First try to switch to see if it already exists
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x279F' }],
        });
        console.log('✅ Monad testnet already exists, switched successfully');
        return true;
      } catch (switchError: any) {
        // If switch fails with 4902, the network doesn't exist, so we'll add it
        if (switchError.code !== 4902) {
          throw switchError; // Re-throw if it's not a "network not found" error
        }
      }

      // Add the network
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x279F', // 10143 in hex
            chainName: 'Monad Testnet',
            nativeCurrency: {
              name: 'Monad',
              symbol: 'MON',
              decimals: 18,
            },
            rpcUrls: ['https://testnet-rpc.monad.xyz'],
            blockExplorerUrls: ['https://testnet.monadexplorer.com/'],
          },
        ],
      });
      console.log('✅ Monad testnet added to MetaMask');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to add Monad testnet:', error);
      if (error.code === 4001) {
        console.log('User rejected the request');
        alert('Please approve the network addition to continue');
      } else if (error.code === -32602) {
        console.log('Invalid parameters provided to MetaMask');
        alert('Invalid network parameters. Please try again.');
      } else {
        console.log('Unknown error:', error.message);
        alert(`Error adding network: ${error.message}`);
      }
      return false;
    }
  }
  console.error('MetaMask not detected');
  alert('Please install MetaMask to continue');
  return false;
};

// Helper function to switch to Monad testnet
export const switchToMonadTestnet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x279F' }], // 10143 in hex
      });
      console.log('✅ Switched to Monad testnet');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to switch to Monad testnet:', error);
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        console.log('Network not found, attempting to add it...');
        return await addMonadTestnetToMetaMask();
      } else if (error.code === 4001) {
        console.log('User rejected the network switch');
        alert('Please approve the network switch to continue');
      }
      return false;
    }
  }
  return false;
};

// Helper function to check MON balance
export const checkMonBalance = async (address: string) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      
      // Convert from wei to MON
      const balanceInMON = parseInt(balance, 16) / Math.pow(10, 18);
      console.log(`💰 MON Balance: ${balanceInMON.toFixed(4)} MON`);
      
      return {
        wei: balance,
        mon: balanceInMON,
        hasBalance: balanceInMON > 0
      };
    } catch (error: any) {
      console.error('❌ Failed to check MON balance:', error);
      return null;
    }
  }
  return null;
};

// Helper function for complete wallet setup
export const setupMonadWallet = async () => {
  console.log('🔧 Setting up Monad testnet wallet...');
  
  // Add/Switch to Monad testnet
  const networkAdded = await addMonadTestnetToMetaMask();
  if (!networkAdded) {
    alert('❌ Failed to add Monad testnet to MetaMask. Please add it manually.');
    return false;
  }
  
  // Switch to the network
  const networkSwitched = await switchToMonadTestnet();
  if (!networkSwitched) {
    alert('❌ Failed to switch to Monad testnet. Please switch manually.');
    return false;
  }
  
  console.log('✅ Monad testnet setup complete!');
  alert('✅ Monad testnet added! You can now connect your wallet.');
  
  return true;
};