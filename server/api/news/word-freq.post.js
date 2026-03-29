// POST /api/news/word-freq  → 新增詞彙（count=1）
// POST /api/news/word-freq  with action=increment → 詞頻+1
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
  const { word, date, category = '', source = 'manual', action } = body

  if (!word) throw createError({ statusCode: 400, message: 'word required' })

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
  const targetDate = date ?? today

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  if (action === 'increment') {
    // 詞頻 +1
    const { data: existing } = await supabase
      .from('word_freq')
      .select('id, count')
      .eq('word', word)
      .eq('date', targetDate)
      .eq('category', category)
      .single()

    if (!existing) throw createError({ statusCode: 404, message: 'word not found' })

    const { error } = await supabase
      .from('word_freq')
      .update({ count: existing.count + 1 })
      .eq('id', existing.id)

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { count: existing.count + 1 }
  }

  // 新增詞彙
  const { data, error } = await supabase
    .from('word_freq')
    .insert({ word, date: targetDate, count: 1, category, source })
    .select('id, count')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { id: data.id, count: data.count }
})
