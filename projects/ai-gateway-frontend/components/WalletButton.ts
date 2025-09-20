<template>
  <div class="relative">
    <button
      :disabled="connecting"
      @click="account ? menuOpen = !menuOpen : connect()"
      class="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium
             bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow
             hover:opacity-95 active:opacity-90 disabled:opacity-60"
      type="button"
    >
      <span v-if="account" class="inline-flex items-center gap-2">
        <span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
        <span>{{ display }}</span>
      </span>
      <span v-else>{{ connecting ? 'Connecting…' : 'Connect Wallet' }}</span>
    </button>

    <!-- dropdown -->
    <div
      v-if="menuOpen"
      class="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200/70 dark:border-white/10
             bg-white/95 dark:bg-zinc-900/95 backdrop-blur shadow-lg p-2 z-50"
    >
      <div class="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
        <div class="font-semibold">Account</div>
        <div class="mt-1 font-mono text-[11px] break-all">{{ account }}</div>
        <div class="mt-1 text-[11px] opacity-70">Network: {{ networkName }}</div>
      </div>
      <div class="h-px bg-zinc-200 dark:bg-white/10 my-2"></div>
      <button
        class="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-white/10"
        @click="copy()"
      >
        Copy address
      </button>
      <button
        class="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-white/10"
        @click="view()"
      >
        View on explorer
      </button>
      <button
        class="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
        @click="disconnect(); menuOpen=false"
      >
        Disconnect
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useWallet } from '@/composables/useWallet'

const { connect, disconnect, account, display, connecting, networkName, chainId } = useWallet()
const menuOpen = ref(false)

function copy() {
  if (!account.value) return
  navigator.clipboard.writeText(account.value)
}

function view() {
  if (!account.value) return
  // naive explorer mapping
  const c = chainId.value
  const base =
    c === 1 ? 'https://etherscan.io' :
    c === 11155111 ? 'https://sepolia.etherscan.io' :
    c === 56 ? 'https://bscscan.com' :
    c === 137 ? 'https://polygonscan.com' :
    'https://etherscan.io'
  window.open(`${base}/address/${account.value}`, '_blank')
}

watchEffect(() => {
  if (!account.value) menuOpen.value = false
})
</script>
