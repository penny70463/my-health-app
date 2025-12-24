// server/api/cron/remind.js
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  console.log('🚀 開始執行 Remind Cron Job...')

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

  if (!supabaseUrl || !supabaseKey || !lineToken) {
    console.error('❌ 環境變數遺失')
    return { error: 'Env missing' }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. 計算時間
  const currentHour = new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', hour12: false, timeZone: 'Asia/Taipei' 
  })
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

  console.log(`🕒 目前台灣時間：${today} ${currentHour}:00`)

  // 2. 查詢資料庫
  const queryTime = `${currentHour}:00:00`
  console.log(`🔍 正在搜尋條件：is_reminder_enabled=true 且 reminder_time 為 ${queryTime}`)

  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, daily_water, daily_leg, last_active_date, reminder_time')
    .eq('is_reminder_enabled', true)
    .eq('reminder_time', queryTime)

  if (error) {
    console.error('❌ 資料庫查詢失敗:', error.message)
    return { success: false, error: error.message }
  }

  // 🌟 這裡會告訴我們到底抓到了幾個人
  console.log(`👥 查詢結果：找到 ${users.length} 位用戶設定在 ${currentHour} 點通知`)

  // 如果沒人，直接結束
  if (users.length === 0) {
    console.log('😴 目前時段無人需要通知，任務結束。')
    return { success: true, message: 'No users matched this hour', matched: 0 }
  }

  const results = []

  // 3. 逐一發送
  for (const user of users) {
    console.log(`👉 正在檢查用戶 ${user.user_id.slice(0, 5)}... (進度: 水${user.daily_water}/腿${user.daily_leg})`)
    
    // 判斷日期
    let currentWater = 0
    let currentLeg = 0
    
    if (user.last_active_date === today) {
      currentWater = user.daily_water || 0
      currentLeg = user.daily_leg || 0
    }
    // (如果是舊日期，預設就是 0，不用 else)

    const isWaterDone = currentWater >= 2000
    const isLegDone = currentLeg >= 2
    
    if (isWaterDone && isLegDone) {
      console.log(`   ✅ 該用戶今日任務已完成，跳過不發送。`)
      continue 
    }

    // 發送訊息
    try {
      console.log(`   📤 準備發送 LINE 訊息...`)
      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lineToken}`
        },
        body: JSON.stringify({
          to: user.user_id,
          messages: [{
            type: 'text',
            text: `🌳 果園小管家提醒\n\n親愛的園丁，今天的任務還沒完成喔！\n\n💧 喝水：${currentWater}/2000 cc\n🦵 抬腿：${currentLeg}/2 組\n\n快回來照顧您的果樹吧！💪\n\nhttps://liff.line.me/${process.env.LIFF_ID || '2008750422-1gfKbzUK'}` 
            // 注意：這裡我加了 fallback，確保網址正確
          }]
        })
      })
      
      console.log(`   ✨ 發送成功！`)
      results.push({ userId: user.user_id, status: 'Sent' })
    } catch (e) {
      console.error(`   ❌ 發送失敗:`, e)
      results.push({ userId: user.user_id, error: e.message })
    }
  }

  // 4. 總結報告
  const finalReport = { 
    success: true, 
    check_time: `${today} ${currentHour}:00`,
    matched_users: users.length,
    sent_count: results.length,
    details: results
  }
  
  console.log('📊 最終執行報告:', JSON.stringify(finalReport, null, 2))
  return finalReport
})