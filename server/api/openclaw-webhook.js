// server/api/openclaw-webhook.js
// LINE webhook 專用給 OpenClaw 的新 Channel（含驗簽）
import crypto from 'crypto'

async function verifySignature(secret, body, signature) {
  const hmac = crypto.createHmac('SHA256', secret)
  hmac.update(body)
  const digest = hmac.digest('base64')
  return digest === signature
}

function getLineTargetId(source = {}) {
  return source.userId || source.groupId || source.roomId || ''
}

async function replyLineMessage(accessToken, replyToken, text) {
  if (!replyToken || !text) return

  await $fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: {
      replyToken,
      messages: [{ type: 'text', text }]
    }
  })
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
    const userMessage = lineEvent.message.text?.trim()
    const userId = lineEvent.source?.userId ?? 'unknown'
    const targetId = getLineTargetId(lineEvent.source)

    if (!userMessage) continue

    console.log(`[openclaw-webhook] userId=${userId} targetId=${targetId} msg=${userMessage}`)

    if (!openclawUrl) {
      // 回音 fallback（OpenClaw 未設定時）
      try {
        await replyLineMessage(accessToken, replyToken, `[echo] ${userMessage}`)
      } catch (err) {
        console.error('[openclaw-webhook] fallback reply 失敗', err)
      }
      continue
    }

    // 轉交給 relay 之後就立刻結束 webhook，真正的 OpenClaw 推理與 LINE 回覆交給 relay 背景處理
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (openclawKey) headers['Authorization'] = `Bearer ${openclawKey}`

      await $fetch(openclawUrl, {
        method: 'POST',
        headers,
        timeout: 4000,
        body: {
          message: userMessage,
          userId,
          targetId,
          source: 'line',
          replyMode: 'push',
          lineAccessToken: accessToken
        },
      })
    } catch (err) {
      console.error('[openclaw-webhook] relay 呼叫失敗', err)

      try {
        await replyLineMessage(accessToken, replyToken, '小亮目前忙線中，請稍後再試。')
      } catch (replyErr) {
        console.error('[openclaw-webhook] fallback reply 失敗', replyErr)
      }
    }
  }

  return sendNoContent(event, 200)
})
