// server/api/user.get.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = query.userId

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single()

  // PGRST116 代表查無資料 (新用戶)，不當作伺服器錯誤
  if (error && error.code !== 'PGRST116') {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { data }
})