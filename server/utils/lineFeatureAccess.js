import { createClient } from '@supabase/supabase-js'
import { createError } from 'h3'

/**
 * 功能權限以 Supabase `users` 為準（與 LINE 登入分開）：
 * - allowed_chat：小亮 Web 聊天 / openclaw jobs
 * - allowed_dashboard：財經 news API、儀表板
 *
 
 * 查無列、欄位為 null、或查詢失敗 → 一律視為 false。
 */

function tryGetSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function fetchUserFeatureFlags(userId) {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return { chat: false, dashboard: false }
  }

  try {
    const supabase = tryGetSupabaseAdmin()
    if (!supabase) {
      console.warn('[lineFeatureAccess] SUPABASE_URL / SERVICE_KEY 未設定')
      return { chat: false, dashboard: false }
    }
    const { data, error } = await supabase
      .from('users')
      .select('allowed_chat, allowed_dashboard')
      .eq('user_id', userId.trim())
      .maybeSingle()

    if (error) {
      console.warn('[lineFeatureAccess] supabase:', error.message)
      return { chat: false, dashboard: false }
    }
    if (!data) {
      return { chat: false, dashboard: false }
    }

    return {
      chat: !!data.allowed_chat,
      dashboard: !!data.allowed_dashboard,
    }
  } catch (e) {
    console.warn('[lineFeatureAccess]', e)
    return { chat: false, dashboard: false }
  }
}

export async function assertLineChatAccess(userId) {
  if (!tryGetSupabaseAdmin()) {
    throw createError({ statusCode: 503, statusMessage: 'Feature check unavailable' })
  }
  const { chat } = await fetchUserFeatureFlags(userId)
  if (!chat) {
    throw createError({ statusCode: 403, statusMessage: 'Chat access denied' })
  }
}

export async function assertDashboardAccess(userId) {
  if (!tryGetSupabaseAdmin()) {
    throw createError({ statusCode: 503, statusMessage: 'Feature check unavailable' })
  }
  const { dashboard } = await fetchUserFeatureFlags(userId)
  if (!dashboard) {
    throw createError({ statusCode: 403, statusMessage: 'Dashboard access denied' })
  }
}
