<template>
  <div class="antialiased min-h-dvh w-full bg-blue-50 text-slate-800">
    <NuxtPage />
  </div>
</template>

<style>
/* 全域 CSS 設定 
*/
html {
  -webkit-tap-highlight-color: transparent; /* 移除點擊高亮 */
}

body {
  margin: 0;
  padding: 0;
  background-color: #eff6ff; /* 再次確保背景色一致 (Tailwind bg-blue-50) */
  overscroll-behavior-y: none; /* 防止過度拉動 */
}
</style>