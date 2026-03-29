// GET /api/news/report?date=2026-03-29
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
  const { date = today } = getQuery(event)

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('date', date)
    .single()

  if (error?.code === 'PGRST116') {
    throw createError({ statusCode: 404, message: 'not found' })
  }
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
