// server/api/webhook.js
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // 1. 只允許 POST 請求
  if (event.node.req.method !== 'POST') {
    return { error: 'Method not allowed' }
  }

  // 2. 讀取 LINE 傳來的資料
  const body = await readBody(event)
  const events = body.events

  // 如果沒有事件 (例如 LINE Verify 按鈕有時候只傳送空測試)，直接回傳 OK
  if (!events || events.length === 0) {
    return 'OK'
  }

  // 3. 初始化 Supabase
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 4. 處理每一個事件
  for (const lineEvent of events) {
    // 🔍 監聽 "follow" 事件 (使用者加入好友/解除封鎖)
    if (lineEvent.type === 'follow') {
      const userId = lineEvent.source.userId
      const replyToken = lineEvent.replyToken

      console.log('新朋友加入！User ID:', userId)

      // A. 將使用者存入資料庫 (如果不存在的話)
      const { error } = await supabase
        .from('users')
        .upsert({ 
          user_id: userId,
          is_reminder_enabled: true, // 預設開啟提醒
          last_updated: new Date().toISOString().split('T')[0]
        }, { onConflict: 'user_id' })
        .select()

      // B. 發送歡迎訊息 (可選)
      // 這裡需要用 replyToken 回覆，或者直接忽略，讓歡迎詞由 LINE 後台設定就好
    }

    // 🔍 監聽 "unfollow" 事件 (使用者封鎖/刪除好友)
    if (lineEvent.type === 'unfollow') {
      const userId = lineEvent.source.userId
      // 可以選擇把他在資料庫標記為停用，或刪除
      await supabase
        .from('users')
        .update({ is_reminder_enabled: false })
        .eq('user_id', userId)
    }
  }

  // 5. 告訴 LINE 我們收到了 (必須回傳 200 OK)
  return 'OK'
})