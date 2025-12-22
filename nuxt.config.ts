// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 設定為今天或固定的日期，消除警告
  compatibilityDate: '2024-12-22',
  ssr: false,
  // 關閉 Nuxt 開發工具，避免舊環境報錯
  devtools: { enabled: false },
  
  // 載入 Tailwind
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '長青幸福果園',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  // 1. 關閉 SourceMap，解決找不到檔案的問題
  sourcemap: {
    server: false,
    client: false
  },

  // 2. 避免建置時過度檢查 TS
  typescript: {
    typeCheck: false
  },

  // 3. 確保實驗性功能關閉 (避免 macro 錯誤)
  experimental: {
    macros: false
  },
  // 4. [新增] 關閉 Vue 的實驗性功能 (Macro)，這是避免那個錯誤的關鍵
  features: {
    inlineSSRStyles: false
  },
  vue: {
    propsDestructure: false
  }
})
