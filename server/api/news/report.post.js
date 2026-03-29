// POST /api/news/report
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
  const { content, top_industry = '', top_policy = '', date } = body
  if (!content) throw createError({ statusCode: 400, message: 'content required' })

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { error } = await supabase
    .from('daily_reports')
    .upsert(
      { date: date ?? today, content, top_industry, top_policy },
      { onConflict: 'date' }
    )

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
