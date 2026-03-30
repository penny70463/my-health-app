// GET /api/news/word-freq
// 詞雲快照：?date=&category=&limit=50
// 單詞趨勢：?word=&days=30（依日期升序，供圖表用）
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const { date, category, limit = 50, word, days } = q
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  if (word) {
    const daysNum = Math.min(Math.max(Number(days) || 30, 1), 366)
    const since = new Date()
    since.setDate(since.getDate() - daysNum)
    const sinceStr = since.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

    const { data, error } = await supabase
      .from('word_freq')
      .select('word, count, category, date')
      .eq('word', word)
      .gte('date', sinceStr)
      .order('date', { ascending: true })

    if (error) throw createError({ statusCode: 500, message: error.message })
    return data ?? []
  }

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
