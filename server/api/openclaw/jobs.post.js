import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

function pickJobFields(job) {
  return {
    id: job.id,
    user_id: job.user_id,
    display_name: job.display_name,
    prompt: job.prompt,
    response_text: job.response_text,
    status: job.status,
    error_message: job.error_message,
    source: job.source,
    created_at: job.created_at,
    updated_at: job.updated_at,
    started_at: job.started_at,
    completed_at: job.completed_at
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userId = body?.userId?.trim()
  const prompt = body?.prompt?.trim()
  const displayName = body?.displayName?.trim() || null

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
  }

  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt is required' })
  }

  const now = new Date().toISOString()
  const payload = {
    id: crypto.randomUUID(),
    user_id: userId,
    display_name: displayName,
    prompt: prompt.slice(0, 4000),
    status: 'pending',
    source: 'liff',
    created_at: now,
    updated_at: now
  }

  const { data, error } = await supabaseAdmin
    .from('openclaw_jobs')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('[openclaw-jobs.post] insert failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database Error' })
  }

  return { job: pickJobFields(data) }
})
