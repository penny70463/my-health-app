// POST /api/news/topics
import { createClient } from '@supabase/supabase-js'

function checkToken(event) {
  const token = process.env.DASHBOARD_API_TOKEN
  if (!token) throw createError({ statusCode: 500, message: 'DASHBOARD_API_TOKEN not set' })
  const auth = getHeader(event, 'authorization') ?? ''
  if (auth !== `Bearer ${token}`) throw createError({ statusCode: 401, message: 'Unauthorized' })
}

export default defineEventHandler(async (event) => {
  checkToken(event)

  const body = await readBody(event)
  const { topic, score, delta = 0, is_anomaly = false, date } = body
  if (!topic) throw createError({ statusCode: 400, message: 'topic required' })

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { error } = await supabase
    .from('topic_scores')
    .upsert(
      { date: date ?? today, topic, score: Number(score), delta: Number(delta), is_anomaly: Boolean(is_anomaly) },
      { onConflict: 'date,topic' }
    )

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
