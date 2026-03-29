// GET /api/news/word-freq?date=&category=&limit=50
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { date, category, limit = 50 } = getQuery(event)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  let query = supabase
    .from('word_freq')
    .select('word, count, category, date')
    .order('count', { ascending: false })
    .limit(Math.min(Number(limit), 200))

  if (date) query = query.eq('date', date)
  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
