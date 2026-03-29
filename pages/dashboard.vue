<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 px-4 py-5" style="max-width:900px; margin:0 auto;">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-5">
      <span class="text-2xl">📊</span>
      <div class="flex-1">
        <h1 class="text-lg font-bold leading-tight">財經詞頻儀表板</h1>
        <p class="text-xs text-gray-400">{{ stats.latest_date ? `最新資料：${stats.latest_date}` : '整理資料中...' }}</p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/chat" class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-gray-800">
          小亮助理
        </NuxtLink>
        <NuxtLink to="/" class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-gray-800">
          回到農場
        </NuxtLink>
      </div>
      <select v-model="selectedDate" class="bg-gray-800 border border-gray-600 text-sm rounded-lg px-2 py-1 text-gray-100">
        <option v-for="d in dates" :key="d" :value="d">{{ d }}</option>
      </select>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3 mb-5">
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
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span class="font-semibold text-sm">主題熱度趨勢</span>
        <select v-model="topicDays" class="bg-gray-800 border border-gray-600 text-xs rounded-lg px-2 py-1 text-gray-100">
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
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <span class="font-semibold text-sm">詞雲 Top 50</span>
          <select v-model="cloudCategory" class="bg-gray-800 border border-gray-600 text-xs rounded-lg px-2 py-1 text-gray-100">
            <option value="">全部</option>
            <option v-for="t in TOPICS" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="px-4 py-3 leading-loose min-h-28">
          <span v-if="wordCloudData.length === 0" class="text-gray-500 text-sm">暫無資料</span>
          <span v-for="item in wordCloudData" :key="item.word"
            class="inline-block cursor-pointer hover:opacity-70 mr-1"
            :style="{ fontSize: wordSize(item.count) + 'rem', color: wordColor(item.category) }"
            @click="loadTrend(item.word)">
            {{ item.word }}<sup class="text-xs opacity-50">{{ item.count }}</sup>
          </span>
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="bg-gray-900 border border-gray-700 rounded-xl">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <span class="font-semibold text-sm">詞頻趨勢{{ trendWord ? `：${trendWord}` : '' }}</span>
          <input v-model="trendInput" type="text" placeholder="輸入詞彙…"
            class="bg-gray-800 border border-gray-600 text-xs rounded-lg px-2 py-1 text-gray-100 w-24"
            @keydown.enter="loadTrend(trendInput.trim())">
        </div>
        <div class="px-4 py-3">
          <canvas v-show="trendData.length > 0" ref="trendCanvas" style="max-height:220px;"></canvas>
          <p v-if="trendData.length === 0" class="text-gray-500 text-sm text-center mt-4">點擊詞雲中的詞彙以查看趨勢</p>
        </div>
      </div>
    </div>

    <!-- Daily Report -->
    <div class="bg-gray-900 border border-gray-700 rounded-xl mb-6">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span class="font-semibold text-sm">每日報告</span>
        <select v-model="reportDate" class="bg-gray-800 border border-gray-600 text-xs rounded-lg px-2 py-1 text-gray-100">
          <option v-for="d in dates" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div class="px-4 py-4">
        <pre v-if="reportContent" class="whitespace-pre-wrap text-sm text-gray-300 leading-7 font-sans">{{ reportContent }}</pre>
        <p v-else class="text-gray-500 text-sm">選擇日期載入報告</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

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
const reportDate = ref('')
const reportContent = ref('')

const scoreCanvas = ref(null)
const trendCanvas = ref(null)
let scoreChart = null
let trendChart = null

// ── Helpers ──
function wordSize(count) {
  const max = wordCloudData.value[0]?.count || 1
  return (0.75 + (count / max) * 1.4).toFixed(2)
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

// ── API calls ──
async function loadStats() {
  const data = await $fetch('/api/news/stats').catch(() => null)
  if (data) stats.value = data
}

async function loadDates() {
  const data = await $fetch('/api/news/dates').catch(() => [])
  dates.value = data
  if (data.length) {
    selectedDate.value = data[0]
    reportDate.value = data[0]
  }
}

async function loadWordCloud() {
  const params = new URLSearchParams({ limit: 50 })
  if (selectedDate.value) params.set('date', selectedDate.value)
  if (cloudCategory.value) params.set('category', cloudCategory.value)
  const data = await $fetch(`/api/news/word-freq?${params}`).catch(() => [])
  wordCloudData.value = data
}

async function loadTopicsData() {
  return $fetch(`/api/news/topics?days=${topicDays.value}`).catch(() => [])
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

async function loadTrend(word) {
  if (!word) return
  trendWord.value = word
  trendInput.value = word
  const data = await $fetch(`/api/news/word-freq?days=30&word=${encodeURIComponent(word)}`).catch(() => [])
  trendData.value = data

  await loadChart()
  await nextTick()
  if (!trendCanvas.value || !data.length) return
  if (trendChart) trendChart.destroy()
  trendChart = new Chart(trendCanvas.value, {
    type: 'bar',
    data: {
      labels: data.map(r => r.date.slice(5)),
      datasets: [{
        label: word,
        data: data.map(r => r.count),
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

async function loadReport(date) {
  if (!date) return
  const data = await $fetch(`/api/news/report?date=${date}`).catch(() => null)
  reportContent.value = data?.content ?? ''
}

// ── Watchers ──
watch(selectedDate, loadWordCloud)
watch(cloudCategory, loadWordCloud)
watch(topicDays, renderScoreChart)
watch(reportDate, d => loadReport(d))

// ── Init ──
onMounted(async () => {
  await Promise.all([loadStats(), loadDates()])
  renderScoreChart()
  if (selectedDate.value) loadWordCloud()
  if (reportDate.value) loadReport(reportDate.value)
})
</script>
