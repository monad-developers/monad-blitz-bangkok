<!-- layouts/default.vue -->
<template>
  <div class="min-h-dvh bg-white text-zinc-900 dark:bg-[#0B0F14] dark:text-zinc-100">
    <!-- Global header -->
    <header class="border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 class="text-lg font-semibold">AI Gateway</h1>
        <button class="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black"
                @click="toggleTheme">
          {{ isDark ? 'Light' : 'Dark' }} Mode
        </button>
      </div>
    </header>

    <!-- Page content -->
    <main class="max-w-7xl mx-auto px-6 py-10">
      <slot />
    </main>

    <!-- Global footer -->
    <footer class="mt-16 border-t border-black/5 dark:border-white/10 py-6 text-sm text-zinc-500">
      <div class="max-w-7xl mx-auto px-6">© {{ new Date().getFullYear() }} AI Gateway</div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const isDark = useState<boolean>('isDark')
function toggleTheme() { isDark.value = !isDark.value }
</script>
