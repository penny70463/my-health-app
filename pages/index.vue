<template>
  <section class="section-card space-y-4 relative">
    <div v-if="isLoading" class="absolute inset-0 bg-white/80 z-50 flex items-center justify-center rounded-2xl">
      <div class="text-orchardGreen animate-pulse font-bold">📡 資料讀取中...</div>
    </div>

    <h1 class="text-2xl font-semibold text-orchardGreen">長青幸福果園</h1>
    <p class="text-lg text-deepBrown/80">
      歡迎加入健康伴侶，讓每天的喝水與抬腿更有趣。
    </p>

    <div class="inline-block w-full relative">
      <TreeStage :stage="treeStage" />
      <div
        v-if="showRakeEffect"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div class="text-4xl opacity-0 animate-rake-fade">🧹</div>
      </div>
    </div>

    <div class="text-base text-slate-600 space-y-1">
      <p>今日喝水：<span class="font-bold text-blue-600">{{ waterCount }}</span> / {{ dailyWaterTarget }} 杯</p>
      <p>樹的成長階段：第 {{ treeStage }} 階段（共 4 階）</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <TaskButton
        label="喝水 200cc"
        icon="💧"
        color="#6BBF59"
        @click="handleWater"
        :disabled="isLoading"
      />
      <TaskButton
        label="抬腿 10 下"
        icon="🦵"
        color="#FFB347"
        @click="handleLegs"
        :disabled="isLoading"
      />
    </div>

    <p class="text-sm text-slate-500">
      小提醒：每喝滿 2 杯水，果樹就會成長一階；喝滿 8 杯會有小小驚喜喔！
    </p>

    <div
      v-if="showWaterReward"
      class="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      <div
        class="bg-white/90 rounded-2xl px-6 py-4 shadow-soft border border-indigo-300 text-center animate-pulse"
      >
        <div class="text-4xl mb-2">🎉</div>
        <p class="text-lg text-slate-800 font-semibold">今天喝水任務達成！</p>
        <p class="text-sm text-slate-600">好棒！繼續保持這個好習慣～</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'

// === 1. 初始化 Supabase 與 LIFF ===
const supabase = useSupabaseClient()
const { $liff } = useNuxtApp()

// === 2. 狀態變數 ===
const dailyWaterTarget = 8
const waterPerStage = 2

const userId = ref(null)        // 儲存 LIFF User ID
const isLoading = ref(true)     // 載入狀態
const waterCount = ref(0)
const treeStage = ref(1)        // 1 ~ 4
const showWaterReward = ref(false)
const showRakeEffect = ref(false)

// === 3. 核心邏輯：從雲端讀取資料 ===
const loadUserData = async (uid) => {
  try {
    isLoading.value = true
    
    // 查詢 users 表格
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', uid)
      .single()

    const today = new Date().toISOString().split('T')[0] // 取得今天日期 YYYY-MM-DD

    if (error || !data) {
      // A. 新用戶：建立初始資料
      console.log('新用戶，建立資料...')
      await saveUserData(uid, 0, 1, today) // 初始：0杯水，第1階段
      waterCount.value = 0
      treeStage.value = 1
    } else {
      // B. 舊用戶：檢查日期
      if (data.last_updated === today) {
        // 是今天：載入進度
        console.log('載入今日進度')
        waterCount.value = data.water_count
        treeStage.value = data.tree_stage
      } else {
        // 跨日了：重置進度 (新的一天，從頭開始)
        console.log('跨日重置')
        waterCount.value = 0
        treeStage.value = 1
        await saveUserData(uid, 0, 1, today) // 更新日期並歸零
      }
    }
  } catch (e) {
    console.error('讀取資料失敗', e)
  } finally {
    isLoading.value = false
  }
}

// === 4. 核心邏輯：存檔到雲端 ===
const saveUserData = async (uid, water, stage, date) => {
  if (!uid) return
  
  // upsert: 有就更新，沒有就新增
  const { error } = await supabase
    .from('users')
    .upsert({ 
      user_id: uid, 
      water_count: water, 
      tree_stage: stage,
      last_updated: date
    })
    
  if (error) console.error('存檔失敗', error)
}

// === 5. 操作邏輯 (整合原本的動畫與存檔) ===

const maybeLevelUpTree = () => {
  // 每滿 2 杯升一階，最多到 4 階
  if (waterCount.value > 0 && waterCount.value % waterPerStage === 0) {
    treeStage.value = Math.min(4, treeStage.value + 1)
  }
}

const maybeShowWaterReward = () => {
  if (waterCount.value === dailyWaterTarget && !showWaterReward.value) {
    showWaterReward.value = true
    setTimeout(() => {
      showWaterReward.value = false
    }, 2500)
  }
}

const handleWater = async () => {
  if (waterCount.value < dailyWaterTarget) {
    // 1. 本地更新 (讓畫面立刻有反應)
    waterCount.value += 1
    maybeLevelUpTree()
    maybeShowWaterReward()

    // 2. 雲端存檔
    if (userId.value) {
      const today = new Date().toISOString().split('T')[0]
      await saveUserData(userId.value, waterCount.value, treeStage.value, today)
    }

  } else {
    alert('今天的喝水任務已經完成囉！')
  }
}

const handleLegs = async () => {
  alert('完成鬆土！做得好～')
  
  // 1. 特效動畫
  showRakeEffect.value = false
  nextTick(() => {
    showRakeEffect.value = true
    setTimeout(() => {
      showRakeEffect.value = false
    }, 600)
  })

  // 2. 雲端存檔 (抬腿雖然沒變數變化，但也更新一下 last_updated 保持活躍)
  if (userId.value) {
    const today = new Date().toISOString().split('T')[0]
    await saveUserData(userId.value, waterCount.value, treeStage.value, today)
  }
}

// === 6. 初始化入口 ===
onMounted(async () => {
  try {
    // 等待 LIFF SDK
    await $liff.ready
    
    if ($liff.isLoggedIn()) {
      const profile = await $liff.getProfile()
      userId.value = profile.userId
      console.log('取得 User ID:', userId.value)
      
      // 開始讀取雲端資料
      await loadUserData(userId.value)
    } else {
      // 沒登入就引導登入
      $liff.login()
    }
  } catch (e) {
    console.error('LIFF 初始化失敗', e)
    isLoading.value = false // 失敗也要把 loading 關掉
  }
})
</script>

<style scoped>
@keyframes rakeFade {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.9);
  }
  40% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-8px) scale(1.05);
  }
}

.animate-rake-fade {
  animation: rakeFade 600ms ease-out forwards;
}
</style>