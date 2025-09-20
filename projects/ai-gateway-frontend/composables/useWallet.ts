// composables/useWallet.ts
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

type EthProvider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on?: (event: string, cb: (...args: any[]) => void) => void
  removeListener?: (event: string, cb: (...args: any[]) => void) => void
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  56: 'BSC',
  137: 'Polygon',
  11155111: 'Sepolia',
  // add yours if needed
}

function short(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''
}

export function useWallet() {
  const provider = ref<EthProvider | null>(null)
  const account = ref<string | null>(null)
  const chainId = ref<number | null>(null)
  const connecting = ref(false)
  const installed = computed(() => !!provider.value)
  const networkName = computed(() => (chainId.value ? CHAIN_NAMES[chainId.value] || `Chain ${chainId.value}` : '-'))
  const display = computed(() => (account.value ? short(account.value) : 'Connect Wallet'))

  async function detect() {
    if (typeof window !== 'undefined') {
      // prefer injected wallets
      const anyWin = window as any
      provider.value = (anyWin.ethereum as EthProvider) || null
    }
  }

  async function connect() {
    if (!provider.value) {
      window.open('https://metamask.io/download.html', '_blank')
      return
    }
    try {
      connecting.value = true
      const accs = await provider.value.request({ method: 'eth_requestAccounts' })
      account.value = accs?.[0] || null

      const cidHex = await provider.value.request({ method: 'eth_chainId' })
      chainId.value = parseInt(cidHex, 16)
    } finally {
      connecting.value = false
    }
  }

  async function disconnect() {
    // EIP-1193 injected wallets don’t support programmatic disconnect; just clear state
    account.value = null
  }

  // listeners
  const onAccountsChanged = (accs: string[]) => {
    account.value = accs?.[0] || null
  }
  const onChainChanged = (cidHex: string) => {
    chainId.value = parseInt(cidHex, 16)
  }

  onMounted(async () => {
    await detect()
    if (provider.value?.on) {
      provider.value.on('accountsChanged', onAccountsChanged)
      provider.value.on('chainChanged', onChainChanged)
    }
    // attempt silent connect if already authorized
    try {
      const accs = await provider.value?.request({ method: 'eth_accounts' })
      if (accs && accs[0]) {
        account.value = accs[0]
        const cidHex = await provider.value!.request({ method: 'eth_chainId' })
        chainId.value = parseInt(cidHex, 16)
      }
    } catch {}
  })

  onBeforeUnmount(() => {
    if (provider.value?.removeListener) {
      provider.value.removeListener('accountsChanged', onAccountsChanged)
      provider.value.removeListener('chainChanged', onChainChanged)
    }
  })

  return {
    // state
    installed, account, chainId, networkName, display, connecting,
    // actions
    connect, disconnect,
  }
}
