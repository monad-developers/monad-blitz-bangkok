<!-- app.vue -->
<template>
  <div :class="isDark ? 'dark' : ''">
    <div class="min-h-dvh bg-white text-zinc-900 dark:bg-[#0B0F14] dark:text-zinc-100 flex flex-col">
      <!-- Navbar -->
      <header
        class="sticky top-0 z-40 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="h-9 w-9 grid place-items-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black font-bold">
              AI</div>
            <span class="text-lg font-semibold">AI Gateway</span>
          </div>

          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center text-xs px-3 py-1.5 rounded-lg bg-white/10">
              Credit: <span class="font-semibold ml-1">{{ creditMon }} MON</span>
            </div>

            <button
              class="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-sm bg-zinc-900 text-white dark:bg-white dark:text-black"
              @click="toggleTheme">
              {{ isDark ? 'Light' : 'Dark' }} Mode
            </button>

            <!-- Deposit -->
            <button
              class="px-3 py-1.5 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-lime-400 text-black hover:opacity-90 disabled:opacity-50"
              :disabled="!account || chainId !== MONAD_CHAIN_ID" @click="openDeposit">
              Deposit
            </button>

            <!-- Withdraw -->
            <button
              class="px-3 py-1.5 rounded-lg font-medium bg-gradient-to-r from-rose-500 to-orange-400 text-white hover:opacity-90 disabled:opacity-50"
              :disabled="!account || chainId !== MONAD_CHAIN_ID || creditWei === 0n" @click="openWithdraw">
              Withdraw
            </button>

            <!-- Wallet -->
            <button :disabled="connecting" @click="account ? disconnect() : connect()"
              class="px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-500 shadow hover:opacity-90 disabled:opacity-50"
              :title="networkTitle">
              <span v-if="account">{{ short(account) }}</span>
              <span v-else>{{ connecting ? 'Connecting…' : 'Connect Wallet' }}</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Chat -->
      <main class="flex-1">
        <div ref="scrollArea"
          class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4 overflow-auto h-[calc(100dvh-190px)]">
          <div v-for="m in messages" :key="m.id" class="flex"
            :class="m.role === 'assistant' ? 'justify-start' : 'justify-end'">
            <div class="flex items-start gap-3 max-w-[90%]">
              <div v-if="m.role === 'assistant'"
                class="h-8 w-8 rounded-full grid place-items-center shrink-0 bg-white text-black">G</div>
              <div v-else
                class="order-2 h-8 w-8 rounded-full grid place-items-center shrink-0 bg-emerald-500 text-white">U</div>

              <div class="rounded-2xl px-4 py-2 leading-relaxed whitespace-pre-wrap" :class="m.role === 'assistant'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100'
                : 'bg-emerald-500 text-white'">
                {{ m.content }}
              </div>
            </div>
          </div>
          <div class="h-24"></div>
        </div>
      </main>

      <!-- Composer -->
      <footer
        class="sticky bottom-0 border-t border-black/5 dark:border-white/10 bg-gradient-to-t from-white/95 via-white/70 to-white/30 dark:from-black/40 dark:via-black/20 dark:to-transparent backdrop-blur">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div class="rounded-2xl border border-white/10 bg-white/70 dark:bg-zinc-900/70 shadow">
            <!-- Top row: dropdown + textarea -->
            <div class="flex items-stretch gap-2 px-3 pt-3">
              <!-- Model dropdown -->
              <div class="relative" ref="dropdownEl">
                <button
                  class="h-full min-w-[140px] rounded-xl bg-black/10 dark:bg-white/10 border border-white/10 px-3 py-2 text-sm flex items-center justify-between hover:bg-black/20 dark:hover:bg-white/20"
                  @click="dropdownOpen = !dropdownOpen">
                  <span class="font-medium">{{ selectedModel === 'gemini' ? 'Gemini' : 'OpenChat' }}</span>
                  <svg class="ml-2 h-4 w-4 text-zinc-500 transition-transform" :class="{ 'rotate-180': dropdownOpen }"
                    fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <transition name="slide-up">
                  <div v-if="dropdownOpen"
                    class="absolute bottom-full mb-2 left-0 w-full rounded-xl border border-white/10 bg-white dark:bg-zinc-900 shadow-lg z-50">
                    <ul class="py-1 text-sm">
                      <li><button class="w-full px-3 py-2 text-left hover:bg-emerald-500/10 rounded-lg"
                          @click="selectModel('gemini')">Gemini</button></li>
                      <li><button class="w-full px-3 py-2 text-left hover:bg-emerald-500/10 rounded-lg"
                          @click="selectModel('openchat')">OpenChat</button></li>
                    </ul>
                  </div>
                </transition>
              </div>

              <!-- Textarea -->
              <textarea v-model="input" rows="1" placeholder="Message…" @keydown.enter.exact.prevent="send"
                @keydown.enter.shift.exact.stop
                class="flex-1 bg-transparent placeholder-zinc-500 text-zinc-900 dark:text-zinc-100 resize-none outline-none px-2 py-2"></textarea>
            </div>

            <!-- Bottom row -->
            <div class="flex items-center justify-between px-3 pb-3">
              <div class="text-[11px] text-zinc-500">
                Model: <span class="font-medium">{{ selectedModel === 'gemini' ? 'Gemini' : 'OpenChat' }}</span> • Enter
                to send • Shift+Enter for newline

              </div>
              <div class="flex items-center gap-2">
                <button
                  class="text-sm px-3 py-1.5 rounded-lg text-black bg-gradient-to-r from-emerald-400 to-lime-300 disabled:opacity-50"
                  :disabled="!input.trim() || sending" @click="send">
                  {{ sending ? 'Thinking…' : 'Send ➤' }}
                </button>
              </div>
            </div>
          </div>

          <div class="mt-2 text-[10px] text-center text-zinc-500">
            Using backend: {{ BACKEND_URL }} • Vault: {{ VAULT_ADDRESS_SHORT }}
          </div>
        </div>
      </footer>

      <!-- Deposit Modal -->
      <transition enter-active-class="duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
        leave-active-class="duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="depositOpen"
          class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div class="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 text-zinc-100 shadow-xl">
            <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 class="text-lg font-semibold">Deposit MON → Credit</h3>
              <button class="px-2 py-1 rounded hover:bg-white/10" @click="closeDeposit">✕</button>
            </div>

            <div class="px-5 py-4 space-y-4">
              <div class="text-xs text-zinc-400">
                From: <span class="font-medium text-zinc-200">{{ account ? short(account) : '-' }}</span><br />
                Network:
                <span :class="chainId === MONAD_CHAIN_ID ? 'text-emerald-400' : 'text-red-400'">
                  {{ chainId === MONAD_CHAIN_ID ? 'Monad Testnet (10143)' : `Wrong chain (${chainId ?? '-'})` }}
                </span>
              </div>

              <div class="rounded-lg bg-black/30 border border-white/10 p-3 text-sm">
                Wallet Balance: <span class="font-semibold">{{ walletMon }} MON</span>
              </div>

              <div>
                <label class="block text-sm mb-1">Amount (MON)</label>
                <div class="flex items-center gap-2">
                  <input v-model="amountDeposit" type="text" inputmode="decimal" placeholder="0.00"
                    class="flex-1 rounded-lg bg-black/30 border border-white/10 outline-none px-3 py-2" />
                  <button class="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/15"
                    @click="setMaxDeposit">Max</button>
                </div>
                <p v-if="depositError" class="mt-1 text-[12px] text-red-400">{{ depositError }}</p>
              </div>
            </div>

            <div class="px-5 py-4 border-t border-white/10 flex items-center justify-between">
              <div class="text-xs text-zinc-400">Vault: <span class="font-mono">{{ VAULT_ADDRESS_SHORT }}</span></div>
              <div class="flex items-center gap-2">
                <button class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15" @click="closeDeposit">Cancel</button>
                <button
                  class="px-4 py-2 rounded-lg font-semibold text-black bg-gradient-to-r from-emerald-400 to-lime-300 disabled:opacity-50"
                  :disabled="!canDeposit || depositing" @click="doDeposit">
                  {{ depositing ? 'Confirming…' : 'Deposit' }}
                </button>
              </div>
            </div>

            <div v-if="txHashDeposit" class="px-5 pb-4 text-xs text-zinc-400">
              Tx: <a :href="explorerTx(txHashDeposit)" target="_blank" class="text-sky-400 underline break-all">{{
                txHashDeposit }}</a>
            </div>
          </div>
        </div>
      </transition>

      <!-- Withdraw Modal -->
      <transition enter-active-class="duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
        leave-active-class="duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="withdrawOpen"
          class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div class="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 text-zinc-100 shadow-xl">
            <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 class="text-lg font-semibold">Withdraw Credit → MON</h3>
              <button class="px-2 py-1 rounded hover:bg-white/10" @click="closeWithdraw">✕</button>
            </div>

            <div class="px-5 py-4 space-y-4">
              <div class="text-xs text-zinc-400">
                To: <span class="font-medium text-zinc-200">{{ account ? short(account) : '-' }}</span><br />
                Credit Balance: <span class="font-semibold text-zinc-200">{{ creditMon }} MON</span>
              </div>

              <div>
                <label class="block text-sm mb-1">Amount (MON)</label>
                <div class="flex items-center gap-2">
                  <input v-model="amountWithdraw" type="text" inputmode="decimal" placeholder="0.00"
                    class="flex-1 rounded-lg bg-black/30 border border-white/10 outline-none px-3 py-2" />
                  <button class="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/15"
                    @click="setMaxWithdraw">Max</button>
                </div>
                <p v-if="withdrawError" class="mt-1 text-[12px] text-red-400">{{ withdrawError }}</p>
              </div>
            </div>

            <div class="px-5 py-4 border-t border-white/10 flex items-center justify-between">
              <div class="text-xs text-zinc-400">Vault: <span class="font-mono">{{ VAULT_ADDRESS_SHORT }}</span></div>
              <div class="flex items-center gap-2">
                <button class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15"
                  @click="closeWithdraw">Cancel</button>
                <button
                  class="px-4 py-2 rounded-lg font-semibold text-black bg-gradient-to-r from-rose-400 to-orange-300 disabled:opacity-50"
                  :disabled="!canWithdraw || withdrawing" @click="doWithdraw">
                  {{ withdrawing ? 'Confirming…' : 'Withdraw' }}
                </button>
              </div>
            </div>

            <div v-if="txHashWithdraw" class="px-5 pb-4 text-xs text-zinc-400">
              Tx: <a :href="explorerTx(txHashWithdraw)" target="_blank" class="text-sky-400 underline break-all">{{
                txHashWithdraw }}</a>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
