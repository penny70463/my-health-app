import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const userId = query.userId?.trim()

  if (!id || !userId) {
    throw createError({ statusCode: 400, statusMessage: 'Job ID and user ID are required' })
  }

  const { data, error } = await supabaseAdmin
    .from('openclaw_jobs')
    .select('id,user_id,display_name,prompt,response_text,status,error_message,source,created_at,updated_at,started_at,completed_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error?.code === 'PGRST116') {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  if (error) {
    console.error('[openclaw-jobs-id.get] query failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database Error' })
  }

  return { job: data }
})
