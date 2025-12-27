import liff from '@line/liff'
import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin(async () => {
  // 建議：直接填入 LIFF ID 字串最穩定，避免環境變數讀取不到的問題
  const LIFF_ID = '2008750422-1gfKbzUK' 

  try {
    // 1. 初始化 LIFF
    // 即使在本地，我們也嘗試初始化 (雖然可能因為 localhost 而報錯，但沒關係)
    await liff.init({ liffId: LIFF_ID })
    console.log('LIFF init success!', liff.id)
    
    // 🔴 關鍵修改：加入 !import.meta.dev 判斷
    // 邏輯：只有在「正式環境」且「尚未登入」時，才執行強制登入
    if (!import.meta.dev && !liff.isLoggedIn()) {
      liff.login()
    } else if (import.meta.dev) {
      // 如果是本地開發，就印出這行字，不做任何事
      console.log('🚧 本地開發模式：已略過 LIFF 強制登入')
    }
    
  } catch (error) {
    // 在本地開發時，liff.init 失敗是正常的 (因為網域不對)，我們用 warn 顯示就好，不要報紅字
    if (import.meta.dev) {
      console.warn('LIFF init failed (這是正常的，因為正在 localhost 執行)', error)
    } else {
      console.error('LIFF init failed', error)
    }
  }

  // 3. 將 liff 物件注入到 Nuxt App 中
  return {
    provide: {
      liff
    }
  }
})