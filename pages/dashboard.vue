<template>
  <div class="min-h-dvh w-full bg-gray-950 text-gray-100">
    <div v-if="dashboardBlocked" class="mx-auto max-w-md px-4 py-16 text-center">
      <p class="text-gray-300">{{ dashboardBlocked }}</p>
      <NuxtLink to="/" class="mt-4 inline-block rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800">
        回到農場
      </NuxtLink>
    </div>
    <div v-else class="mx-auto px-4 py-5" style="max-width:900px">

    <!-- Header：手機改直向，避免標題與按鈕同一列擠成直書 -->
    <div class="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <span class="shrink-0 text-2xl leading-none" aria-hidden="true">📊</span>
        <div class="min-w-0 flex-1">
          <h1 class="text-lg font-bold leading-snug break-words">財經詞頻儀表板</h1>
          <p class="mt-0.5 text-xs text-gray-400 break-words">
            {{ stats.latest_date ? `最新資料：${stats.latest_date}` : '整理資料中...' }}
          </p>
        </div>
      </div>
      <div class="flex min-w-0 flex-wrap items-center gap-2 md:shrink-0">
        <NuxtLink to="/chat" class="whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-gray-800">
          小亮助理
        </NuxtLink>
        <NuxtLink to="/" class="whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-gray-800">
          回到農場
        </NuxtLink>
        <select
          v-model="selectedDate"
          class="select-touch min-w-0 flex-1 rounded-lg border border-gray-600 bg-gray-800 text-gray-100 sm:flex-none md:min-w-[8.5rem]"
        >
          <option v-for="d in dates" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
    </div>

    <!-- Stats：手機單欄，較寬再三欄 -->
    <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-xl p-4 text-center" style="background: linear-gradient(135deg,#1e40af,#0ea5e9)">
        <div class="text-2xl font-bold">{{ stats.total_words ?? '—' }}</div>
        <div class="text-xs opacity-80 mt-1">詞彙數</div>
      </div>
      <div class="rounded-xl p-4 text-center" style="background: linear-gradient(135deg,#065f46,#10b981)">
        <div class="text-2xl font-bold">{{ stats.total_days ?? '—' }}</div>
        <div class="text-xs opacity-80 mt-1">分析天數</div>
      </div>
      <div class="rounded-xl p-4 text-center" style="background: linear-gradient(135deg,#7c2d12,#f97316)">
        <div class="text-2xl font-bold">{{ stats.latest_date ? stats.latest_date.slice(5) : '—' }}</div>
        <div class="text-xs opacity-80 mt-1">最新日期</div>
      </div>
    </div>

    <!-- Topic Score Chart -->
    <div class="bg-gray-900 border border-gray-700 rounded-xl mb-4">
      <div class="flex flex-col gap-2 border-b border-gray-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span class="min-w-0 font-semibold text-sm break-words">主題熱度趨勢</span>
        <select v-model="topicDays" class="select-touch w-full shrink-0 rounded-lg border border-gray-600 bg-gray-800 text-gray-100 sm:w-auto">
          <option value="14">14天</option>
          <option value="30">30天</option>
          <option value="60">60天</option>
        </select>
      </div>
      <div class="px-4 py-3">
        <div class="flex flex-wrap gap-1 mb-3">
          <button v-for="(t, i) in TOPICS" :key="t"
            class="text-xs px-3 py-1 rounded-full border transition-opacity"
            :style="{ color: COLORS[i], borderColor: activeTopics.has(t) ? COLORS[i] : 'transparent', background: activeTopics.has(t) ? COLORS[i]+'22' : 'transparent' }"
            @click="toggleTopic(t)">{{ t }}</button>
        </div>
        <canvas ref="scoreCanvas" style="max-height:260px;"></canvas>
      </div>
    </div>

    <!-- Word Cloud + Trend -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

      <!-- Word Cloud -->
      <div class="bg-gray-900 border border-gray-700 rounded-xl">
        <div class="flex flex-col gap-2 border-b border-gray-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span class="min-w-0 font-semibold text-sm break-words">詞雲 Top 50</span>
          <select v-model="cloudCategory" class="select-touch w-full shrink-0 rounded-lg border border-gray-600 bg-gray-800 text-gray-100 sm:w-auto">
            <option value="">全部</option>
            <option v-for="t in TOPICS" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="px-4 py-3 leading-relaxed min-h-28 sm:leading-loose">
          <span v-if="wordCloudData.length === 0" class="text-gray-500 text-sm">暫無資料</span>
          <span v-for="item in wordCloudData" :key="item.word"
            class="mr-1 inline-block cursor-pointer hover:opacity-70"
            :style="{ fontSize: wordSize(item.count) + 'rem', color: wordColor(item.category) }"
            @click="loadTrend(item.word)">
            {{ item.word }}<sup class="text-[10px] opacity-50 sm:text-xs">{{ item.count }}</sup>
          </span>
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="bg-gray-900 border border-gray-700 rounded-xl">
        <div class="flex flex-col gap-2 border-b border-gray-700 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <span class="min-w-0 font-semibold text-sm break-words">詞頻趨勢{{ trendWord ? `：${trendWord}` : '' }}</span>
          <div class="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-[min(100%,22rem)] sm:flex-1 sm:flex-row sm:flex-wrap sm:justify-end">
            <select
              v-model="trendGranularity"
              class="select-touch w-full shrink-0 rounded-lg border border-gray-600 bg-gray-800 text-gray-100 sm:w-[5.75rem]"
              title="圖表時間粒度"
            >
              <option value="day">每日</option>
              <option value="week">每週</option>
              <option value="month">每月</option>
            </select>
            <select
              v-model.number="trendPeriodDays"
              class="select-touch w-full shrink-0 rounded-lg border border-gray-600 bg-gray-800 text-gray-100 sm:w-[7rem]"
              title="資料區間"
            >
              <option :value="7">近 7 天</option>
              <option :value="30">近 30 天</option>
              <option :value="90">近 90 天</option>
            </select>
            <input v-model="trendInput" type="text" placeholder="輸入詞彙…"
              class="input-touch w-full min-w-0 rounded-lg border border-gray-600 bg-gray-800 text-gray-100 sm:flex-1 sm:min-w-[6rem]"
              @keydown.enter="loadTrend(trendInput.trim())">
          </div>
        </div>
        <div class="px-4 py-3">
          <canvas v-show="trendData.length > 0" ref="trendCanvas" style="max-height:220px;"></canvas>
          <p v-if="trendData.length === 0" class="text-gray-500 text-sm text-center mt-4">點擊詞雲中的詞彙以查看趨勢</p>
        </div>
      </div>
    </div>

    <!-- Daily Report -->
    <div class="bg-gray-900 border border-gray-700 rounded-xl mb-6">
      <div class="flex flex-col gap-2 border-b border-gray-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span class="min-w-0 font-semibold text-sm break-words">每日報告</span>
        <select v-model="reportDate" class="select-touch w-full shrink-0 rounded-lg border border-gray-600 bg-gray-800 text-gray-100 sm:w-auto">
          <option v-for="d in dates" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div class="px-4 py-4">
        <pre v-if="reportContent" class="whitespace-pre-wrap text-sm text-gray-300 leading-7 font-sans">{{ reportContent }}</pre>
        <p v-else class="text-gray-500 text-sm">選擇日期載入報告</p>
      </div>
    </div>

    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Chart.js CDN 動態載入
let Chart = null
async function loadChart() {
  if (Chart) return
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  Chart = window.Chart
}

const TOPICS = ['半導體','AI','營收財報','股市資金','利率通膨','匯率','能源原物料','房地產','航運物流']
const COLORS = ['#38bdf8','#a78bfa','#fb923c','#34d399','#f472b6','#fbbf24','#60a5fa','#f87171','#4ade80']

const stats = ref({})
const dates = ref([])
const selectedDate = ref('')
const topicDays = ref('30')
const activeTopics = ref(new Set(TOPICS))
const cloudCategory = ref('')
const wordCloudData = ref([])
const trendWord = ref('')
const trendInput = ref('')
const trendData = ref([])
/** 圖表聚合：日 / 週 / 月（週為依週一區間加總） */
const trendGranularity = ref('day')
/** API 拉資料天數（週、月建議用較長區間） */
const trendPeriodDays = ref(30)
const wordCloudScale = ref(1)
const reportDate = ref('')
const reportContent = ref('')

const dashboardUserId = ref('')
const dashboardBlocked = ref('')

const scoreCanvas = ref(null)
const trendCanvas = ref(null)
let scoreChart = null
let trendChart = null

// ── Helpers ──
function refreshWordCloudScale() {
  if (typeof window === 'undefined') return
  wordCloudScale.value = window.matchMedia('(max-width: 639px)').matches ? 0.55 : 1
}

function wordSize(count) {
  const max = wordCloudData.value[0]?.count || 1
  const base = 0.72 + (count / max) * 1.35
  return (base * wordCloudScale.value).toFixed(2)
}

function mergeWordFreqByDate(rows) {
  const m = new Map()
  for (const r of rows) {
    if (!r.date) continue
    m.set(r.date, (m.get(r.date) || 0) + Number(r.count))
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }))
}

