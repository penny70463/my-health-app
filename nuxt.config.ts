// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 設定為今天或固定的日期，消除警告
  compatibilityDate: '2024-12-22',
  
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
  }
})
