<template>
  <div class="min-h-screen flex flex-col bg-softBeige text-deepBrown">
    <header class="w-full bg-orchardGreen text-white px-4 py-3 shadow-soft">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="text-2xl font-semibold tracking-wide">長青幸福果園</div>
        <div class="text-sm opacity-90">每日喝水・抬腿養生</div>
      </div>
    </header>

    <main class="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-4">
      <slot />
    </main>

    <footer
      class="w-full bg-white/80 text-sm text-center text-deepBrown/80 py-3 border-t border-deepBrown/10"
    >
      <div class="max-w-4xl mx-auto">© 長青幸福果園 · 健康相伴</div>
    </footer>
  </div>
</template>