/** 以本地曆將 YYYY-MM-DD 對到該週的週一（同一曆法下與資料日期一致） */
function startOfWeekMondayLocal(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const day = dt.getDay()
  const diff = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diff)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function aggregateTrendPoints(dailyMerged, granularity) {
  if (!dailyMerged.length) return { labels: [], counts: [] }
  if (granularity === 'day') {
    return {
      labels: dailyMerged.map((r) => r.date.slice(5)),
      counts: dailyMerged.map((r) => r.count),
    }
  }
  if (granularity === 'month') {
    const map = new Map()
    for (const r of dailyMerged) {
      const key = r.date.slice(0, 7)
      map.set(key, (map.get(key) || 0) + r.count)
    }
    const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    return { labels: entries.map(([k]) => k), counts: entries.map(([, c]) => c) }
  }
  const map = new Map()
  for (const r of dailyMerged) {
    const key = startOfWeekMondayLocal(r.date)
    map.set(key, (map.get(key) || 0) + r.count)
  }
  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  return {
    labels: entries.map(([k]) => `週 ${k.slice(5)}`),
    counts: entries.map(([, c]) => c),
  }
}
function wordColor(category) {
  const idx = TOPICS.indexOf(category)
  return idx >= 0 ? COLORS[idx] : '#94a3b8'
}
function toggleTopic(t) {
  const s = new Set(activeTopics.value)
  if (s.has(t)) s.delete(t); else s.add(t)
  activeTopics.value = s
  renderScoreChart()
}

