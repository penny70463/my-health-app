<template>
  <section
    class="min-h-dvh bg-[radial-gradient(circle_at_top,_#ecfdf5,_#f8fafc_45%,_#e0f2fe)] px-4 pb-28 pt-4"
    style="padding-top: max(1rem, env(safe-area-inset-top)); padding-bottom: max(7rem, env(safe-area-inset-bottom));"
  >
    <div class="mx-auto flex w-full max-w-md flex-col gap-4">
      <div class="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
        <!-- 導覽與 eyebrow 同一列，避免與標題／輸入區並排時被誤認成送出 -->
        <div class="flex w-full flex-col gap-3">
          <div class="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-2">
            <p class="min-w-0 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
              小亮健康助理
            </p>
            <nav class="flex shrink-0 flex-wrap items-center justify-end gap-2" aria-label="頁面導覽">
              <NuxtLink
                to="/dashboard"
                class="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                看儀表板
              </NuxtLink>
              <NuxtLink
                to="/"
                class="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                返回農場
              </NuxtLink>
            </nav>
          </div>
          <div class="w-full min-w-0">
            <h1 class="text-balance text-2xl font-bold leading-snug text-slate-800 break-words">
              和小亮聊聊今天的狀態
            </h1>
            <p class="mt-1 text-sm text-slate-500 break-words">
              {{ headerText }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-[30px] border border-white/70 bg-white/80 p-3 shadow-soft backdrop-blur">
        <div ref="messageScroller" class="flex max-h-[60dvh] min-h-[52dvh] flex-col gap-4 overflow-y-auto px-1 py-2">
          <div
            v-if="isBooting"
            class="rounded-3xl bg-slate-100 px-4 py-6 text-center text-sm font-medium text-slate-500"
          >
            正在確認 LINE 身分，請稍候...
          </div>

          <template v-else-if="messageBlocks.length">
            <div
              v-for="block in messageBlocks"
              :key="block.id"
              :class="block.role === 'user' ? 'items-end' : 'items-start'"
              class="flex flex-col gap-1"
            >
              <span class="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {{ block.role === 'user' ? 'You' : 'Xiao Liang' }}
              </span>
              <div
                :class="block.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'"
                class="max-w-[88%] rounded-[24px] px-4 py-3 text-[15px] leading-7 shadow-sm"
              >
                <template v-if="block.pending">
                  <span class="inline-flex items-center gap-2 text-sm font-medium">
                    <span class="h-2 w-2 animate-pulse rounded-full bg-current" />
                    小亮正在整理回覆...
                  </span>
                </template>
                <template v-else>
                  <div v-if="block.role === 'user'" class="whitespace-pre-wrap break-words">
                    {{ block.text }}
                  </div>
                  <div v-else class="assistant-msg relative min-w-0">
                    <button
                      type="button"
                      class="assistant-copy-all absolute -right-1 -top-1 z-10 rounded-full border border-slate-200/90 bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm hover:bg-emerald-50"
                      aria-label="複製整則回覆"
                      @click.stop="copyAssistantMessage(block.text)"
                    >
                      複製
                    </button>
                    <div
                      class="chat-md break-words pr-10 text-[15px] leading-7 [&_a]:text-emerald-700 [&_a]:underline"
                      @click="onChatMdClick"
                      v-html="assistantMarkdownToHtml(block.text)"
                    />
                  </div>
                </template>
              </div>
            </div>
          </template>

          <div
            v-else
            class="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/70 px-5 py-8 text-center text-sm leading-7 text-emerald-900"
          >
            在這裡留下你的問題、想法或今天的身體狀態。<br>
            小亮整理好回覆後，會直接顯示在這個聊天室。
          </div>
        </div>
      </div>
    </div>

    <form
      class="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/90 px-4 pb-4 pt-3 shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur"
      style="padding-bottom: max(1rem, env(safe-area-inset-bottom));"
      @submit.prevent="sendMessage"
    >
      <div class="mx-auto flex w-full max-w-md items-end gap-3">
        <textarea
          v-model="draft"
          rows="1"
          maxlength="4000"
          placeholder="輸入想問小亮的內容..."
          class="min-h-[56px] flex-1 resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] leading-6 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white"
          :disabled="!canType"
          @keydown="onDraftKeydown"
        />
        <button
          type="submit"
          :disabled="!canSend"
          class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          ↑
        </button>
      </div>
      <p v-if="errorMessage" class="mx-auto mt-2 w-full max-w-md px-2 text-sm text-rose-500">
        {{ errorMessage }}
      </p>
    </form>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import MarkdownIt from 'markdown-it'

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const mdAssistant = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

/** 僅供「複製整則」：不覆寫 fence，輸出標準 pre/code，再轉成純文字（無 **、# 等語法） */
const mdPlainForCopy = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

// fenced ``` 區塊：可橫向捲動 + 獨立「複製」按鈕（內容由點擊時從 DOM 讀取，避免 attribute 長度限制）
mdAssistant.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const info = token.info ? String(token.info).trim() : ''
  const lang = info ? info.split(/\s+/g)[0] : ''
  const code = token.content
  const escaped = escapeHtml(code)
  const langLabel = lang ? escapeHtml(lang) : 'code'
  const langClass = lang ? `language-${escapeHtml(lang)}` : ''
  return `<div class="chat-code-block my-2 w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-600/90 bg-slate-900 text-left shadow-sm">
  <div class="flex items-center justify-between gap-2 border-b border-slate-600/90 px-2 py-1.5">
    <span class="min-w-0 truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">${langLabel}</span>
    <button type="button" class="chat-code-copy shrink-0 rounded-md bg-slate-700/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 hover:bg-slate-600" aria-label="複製此段程式碼">複製</button>
  </div>
  <div class="chat-code-scroll max-w-full overflow-x-auto overflow-y-hidden">
    <pre class="m-0 min-w-0 p-3 text-[13px] leading-relaxed"><code class="${langClass}">${escaped}</code></pre>
  </div>
</div>`
}

