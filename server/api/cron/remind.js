// server/api/cron/remind.js
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // 1. 讀取環境變數
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

  if (!supabaseUrl || !supabaseKey || !lineToken) {
    return { 
      success: false, 
      error: '環境變數遺失',
      hint: '請檢查 .env 檔案'
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 2. 取得「台灣時間」的現在「小時」與「日期」
  // currentHour 範例: "08", "09", "14" (24小時制)
  const currentHour = new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    hour12: false, 
    timeZone: 'Asia/Taipei' 
  })
  
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

  console.log(`⏰ Cron Job 啟動，檢查時間：${currentHour} 點, 日期：${today}`)

  // 3. 找出需要提醒的用戶
  // 條件：開啟提醒 + 提醒時間的開頭符合目前小時
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, daily_water, daily_leg, last_active_date, reminder_time')
    .eq('is_reminder_enabled', true)
    .ilike('reminder_time', `${currentHour}:%`) // 🌟 關鍵：只抓 "08:xx" 的人

  if (error) {
    return { success: false, error: error.message }
  }

  const results = []

  // 4. 逐一檢查
  for (const user of users) {
    let currentWater = 0
    let currentLeg = 0

    // 🌟 判斷日期 (避免跨日數據干擾)
    if (user.last_active_date === today) {
      currentWater = user.daily_water || 0
      currentLeg = user.daily_leg || 0
    } else {
      currentWater = 0
      currentLeg = 0
    }

    // 檢查是否達標 (兩項都完成就不提醒)
    const isWaterDone = currentWater >= 2000
    const isLegDone = currentLeg >= 2
    
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

  return { 
    success: true, 
    check_time: `${today} ${currentHour}:00`,
    matched_users: users.length,
    sent_count: results.length, 
    details: results 
  }
})