import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = query.userId?.trim()
  const limit = Math.min(Number(query.limit || 20) || 20, 50)

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
  }

  const { data, error } = await supabaseAdmin
    .from('openclaw_jobs')
    .select('id,user_id,display_name,prompt,response_text,status,error_message,source,created_at,updated_at,started_at,completed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[openclaw-jobs.get] query failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database Error' })
  }

  return { jobs: data || [] }
})
