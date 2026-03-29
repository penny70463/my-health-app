// GET /api/news/dates  → 有報告的日期列表（最新60筆）
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { data, error } = await supabase
    .from('daily_reports')
    .select('date')
    .order('date', { ascending: false })
    .limit(60)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data.map(r => r.date)
})
