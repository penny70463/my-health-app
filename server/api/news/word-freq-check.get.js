// GET /api/news/word-freq-check?word=輝達&category=半導體
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { word, category = '' } = getQuery(event)
  if (!word) throw createError({ statusCode: 400, message: 'word required' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { data, error } = await supabase
    .from('word_freq')
    .select('count, date')
    .eq('word', word)
    .eq('category', category)
    .order('date', { ascending: false })
    .limit(1)

  if (error) throw createError({ statusCode: 500, message: error.message })

  if (data && data.length > 0) {
    return { exists: true, count: data[0].count, last_date: data[0].date }
  }
  return { exists: false }
})