/* ------------ CONFIG ------------ */
const BACKEND_URL = 'http://localhost:8787'                 // chat backend
const BILLING_URL = 'http://localhost:8787'                 // billing backend (/bill)
const VAULT_ADDRESS = '0x0e83F172ad6e2b1a0215a7B2beCBB749ADC28d43'  // vault address
/* -------------------------------- */

import { ethers } from 'ethers'

/* ---------- MODEL DROPDOWN ---------- */
const selectedModel = ref<'gemini' | 'openchat'>('openchat')
const dropdownOpen = ref(false)
const modelLabel = computed(() => selectedModel.value === 'gemini' ? 'Gemini' : 'OpenChat')
const PRICE_TABLE: Record<'openchat' | 'gemini', string> = { openchat: '0.1', gemini: '0.1' }
const priceMonSelected = computed(() => PRICE_TABLE[selectedModel.value]);       // e.g. "0.008"
const priceWeiSelected = computed(() => parseEtherStr(priceMonSelected.value)); // -> bigint
const canAfford = computed(() => creditWei.value >= priceWeiSelected.value);

const sendError = ref('');
const canSendBtn = computed(() => {
  if (sending.value) return false;
  if (!input.value.trim()) return false;
  if (!account.value || chainId.value !== MONAD_CHAIN_ID) return false;
  return canAfford.value; // must have enough credit
});

