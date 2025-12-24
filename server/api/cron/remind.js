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

  // 1. 取得「台灣時間」的今天日期 (格式 YYYY-MM-DD)
  // 這是為了跟資料庫的 last_active_date 比對
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

  // 2. 找出需要提醒的用戶
  // 多選取 daily_water, daily_leg, last_active_date
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, daily_water, daily_leg, last_active_date')
    .eq('is_reminder_enabled', true)

  if (error) {
    return { success: false, error: error.message }
  }

  const results = []

  // 3. 逐一檢查
  for (const user of users) {
    let currentWater = 0
    let currentLeg = 0

    // 🌟 關鍵邏輯：判斷日期 🌟
    // 如果資料庫紀錄的日期是「今天」，才採信 daily 數值
    // 如果日期是舊的 (null 或 昨天)，代表今天還沒動，數值視為 0
    if (user.last_active_date === today) {
      currentWater = user.daily_water || 0
      currentLeg = user.daily_leg || 0
    } else {
      currentWater = 0
      currentLeg = 0
    }

    // 檢查是否達標
    const isWaterDone = currentWater >= 2000
    const isLegDone = currentLeg >= 2
    
    // 兩項都完成，就不吵他
    if (isWaterDone && isLegDone) {
      continue 
    }

    // 準備訊息
    const messages = [
      {
        type: 'text',
        text: `🌳 果園小管家提醒\n\n親愛的園丁，今天的任務還沒完成喔！\n\n💧 喝水：${currentWater}/2000 cc\n🦵 抬腿：${currentLeg}/2 組\n\n快回來照顧您的果樹吧！💪\n\nhttps://liff.line.me/2008750422-1gfKbzUK`
      }
    ]

    // 發送 LINE 訊息
    try {
      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lineToken}`
        },
        body: JSON.stringify({
          to: user.user_id,
          messages: messages
        })
      })
      
      results.push({ userId: user.user_id, status: 'Sent' })
    } catch (e) {
      console.error('Send Error', e)
      results.push({ userId: user.user_id, error: e.message })
    }
  }

  return { success: true, sent_count: results.length, details: results }
})