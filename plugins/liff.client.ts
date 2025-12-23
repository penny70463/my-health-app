import liff from '@line/liff'
import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin(async (nuxtApp) => {
  const LIFF_ID = process.env.LIFF_ID || '2008750422-1gfKbzUK'

  try {
    // 1. 初始化 LIFF
    await liff.init({ liffId: LIFF_ID })
    console.log('LIFF init success!', liff.id)
    
    // 2. 檢查是否在 LINE App 內，如果沒登入就強制登入
    // 這樣才能拿到使用者的 User ID
    if (!liff.isLoggedIn()) {
      liff.login()
    }
    
  } catch (error) {
    console.error('LIFF init failed', error)
  }

  // 3. 將 liff 物件注入到 Nuxt App 中
  // 這樣以後在其他頁面就可以用 useNuxtApp().$liff 來呼叫它
  return {
    provide: {
      liff
    }
  }
})