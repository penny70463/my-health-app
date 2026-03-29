// GET /api/news/stats
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const [words, topics, latestDate] = await Promise.all([
    supabase.from('word_freq').select('word', { count: 'exact', head: true }),
    supabase.from('topic_scores').select('date', { count: 'exact', head: true }),
    supabase.from('topic_scores').select('date').order('date', { ascending: false }).limit(1)
  ])

  return {
    total_words: words.count ?? 0,
    total_days: topics.count ?? 0,
    latest_date: latestDate.data?.[0]?.date ?? null
  }
})