// ── API calls（啟用白名單時須帶 userId）──
async function loadStats() {
  if (!dashboardUserId.value) return
  const data = await $fetch('/api/news/stats', {
    params: { userId: dashboardUserId.value },
  }).catch(() => null)
  if (data) stats.value = data
}

async function loadDates() {
  if (!dashboardUserId.value) return
  const data = await $fetch('/api/news/dates', {
    params: { userId: dashboardUserId.value },
  }).catch(() => [])
  dates.value = data
  if (data.length) {
    selectedDate.value = data[0]
    reportDate.value = data[0]
  }
}

async function loadWordCloud() {
  if (!dashboardUserId.value) return
  const params = new URLSearchParams({
    limit: '50',
    userId: dashboardUserId.value,
  })
  if (selectedDate.value) params.set('date', selectedDate.value)
  if (cloudCategory.value) params.set('category', cloudCategory.value)
  const data = await $fetch(`/api/news/word-freq?${params}`).catch(() => [])
  wordCloudData.value = data
}

async function loadTopicsData() {
  if (!dashboardUserId.value) return []
  return $fetch('/api/news/topics', {
    params: { days: topicDays.value, userId: dashboardUserId.value },
  }).catch(() => [])
}

async function renderScoreChart() {
  await loadChart()
  const raw = await loadTopicsData()
  const dateSet = new Set(raw.map(r => r.date))
  const allDates = [...dateSet].sort()

  const datasets = TOPICS.filter(t => activeTopics.value.has(t)).map((topic, _) => {
    const colorIdx = TOPICS.indexOf(topic)
    return {
      label: topic,
      data: allDates.map(d => raw.find(r => r.date === d && r.topic === topic)?.score ?? null),
      borderColor: COLORS[colorIdx],
      backgroundColor: COLORS[colorIdx] + '22',
      tension: 0.3,
      spanGaps: true,
      pointRadius: 3,
    }
  })

  await nextTick()
  if (!scoreCanvas.value) return
  if (scoreChart) scoreChart.destroy()
  scoreChart = new Chart(scoreCanvas.value, {
    type: 'line',
    data: { labels: allDates.map(d => d.slice(5)), datasets },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } }
      }
    }
  })
}

