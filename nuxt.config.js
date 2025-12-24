// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 設定為今天或固定的日期，消除警告
  compatibilityDate: '2024-12-22',
  // 關閉 Nuxt 開發工具，避免舊環境報錯
  devtools: { enabled: false },
  
  // 載入 Tailwind
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '長青幸福果園',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
      bodyAttrs: {
        class: 'overscroll-none' // 防止在 iOS 上拉動時出現橡皮筋效果
      }
    }
  },
  // 1. 關閉 SourceMap，解決找不到檔案的問題
  sourcemap: {
    server: false,
    client: false
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
  },
  supabase: {
    // 關閉內建的登入轉址功能，避免 App 一打開就被導向登入頁
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  nitro: {
    preset: 'vercel'
  }
})

