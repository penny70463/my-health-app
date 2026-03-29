// server/api/openclaw-webhook.js
// LINE webhook 專用給 OpenClaw 的新 Channel（含驗簽）
import crypto from 'crypto'

async function verifySignature(secret, body, signature) {
  const hmac = crypto.createHmac('SHA256', secret)
  hmac.update(body)
  const digest = hmac.digest('base64')
  return digest === signature
}

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    return { error: 'Method not allowed' }
  }

  const channelSecret = process.env.OPENCLAW_LINE_CHANNEL_SECRET
  const accessToken = process.env.OPENCLAW_LINE_CHANNEL_ACCESS_TOKEN
  const openclawUrl = process.env.OPENCLAW_API_URL
  const openclawKey = process.env.OPENCLAW_API_KEY

  if (!channelSecret || !accessToken) {
    console.error('[openclaw-webhook] 缺少環境變數')
    return sendNoContent(event, 200)
  }

  // 讀取原始 body 用來驗簽
  const rawBody = await readRawBody(event)
  const signature = getHeader(event, 'x-line-signature')

  if (!signature || !(await verifySignature(channelSecret, rawBody, signature))) {
    console.warn('[openclaw-webhook] 驗簽失敗')
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  const body = JSON.parse(rawBody)
  const events = body.events

  if (!events || events.length === 0) {
    return sendNoContent(event, 200)
  }

  for (const lineEvent of events) {
    // 只處理使用者傳來的文字訊息
    if (lineEvent.type !== 'message' || lineEvent.message?.type !== 'text') continue

    const replyToken = lineEvent.replyToken
    const userMessage = lineEvent.message.text
    const userId = lineEvent.source?.userId ?? 'unknown'

    console.log(`[openclaw-webhook] userId=${userId} msg=${userMessage}`)

    let replyText = ''

    if (openclawUrl) {
      // 轉發給 OpenClaw
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (openclawKey) headers['Authorization'] = `Bearer ${openclawKey}`

        const res = await $fetch(openclawUrl, {
          method: 'POST',
          headers,
          body: {
            message: userMessage,
            userId,
            source: 'line'
          }
        })
        replyText = res?.reply ?? res?.message ?? String(res)
      } catch (err) {
        console.error('[openclaw-webhook] 呼叫 OpenClaw 失敗', err)
        replyText = '小亮目前無法回應，請稍後再試。'
      }
    } else {
      // 回音 fallback（OpenClaw 未設定時）
      replyText = `[echo] ${userMessage}`
    }

    // 透過 LINE Messaging API 回覆
    if (replyToken && replyText) {
      await $fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: {
          replyToken,
          messages: [{ type: 'text', text: replyText }]
        }
      })
    }
  }

  return sendNoContent(event, 200)
})