const dropdownEl = ref<HTMLElement | null>(null)
function handleDocClick(e: MouseEvent) {
  const el = dropdownEl.value
  if (!el) return
  if (!el.contains(e.target as Node)) dropdownOpen.value = false
}
onMounted(() => document.addEventListener('mousedown', handleDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleDocClick))
function selectModel(model: 'openchat' | 'gemini') { selectedModel.value = model; dropdownOpen.value = false }

/* ---------- THEME ---------- */
const isDark = useState('isDark', () =>
  process.client
    ? (localStorage.getItem('theme') ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark'
    : true
)
function toggleTheme() {
  isDark.value = !isDark.value
  if (process.client) localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
if (process.client) watch(isDark, v => document.documentElement.classList.toggle('dark', v), { immediate: true })

/* ---------- WALLET (Monad testnet 10143) ---------- */
type EthProvider = { request: (args: { method: string; params?: any[] }) => Promise<any>; on?: (e: string, cb: (...a: any[]) => void) => void }
const providerInj = ref<EthProvider | null>(null)
const account = ref<string | null>(null)
const chainId = ref<number | null>(null)
const connecting = ref(false)

const MONAD_CHAIN_ID = 10143
const MONAD_PARAMS = {
  chainId: '0x279F',
  chainName: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com']
}
const short = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`
const networkTitle = computed(() =>
  chainId.value === MONAD_CHAIN_ID ? 'Connected to Monad Testnet' : chainId.value ? `Wrong chain (${chainId.value}). Click to switch.` : 'Not connected'
)
const VAULT_ADDRESS_SHORT = computed(() => short(VAULT_ADDRESS))

onMounted(async () => {
  const anyWin = window as any
  providerInj.value = (anyWin.ethereum as EthProvider) || null

  if (providerInj.value?.on) {
    providerInj.value.on('accountsChanged', (accs: string[]) => { account.value = accs?.[0] || null; fetchWalletBalance(); fetchCredit(); })
    providerInj.value.on('chainChanged', (cidHex: string) => { chainId.value = parseInt(cidHex, 16); fetchWalletBalance(); fetchCredit(); })
  }

  try {
    const accs = await providerInj.value?.request({ method: 'eth_accounts' })
    if (accs && accs[0]) {
      account.value = accs[0]
      const cidHex = await providerInj.value!.request({ method: 'eth_chainId' })
      chainId.value = parseInt(cidHex, 16)
      if (chainId.value !== MONAD_CHAIN_ID) await switchToMonad()
      await Promise.all([fetchWalletBalance(), fetchCredit()])
    }
  } catch { }
})

async function connect() {
  if (!providerInj.value) { window.open('https://metamask.io/download.html', '_blank'); return }
  try {
    connecting.value = true
    const accs = await providerInj.value.request({ method: 'eth_requestAccounts' })
    account.value = accs?.[0] || null
    const cidHex = await providerInj.value.request({ method: 'eth_chainId' })
    chainId.value = parseInt(cidHex, 16)
    if (chainId.value !== MONAD_CHAIN_ID) await switchToMonad()
    await Promise.all([fetchWalletBalance(), fetchCredit()])
  } finally { connecting.value = false }
}
function disconnect() { account.value = null }

async function switchToMonad() {
  try {
    await providerInj.value!.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: MONAD_PARAMS.chainId }] })
    chainId.value = MONAD_CHAIN_ID
  } catch (err: any) {
    if (err.code === 4902) {
      await providerInj.value!.request({ method: 'wallet_addEthereumChain', params: [MONAD_PARAMS] })
      chainId.value = MONAD_CHAIN_ID
    } else { console.error('Chain switch failed', err) }
  }
}

/* ---------- Ethers (browser) ---------- */
const VAULT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function withdraw(uint256)'
]
const walletWei = ref<bigint>(0n)
const creditWei = ref<bigint>(0n)
const walletMon = computed(() => formatEther(walletWei.value, 6))
const creditMon = computed(() => formatEther(creditWei.value, 6))

async function browserProvider() {
  if (!providerInj.value) throw new Error('No injected provider')
  return new ethers.BrowserProvider(providerInj.value as any)
}
async function signer() { const p = await browserProvider(); return await p.getSigner() }
async function fetchWalletBalance() {
  if (!providerInj.value || !account.value) { walletWei.value = 0n; return }
  try {
    const p = await browserProvider()
    walletWei.value = await p.getBalance(account.value)
  } catch { walletWei.value = 0n }
}
async function fetchCredit() {
  if (!providerInj.value || !account.value) { creditWei.value = 0n; return }
  try {
    const p = await browserProvider()
    const cont = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, await p.getSigner())
    creditWei.value = await cont.balanceOf(account.value)
  } catch { creditWei.value = 0n }
}

/* ---------- Wei helpers ---------- */
function parseEtherStr(s: string): bigint {
  const [i, f = ''] = s.trim().split('.')
  const frac = (f + '0'.repeat(18)).slice(0, 18)
  return BigInt(i || '0') * 10n ** 18n + BigInt(frac || '0')
}
function formatEther(wei: bigint, dp = 4): string {
  const sign = wei < 0 ? '-' : ''
  const a = wei < 0 ? -wei : wei
  const i = a / 10n ** 18n
  let f = (a % 10n ** 18n).toString().padStart(18, '0').slice(0, dp).replace(/0+$/, '')
  return sign + i.toString() + (f ? '.' + f : '')
}

/* ---------- Deposit modal ---------- */
const depositOpen = ref(false)
const amountDeposit = ref('')
const depositing = ref(false)
const depositError = ref('')
const txHashDeposit = ref<string | null>(null)
function openDeposit() { depositError.value = ''; txHashDeposit.value = null; amountDeposit.value = ''; depositOpen.value = true }
function closeDeposit() { depositOpen.value = false }
const canDeposit = computed(() => {
  if (!account.value || chainId.value !== MONAD_CHAIN_ID) return false
  if (!amountDeposit.value.trim()) return false
  try {
    const wei = parseEtherStr(amountDeposit.value)
    return wei > 0n
  } catch { return false }
})
function setMaxDeposit() {
  const dust = parseEtherStr('0.00002')
  const max = walletWei.value > dust ? walletWei.value - dust : 0n
  amountDeposit.value = formatEther(max, 6)
}
function explorerTx(hash: string) { return `${MONAD_PARAMS.blockExplorerUrls[0]}/tx/${hash}` }
async function doDeposit() {
  depositError.value = ''
  txHashDeposit.value = null
  if (!providerInj.value || !account.value) { depositError.value = 'Connect wallet first.'; return }
  if (chainId.value !== MONAD_CHAIN_ID) { depositError.value = 'Wrong chain. Switch to Monad Testnet (10143).'; return }

  let valueWei: bigint
  try {
    valueWei = parseEtherStr(amountDeposit.value)
    if (valueWei <= 0n) throw new Error('Enter a positive amount')
  } catch (e: any) { depositError.value = e?.message || 'Invalid amount format'; return }

  if (valueWei > walletWei.value) { depositError.value = 'Insufficient wallet balance. Try “Max”.'; return }

  try {
    depositing.value = true
    const s = await signer()
    const tx = await s.sendTransaction({ to: VAULT_ADDRESS, value: valueWei })
    txHashDeposit.value = tx.hash
    await tx.wait()
    await Promise.all([fetchWalletBalance(), fetchCredit()])
  } catch (e: any) {
    depositError.value = e?.message || 'Transaction failed'
  } finally { depositing.value = false }
}

/* ---------- Withdraw modal ---------- */
const withdrawOpen = ref(false)
const amountWithdraw = ref('')
const withdrawing = ref(false)
const withdrawError = ref('')
const txHashWithdraw = ref<string | null>(null)
function openWithdraw() { withdrawError.value = ''; txHashWithdraw.value = null; amountWithdraw.value = ''; withdrawOpen.value = true }
function closeWithdraw() { withdrawOpen.value = false }
const canWithdraw = computed(() => {
  if (!account.value || chainId.value !== MONAD_CHAIN_ID) return false
  if (!amountWithdraw.value.trim()) return false
  try {
    const wei = parseEtherStr(amountWithdraw.value)
    return wei > 0n && wei <= creditWei.value
  } catch { return false }
})
function setMaxWithdraw() { amountWithdraw.value = formatEther(creditWei.value, 6) }
async function doWithdraw() {
  withdrawError.value = ''
  txHashWithdraw.value = null
  if (!providerInj.value || !account.value) { withdrawError.value = 'Connect wallet first.'; return }
  if (chainId.value !== MONAD_CHAIN_ID) { withdrawError.value = 'Wrong chain. Switch to Monad Testnet (10143).'; return }

  let valueWei: bigint
  try {
    valueWei = parseEtherStr(amountWithdraw.value)
    if (valueWei <= 0n) throw new Error('Enter a positive amount')
    if (valueWei > creditWei.value) throw new Error('Amount exceeds credit balance')
  } catch (e: any) { withdrawError.value = e?.message || 'Invalid amount'; return }

  // optimistic UI: reduce credit immediately (revert if tx fails)
  const prevCredit = creditWei.value
  creditWei.value = prevCredit - valueWei

  try {
    withdrawing.value = true
    const s = await signer()
    const cont = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, s)
    const tx = await cont.withdraw(valueWei)
    txHashWithdraw.value = tx.hash
    await tx.wait()
    // refresh balances after success
    await Promise.all([fetchWalletBalance(), fetchCredit()])
  } catch (e: any) {
    // revert optimistic change on error
    creditWei.value = prevCredit
    withdrawError.value = e?.message || 'Withdraw failed'
  } finally {
    withdrawing.value = false
  }
}

/* ---------- Chat + billing (silent fee; no messages) ---------- */
type Role = 'user' | 'assistant'
type Msg = { id: string; role: Role; content: string }
const messages = ref<Msg[]>([
  { id: crypto.randomUUID(), role: 'assistant', content: 'Hi! Deposit MON to get credit, then ask me anything.' }
])
const input = ref(''); const sending = ref(false)
const scrollArea = ref<HTMLElement | null>(null)
watch(() => messages.value.length, () => nextTick(() => scrollArea.value?.scrollTo({ top: scrollArea.value.scrollHeight, behavior: 'smooth' })))

function buildChatPayload(latest: string) {
  return [
    { role: 'system', content: 'You are concise.' },
    { role: 'user', content: latest }
  ]
}

async function send() {

  console.log(creditMon.value, PRICE_TABLE[selectedModel.value])
  if (creditMon.value < PRICE_TABLE[selectedModel.value]) {
    alert('Balance not enough !!')
    return;
  }

  const text = input.value.trim()
  if (!text || sending.value) return

  // push user bubble
  input.value = ''
  messages.value.push({ id: crypto.randomUUID(), role: 'user', content: text })
  sending.value = true

  // prepare one assistant bubble
  const replyId = crypto.randomUUID()
  messages.value.push({ id: replyId, role: 'assistant', content: `(${modelLabel.value}) …` })

  try {
    // --- Chat call ---
    const payload = { messages: buildChatPayload(text) }
    let chatRes: any
    if (selectedModel.value === 'gemini') {
      chatRes = await fetch(`${BACKEND_URL}/chat/gemini`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
      }).then(r => r.json())
    } else {
      chatRes = await fetch(`${BACKEND_URL}/chat/openai`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, model: undefined })
      }).then(r => r.json())
    }

    const assistantText = chatRes?.text ?? chatRes?.choices?.[0]?.message?.content ?? '(no response)'
    {
      const idx = messages.value.findIndex(m => m.id === replyId)
      if (idx !== -1) messages.value[idx] = { ...messages.value[idx], content: `(${modelLabel.value}) ${assistantText}` }
    }

    // --- Billing (silent) ---
    if (account.value) {
      const priceMon = PRICE_TABLE[selectedModel.value] // string like "0.008"
      const billRes = await fetch(`${BILLING_URL}/test/deduct/${account.value}/${PRICE_TABLE[selectedModel.value]}`).then(r => r.json())

      if (billRes?.ok) {
        // optimistic deduction from credit (no message)
        try {
          const spentWei = parseEtherStr(priceMon)
          creditWei.value = creditWei.value > spentWei ? (creditWei.value - spentWei) : 0n
        } catch { }
        // reconcile on-chain in background
        fetchCredit()
      } else {
        // billing failed → no UI message per requirement; optionally log
        // console.warn('Billing failed', billRes?.error)
      }
    }
  } catch (e: any) {
    const idx = messages.value.findIndex(m => m.id === replyId)
    if (idx !== -1) messages.value[idx] = { ...messages.value[idx], content: `(${modelLabel.value}) Error: ${e?.message || String(e)}` }
  } finally {
    sending.value = false
    nextTick(() => scrollArea.value?.scrollTo({ top: scrollArea.value.scrollHeight, behavior: 'smooth' }))
  }
}
</script>

<style>
html,
body,
#__nuxt {
  height: 100%;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
