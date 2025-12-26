<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <header
      class="w-full bg-gradient-to-r from-indigo-500 to-sky-500 text-white px-4 py-3 shadow-soft"
    >
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="text-xl font-semibold tracking-wide">長青幸福農場</div>
        <div class="text-xs md:text-sm opacity-90">
          輕鬆記錄喝水與抬腿的小小任務
        </div>
      </div>
    </header>

    <main class="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-4">
      <slot />
    </main>

    <footer
      class="w-full bg-white/80 text-xs md:text-sm text-center text-slate-500 py-3 border-t border-slate-200"
    >
      <div class="max-w-4xl mx-auto">© 長青幸福農場 · 健康相伴</div>
    </footer>
  </div>
</template>

