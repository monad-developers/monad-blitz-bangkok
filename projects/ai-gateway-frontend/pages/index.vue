<!-- pages/index.vue -->
<template>
  <section class="grid place-items-center min-h-[70vh] text-center">
    <div class="space-y-4 max-w-2xl">
      <h2 class="text-4xl font-bold">Welcome to AI Gateway</h2>
      <p class="text-zinc-500 dark:text-zinc-400">
        Ask anything. Connect your wallet. Build cool stuff.
      </p>
      <div class="mt-6 space-x-3">
        <NuxtLink
          to="/app"
          class="inline-flex items-center px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black"
        >Get Started</NuxtLink>
        <a href="https://example.com/docs" target="_blank"
           class="inline-flex items-center px-5 py-2.5 rounded-xl bg-zinc-200 dark:bg-white/10">
          Docs
        </a>
      </div>
    </div>
  </section>
</template>