async function copyTextToClipboard(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    } catch {
      /* ignore */
    }
  }
}

function assistantMarkdownToPlainText(md) {
  if (!md) return ''
  const html = mdPlainForCopy.render(String(md))
  if (typeof document === 'undefined') return String(md).trim()
  const div = document.createElement('div')
  div.innerHTML = html
  const plain = (div.innerText || div.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
  return plain
}

function copyAssistantMessage(rawMarkdown) {
  void copyTextToClipboard(assistantMarkdownToPlainText(rawMarkdown || ''))
}

function onChatMdClick(e) {
  const btn = e.target.closest('.chat-code-copy')
  if (!btn) return
  const wrap = btn.closest('.chat-code-block')
  const codeEl = wrap?.querySelector('pre code')
  const t = codeEl?.textContent ?? ''
  void copyTextToClipboard(t)
}

function assistantMarkdownToHtml(text) {
  if (!text) return ''
  return mdAssistant.render(String(text))
}

useHead({
  title: '和小亮聊天'
})

const { $liff } = useNuxtApp()

const userId = ref('')
const displayName = ref('')
const draft = ref('')
const isBooting = ref(true)
const isSending = ref(false)
const errorMessage = ref('')
const jobs = ref([])
const activeJobId = ref('')
const messageScroller = ref(null)

let pollTimer = null

const headerText = computed(() => {
  if (isBooting.value) return '正在為你準備專屬聊天室'
  if (displayName.value) return `${displayName.value}，今天想和小亮聊些什麼？`
  return '直接在 LINE 內開啟，不需要另外登入'
})

const canType = computed(() => !isBooting.value && !!userId.value)
const hasPendingJob = computed(() => jobs.value.some((job) => ['pending', 'processing'].includes(job.status)))
const canSend = computed(() => canType.value && !!draft.value.trim() && !isSending.value && !hasPendingJob.value)

const messageBlocks = computed(() => {
  const blocks = []

  for (const job of jobs.value) {
    blocks.push({
      id: `${job.id}-prompt`,
      role: 'user',
      text: job.prompt
    })

    if (job.status === 'done' && job.response_text) {
      blocks.push({
        id: `${job.id}-reply`,
        role: 'assistant',
        text: job.response_text
      })
      continue
    }

    if (job.status === 'error') {
      blocks.push({
        id: `${job.id}-error`,
        role: 'assistant',
        text: job.error_message || '小亮目前沒有成功回覆，請稍後再試。'
      })
      continue
    }

    if (['pending', 'processing'].includes(job.status)) {
      blocks.push({
        id: `${job.id}-pending`,
        role: 'assistant',
        text: '',
        pending: true
      })
    }
  }

  return blocks
})

function sortJobs(list = []) {
  return [...list].sort((left, right) => {
    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  })
}

function upsertJob(job) {
  const nextJobs = [...jobs.value]
  const index = nextJobs.findIndex((item) => item.id === job.id)

  if (index === -1) {
    nextJobs.push(job)
  } else {
    nextJobs[index] = { ...nextJobs[index], ...job }
  }

  jobs.value = sortJobs(nextJobs)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  activeJobId.value = ''
}

async function scrollToBottom() {
  await nextTick()
  if (!messageScroller.value) return
  messageScroller.value.scrollTop = messageScroller.value.scrollHeight
}

async function refreshJobs() {
  if (!userId.value) return

  const response = await $fetch('/api/openclaw/jobs', {
    method: 'GET',
    params: { userId: userId.value, limit: 30 }
  })

  jobs.value = sortJobs(response.jobs || [])
  await scrollToBottom()

  const pendingJob = [...jobs.value].reverse().find((job) => ['pending', 'processing'].includes(job.status))
  if (pendingJob) {
    startPolling(pendingJob.id)
  }
}

async function fetchJob(jobId) {
  if (!userId.value || !jobId) return

  const response = await $fetch(`/api/openclaw/jobs/${jobId}`, {
    method: 'GET',
    params: { userId: userId.value }
  })

  const job = response.job
  upsertJob(job)
  await scrollToBottom()

  if (!['pending', 'processing'].includes(job.status)) {
    stopPolling()
  }
}

function startPolling(jobId) {
  if (!jobId) return
  if (activeJobId.value === jobId && pollTimer) return

  stopPolling()
  activeJobId.value = jobId

  fetchJob(jobId).catch((error) => {
    console.error('[chat] initial poll failed', error)
    errorMessage.value = '讀取回覆時發生問題，請稍後再試。'
  })

  pollTimer = setInterval(async () => {
    try {
      await fetchJob(jobId)
    } catch (error) {
      console.error('[chat] poll failed', error)
      errorMessage.value = '讀取回覆時發生問題，請稍後再試。'
      stopPolling()
    }
  }, 2000)
}

async function bootstrapLiff() {
  if (import.meta.dev) {
    userId.value = 'local_test_user_001'
    displayName.value = '本地測試員'
    const access = await $fetch('/api/access', { params: { userId: userId.value } })
    if (!access.chat) {
      await navigateTo('/')
      return
    }
    await refreshJobs()
    isBooting.value = false
    return
  }

  await $liff.ready

  if (!$liff.isLoggedIn()) {
    $liff.login()
    return
  }

  const profile = await $liff.getProfile()
  userId.value = profile.userId
  displayName.value = profile.displayName

  const access = await $fetch('/api/access', { params: { userId: userId.value } })
  if (!access.chat) {
    await navigateTo('/')
    return
  }

  await refreshJobs()
  isBooting.value = false
}

function onDraftKeydown(e) {
  if (e.key !== 'Enter') return
  if (e.shiftKey) return
  if (e.isComposing) return
  e.preventDefault()
  if (canSend.value) void sendMessage()
}

async function sendMessage() {
  const prompt = draft.value.trim()
  if (!prompt || !canSend.value) return

  errorMessage.value = ''
  isSending.value = true

  try {
    const response = await $fetch('/api/openclaw/jobs', {
      method: 'POST',
      body: {
        userId: userId.value,
        displayName: displayName.value,
        prompt
      }
    })

    draft.value = ''
    upsertJob(response.job)
    await scrollToBottom()
    startPolling(response.job.id)
  } catch (error) {
    console.error('[chat] send failed', error)
    errorMessage.value = '訊息送出失敗，請稍後再試。'
  } finally {
    isSending.value = false
  }
}

onMounted(async () => {
  try {
    await bootstrapLiff()
  } catch (error) {
    console.error('[chat] bootstrap failed', error)
    errorMessage.value = 'LIFF 初始化失敗，請重新開啟頁面。'
    isBooting.value = false
  }
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
/* 小亮回覆：Markdown 呈現（**粗體**、列表、換行等） */
.chat-md :deep(p) {
  margin: 0.35em 0;
}
.chat-md :deep(p:first-child) {
  margin-top: 0;
}
.chat-md :deep(p:last-child) {
  margin-bottom: 0;
}
.chat-md :deep(ul),
.chat-md :deep(ol) {
  margin: 0.35em 0;
  padding-left: 1.35rem;
}
.chat-md :deep(ul) {
  list-style-type: disc;
}
.chat-md :deep(ol) {
  list-style-type: decimal;
}
.chat-md :deep(li) {
  margin: 0.15em 0;
}
.chat-md :deep(strong) {
  font-weight: 700;
  color: rgb(15 23 42);
}
.chat-md :deep(hr) {
  margin: 0.75rem 0;
  border-color: rgb(203 213 225);
}
.chat-md :deep(blockquote) {
  margin: 0.5rem 0;
  padding-left: 0.75rem;
  border-left: 3px solid rgb(203 213 225);
  color: rgb(100 116 139);
}
/* 行內 `code`（非 fenced 區塊） */
.chat-md :deep(p code),
.chat-md :deep(li code),
.chat-md :deep(td code) {
  background: rgb(241 245 249);
  padding: 0.1em 0.35em;
  border-radius: 0.25rem;
  font-size: 0.9em;
}
.chat-md :deep(h1),
.chat-md :deep(h2),
.chat-md :deep(h3) {
  margin: 0.65em 0 0.35em;
  font-weight: 700;
  line-height: 1.35;
  color: rgb(15 23 42);
}
.chat-md :deep(h1) {
  font-size: 1.25rem;
}
.chat-md :deep(h2) {
  font-size: 1.1rem;
}
.chat-md :deep(h3) {
  font-size: 1rem;
}
/* fenced 內 pre 維持等寬、不撐破外層 */
.chat-md :deep(.chat-code-scroll pre) {
  white-space: pre;
  word-break: normal;
}
</style>
