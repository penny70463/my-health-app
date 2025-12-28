// server/api/sync.post.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // 解構前端傳來的資料
  const { 
    userId, 
    waterCount, 
    legCount, 
    savedGrowth, 
    currentTreeId, 
    unlockedTrees, 
    displayName, // 🌟 接收 displayName
    // 設定相關欄位 (若有的話)
    goalWater,
    goalLeg,
    isReminderEnabled,
    reminderTime
  } = body

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

  // 1. 準備寫入資料庫的物件
  const payload = {
    user_id: userId,
    water_count: waterCount,
    leg_count: legCount,
    daily_water: waterCount,
    daily_leg: legCount,
    saved_growth: savedGrowth,
    current_tree_id: currentTreeId,
    unlocked_trees: unlockedTrees,
    last_active_date: today,
    last_updated: today
  }

  // 2. 如果有 displayName，就寫入/更新
  if (displayName) {
    payload.display_name = displayName
  }

  // 3. 如果有設定相關資料，也一起更新 (讓 saveSettings 也能共用這支 API)
  if (goalWater) payload.goal_water = goalWater
  if (goalLeg) payload.goal_leg = goalLeg
  if (isReminderEnabled !== undefined) payload.is_reminder_enabled = isReminderEnabled
  if (reminderTime) payload.reminder_time = reminderTime

  // 4. 執行 Upsert (略過 RLS)
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(payload)
    .select()

  if (error) {
    console.error('Sync Error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Database Error' })
  }

  return { success: true, data }
})