async function renderTrendChart() {
  await loadChart()
  await nextTick()
  const word = trendWord.value
  const { labels, counts } = aggregateTrendPoints(trendData.value, trendGranularity.value)

  if (trendChart) {
    trendChart.destroy()
    trendChart = null
  }
  if (!trendCanvas.value || !word || !labels.length) return

  trendChart = new Chart(trendCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: word,
        data: counts,
        backgroundColor: '#38bdf866',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } }
      }
    }
  })
}

async function loadTrend(word) {
  if (!word || !dashboardUserId.value) return
  trendWord.value = word
  trendInput.value = word
  const params = new URLSearchParams({
    days: String(trendPeriodDays.value),
    word,
    userId: dashboardUserId.value,
  })
  const raw = await $fetch(`/api/news/word-freq?${params}`).catch(() => [])
  trendData.value = mergeWordFreqByDate(raw)
  await renderTrendChart()
}

async function loadReport(date) {
  if (!date || !dashboardUserId.value) return
  const data = await $fetch('/api/news/report', {
    params: { date, userId: dashboardUserId.value },
  }).catch(() => null)
  reportContent.value = data?.content ?? ''
}

// ── Watchers ──
watch(selectedDate, loadWordCloud)
watch(cloudCategory, loadWordCloud)
watch(topicDays, renderScoreChart)
watch(reportDate, d => loadReport(d))
watch(trendGranularity, () => {
  if (trendWord.value && trendData.value.length) renderTrendChart()
})
watch(trendPeriodDays, () => {
  if (trendWord.value) loadTrend(trendWord.value)
})

// ── Init ──
onMounted(async () => {
  refreshWordCloudScale()
  window.addEventListener('resize', refreshWordCloudScale)

  const { $liff } = useNuxtApp()

  try {
    if (import.meta.dev) {
      dashboardUserId.value = 'local_test_user_001'
    } else {
      await $liff.ready
      if (!$liff.isLoggedIn()) {
        dashboardBlocked.value = '請先透過 LINE 登入後再使用儀表板。'
        return
      }
      const profile = await $liff.getProfile()
      dashboardUserId.value = profile.userId
    }

    const access = await $fetch('/api/access', {
      params: { userId: dashboardUserId.value },
    })
    if (!access.dashboard) {
      dashboardBlocked.value = '此功能僅限已授權帳號。如需開通請洽管理員。'
      return
    }

    await Promise.all([loadStats(), loadDates()])
    await renderScoreChart()
    if (selectedDate.value) await loadWordCloud()
    if (reportDate.value) await loadReport(reportDate.value)
  } catch (e) {
    console.error('[dashboard] bootstrap failed', e)
    dashboardBlocked.value = '無法載入權限或資料，請稍後再試。'
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', refreshWordCloudScale)
})
</script>

<style scoped>
/* 手機原生下拉選單觸發區與字級（選項列表仍多由系統繪製） */
.select-touch {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  line-height: 1.35;
}
@media (min-width: 640px) {
  .select-touch {
    min-height: unset;
    padding: 0.375rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
}
.input-touch {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  line-height: 1.35;
}
@media (min-width: 640px) {
  .input-touch {
    min-height: unset;
    padding: 0.375rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
}
</style>
