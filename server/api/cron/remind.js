// server/api/cron/remind.js
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  console.log('🚀 [Cron] 開始執行 Remind Job...')

  // 1. 環境變數與設定
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  // 優先嘗試使用 Service Key (權限較高)，若無則使用一般 Key
  const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_KEY 
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  
  // 檢查變數是否齊全
  if (!supabaseUrl || !supabaseKey || !lineToken) {
    console.error('❌ [Error] 環境變數遺失，請檢查 .env 設定')
    return { error: 'Environment variables missing' }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 2. 取得時間 (台灣時區)
  const currentHour = new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', hour12: false, timeZone: 'Asia/Taipei' 
  })
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
  const hourInt = parseInt(currentHour, 10)

  console.log(`🕒 目前台灣時間：${today} ${currentHour}:00 (HourInt: ${hourInt})`)

  // 3. 判斷動態問候語
  let greeting = "👋 您好"
  let subText = "休息一下，喝口水吧！"

  if (hourInt >= 5 && hourInt < 11) {
    greeting = "☀️ 早安！"
    subText = "美好的一天從健康習慣開始，別忘了喝水喔！"
  } else if (hourInt >= 11 && hourInt < 14) {
    greeting = "🍱 午安！"
    subText = "午餐時間到了，起來走動走動，補充水分吧！"
  } else if (hourInt >= 14 && hourInt < 18) {
    greeting = "☕ 午後時光"
    subText = "工作辛苦了！喝杯水提提神，做個抬腿運動吧！"
  } else {
    greeting = "🌙 晚安"
    subText = "忙碌了一天，記得把今日目標完成，好夢入睡喔！"
  }
  
  console.log(`💬 決定問候語：${greeting}`)

  // 4. 查詢資料庫 (使用 ilike 模糊搜尋)
  const searchPattern = `%${currentHour}:00%`
  console.log(`🔍 搜尋條件：enabled=true 且 reminder_time 包含 '${searchPattern}'`)

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_reminder_enabled', true)
    .ilike('reminder_time', searchPattern)

  if (error) {
    console.error('❌ [DB Error] 資料庫查詢失敗:', error.message)
    return { error: error.message }
  }

  console.log(`👥 查詢結果：找到 ${users.length} 位用戶需在此時段提醒`)

  if (users.length === 0) {
    console.log('😴 本時段無人需提醒，任務結束。')
    return { message: 'No users matched this hour' }
  }

  const results = []

  // 5. 逐一檢查並發送
  for (const user of users) {
    // 隱碼處理 User ID，只印前5碼，保護隱私
    const maskedId = user.user_id ? `${user.user_id.slice(0, 5)}...` : 'Unknown'
    console.log(`👉 正在檢查用戶 [${maskedId}]...`)

    // 判斷日期與進度
    let currentWater = 0
    let currentLeg = 0
    
    // 只有當日期是「今天」時，才採信資料庫裡的 daily 數值
    if (user.last_active_date === today) {
      currentWater = user.daily_water || 0
      currentLeg = user.daily_leg || 0
    }
    
    console.log(`   📊 當前進度：水 ${currentWater}cc / 腿 ${currentLeg}組 (紀錄日期: ${user.last_active_date})`)

    // 檢查是否達標
    const isWaterDone = currentWater >= 2000
    const isLegDone = currentLeg >= 2

    if (isWaterDone && isLegDone) {
      console.log(`   ✅ 該用戶今日任務已全部完成，跳過不打擾。`)
      continue 
    }

    // 發送 LINE 訊息
    try {
      console.log(`   📤 準備發送 LINE 訊息...`)
      
      // 確保 LIFF ID 存在，若環境變數沒設，使用預設值避免壞掉
      const liffUrl = `https://liff.line.me/${process.env.LIFF_ID || '2008750422-1gfKbzUK'}`

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
            text: `${greeting} 農場小管家提醒\n\n${subText}\n\n💧 今日喝水：${currentWater}/2000 cc\n🦵 今日抬腿：${currentLeg}/2 組\n\n快回來照顧您的果樹吧！💪\n\n${liffUrl}`
          }]
        })
      })
      
      console.log(`   ✨ 發送成功！`)
      results.push({ userId: user.user_id, status: 'Sent' })
    } catch (e) {
      console.error(`   ❌ [Send Error] 發送失敗:`, e)
      results.push({ userId: user.user_id, error: e.message })
    }
  }

  // 6. 最終報告
  const finalReport = { 
    success: true, 
    check_time: `${today} ${currentHour}:00`,
    matched_users: users.length,
    sent_count: results.length,
    details: results
  }

  // 這一行最重要！讓 Vercel Logs 能看到完整的 JSON 結果
  console.log('📊 [Report] 執行結果報告:', JSON.stringify(finalReport, null, 2))

  return finalReport
})