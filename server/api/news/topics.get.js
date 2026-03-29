// GET /api/news/topics?days=30&topic=半導體
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { days = 30, topic } = getQuery(event)

  const since = new Date()
  since.setDate(since.getDate() - Number(days))
  const sinceStr = since.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  let query = supabase
    .from('topic_scores')
    .select('date, topic, score, delta, is_anomaly')
    .gte('date', sinceStr)
    .order('date', { ascending: true })

  if (topic) query = query.eq('topic', topic)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
