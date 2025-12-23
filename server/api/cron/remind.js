// server/api/cron/remind.js
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // 1. 讀取環境變數
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

  // 檢查變數是否存在
  if (!supabaseUrl || !supabaseKey || !lineToken) {
    return { 
      success: false, 
      error: '環境變數遺失 (Environment variables missing)',
      hint: '請檢查 .env 檔案是否包含 SUPABASE_URL, SUPABASE_KEY, LINE_CHANNEL_ACCESS_TOKEN'
    }
  }

  // 初始化 Supabase
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 2. 找出需要提醒的用戶
  // 條件：is_reminder_enabled 為 true
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, water_count, leg_count')
    .eq('is_reminder_enabled', true)

  if (error) {
    return { success: false, error: error.message }
  }

  const results = []

  // 3. 逐一檢查並發送 LINE 訊息
  for (const user of users) {
    // 檢查是否已達標 (如果今天已經做完了，就不提醒)
    // 這裡的邏輯是：只要有一項沒完成，就提醒
    const isWaterDone = user.water_count >= 2000
    const isLegDone = user.leg_count >= 2
    
    // 如果兩項都完成了，就跳過這位使用者
    if (isWaterDone && isLegDone) {
      continue 
    }

    // 準備訊息內容
    const messages = [
      {
        type: 'text',
        text: `🌳 果園小管家提醒\n\n親愛的園丁，今天的任務還沒完成喔！\n\n💧 喝水：${user.water_count}/2000 cc\n🦵 抬腿：${user.leg_count}/2 組\n\n快回來照顧您的果樹吧！💪\n\n'https://liff.line.me/2008750422-1gfKbzUK'`
      }
    ]

    // 呼叫 LINE Messaging API (Push Message)
    try {
      const resp = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lineToken}`
        },
        body: JSON.stringify({
          to: user.user_id, // 發送給這個 User ID
          messages: messages
        })
      })
      
      const result = await resp.json()
      
      // 紀錄發送結果
      results.push({ 
        userId: user.user_id, 
        status: resp.status, 
        message: result.message || 'Sent' 
      })
      
    } catch (e) {
      console.error('Send Error', e)
      results.push({ userId: user.user_id, error: e.message })
    }
  }

  // 回傳執行結果給瀏覽器
  return { 
    success: true, 
    sent_count: results.length, 
    details: results 
  }
})