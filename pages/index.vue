<template>
  <section 
    class="flex flex-col items-center justify-center min-h-dvh p-4 relative"
    style="padding-top: max(2rem, env(safe-area-inset-top)); padding-bottom: max(2rem, env(safe-area-inset-bottom));"
  >
    <div v-if="isLoading" class="absolute inset-0 bg-blue-50/90 z-50 flex items-center justify-center">
      <div class="text-orchardGreen animate-pulse font-bold text-lg">📡 果園連線中...</div>
    </div>

    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 space-y-5 relative z-10">
      
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-bold text-orchardGreen">長青幸福果園</h1>
        <p class="text-sm text-slate-500">
          目前種植：
          <span :class="['font-bold', currentTreeConfig.color]">
            {{ currentTreeConfig.name }}
          </span>
        </p>
      </div>

      <div class="relative w-full flex justify-center py-2 h-48 items-end">
        <img 
          :src="currentTreeImage" 
          alt="Tree" 
          class="h-44 w-auto object-contain transition-all duration-700 ease-in-out"
        />
        <div v-if="showRakeEffect" class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div class="text-6xl opacity-0 animate-rake-fade">🧹</div>
        </div>
        
        <div class="absolute top-0 right-0 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full border border-yellow-300">
          總成長 {{ totalProgress.toFixed(1) }}%
        </div>
      </div>

      <div class="bg-gray-50 rounded-xl p-4 space-y-4 text-sm text-slate-600">
        <div class="flex justify-between items-end border-b pb-2">
          <span class="font-bold text-slate-700">📅 今日貢獻值</span>
          <span :class="isDailyCapped ? 'text-red-500 font-bold' : 'text-slate-500'">
            {{ dailyPoints.toFixed(1) }} / {{ DAILY_MAX_POINTS }} 點
            <span v-if="isDailyCapped" class="text-xs">(已達上限)</span>
          </span>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="flex items-center gap-1">💧 今日喝水 <span class="text-xs text-gray-400">(目標 2000cc)</span></span>
            <span class="font-bold text-blue-600">{{ waterCount }} cc</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-500" :style="{ width: Math.min((waterCount / WATER_GOAL) * 100, 100) + '%' }"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="flex items-center gap-1">🦵 今日抬腿 <span class="text-xs text-gray-400">(目標 2 組)</span></span>
            <span class="font-bold text-slate-600">{{ legCount }} 組</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div class="bg-orange-400 h-2.5 rounded-full transition-all duration-500" :style="{ width: Math.min((legCount / LEG_GOAL) * 100, 100) + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <TaskButton label="喝水 250cc" icon="💧" color="#6BBF59" @click="handleWater" :disabled="isLoading" />
        <TaskButton label="抬腿 20 下" subLabel="(完成 1 組)" icon="🦵" color="#FFB347" @click="handleLegs" :disabled="isLoading" />
      </div>

      <div v-if="isWaterLack && totalProgress >= 100" class="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-bold text-center animate-pulse border border-orange-200">
        🚧 成長值已滿！<br>但今日必須<span class="underline">喝滿 2000cc 水</span>才能收成喔！
      </div>

      <p class="text-xs text-center text-slate-400 mt-2">
        {{ currentTreeConfig.description }}<br>
        (預計 4 天可收成一顆果樹)
      </p>
    </div>

    <div v-if="showHarvestModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl p-6 text-center shadow-2xl max-w-sm w-full animate-bounce-in border-4 border-yellow-200">
        <div class="text-6xl mb-4">🌳✨</div>
        <h3 class="text-2xl font-bold text-slate-800 mb-2">恭喜大豐收！</h3>
        <p class="text-slate-600 mb-6">
          經過這幾天的努力，<br>
          <span :class="currentTreeConfig.color">{{ currentTreeConfig.name }}</span> 終於長大了！
        </p>
        <button @click="closeHarvestModal" class="w-full bg-orchardGreen text-white font-bold py-3 rounded-xl hover:bg-green-600 transition shadow-lg shadow-green-200">
          種下新種子 🌱
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'

// === 遊戲平衡數值設定 ===
const WATER_GOAL = 2000
const WATER_PER_CLICK = 250
const LEG_GOAL = 2 
const LEG_PER_CLICK = 1 

// 點數系統 (總分 100)
// 每天標準：水 12.5 + 腿 12.5 = 25 (4天完成)
// 每天上限：30 (防止一天狂做就完成)
const POINTS_PER_WATER_GOAL = 12.5 // 喝滿水給 12.5 分
const POINTS_PER_LEG_GOAL = 12.5   // 抬腿達標給 12.5 分 (每組 6.25 分)
const DAILY_MAX_POINTS = 30        // 每日上限分

const supabase = useSupabaseClient()
const { $liff } = useNuxtApp()

// === 狀態 ===
const userId = ref(null)
const isLoading = ref(true)
const showRakeEffect = ref(false)
const showHarvestModal = ref(false)

// 資料庫欄位
const waterCount = ref(0)
const legCount = ref(0)
const savedGrowth = ref(0) // 昨天以前累積的分數 (0-100)
const currentTreeId = ref('apple')
const unlockedTrees = ref([])

// === 計算屬性 ===

const currentTreeConfig = computed(() => TREE_DATA[currentTreeId.value] || TREE_DATA['apple'])

// 1. 計算「今日」獲得的點數
const dailyPoints = computed(() => {
  // 水的分數 (依比例，最高拿到 12.5)
  const waterScore = Math.min(waterCount.value / WATER_GOAL, 1) * POINTS_PER_WATER_GOAL
  
  // 腿的分數 (每組 6.25 分，可以無限做，但總分會被下方 cap 住)
  const scorePerLeg = POINTS_PER_LEG_GOAL / LEG_GOAL
  const legScore = legCount.value * scorePerLeg
  
  // 加總，並取上限
  const total = waterScore + legScore
  return Math.min(total, DAILY_MAX_POINTS)
})

// 是否達到每日上限 (顯示紅色字體用)
const isDailyCapped = computed(() => dailyPoints.value >= DAILY_MAX_POINTS)

// 2. 計算「總成長進度」 (歷史 + 今日)
const totalProgress = computed(() => {
  return Math.min(savedGrowth.value + dailyPoints.value, 100)
})

// 3. 決定樹的階段 (0~100%)
const treeStage = computed(() => {
  const p = totalProgress.value
  const isWaterGoalReached = waterCount.value >= WATER_GOAL

  // 100% 且 今日水喝滿 -> 第 4 階 (收成)
  if (p >= 100) {
    return isWaterGoalReached ? 4 : 3 // 沒喝水就卡在 3
  }
  if (p >= 75) return 3 // 75% 以上大樹
  if (p >= 25) return 2 // 25% 以上小樹
  return 1 // 種子
})

const isWaterLack = computed(() => totalProgress.value >= 100 && waterCount.value < WATER_GOAL)

const currentTreeImage = computed(() => {
  const index = Math.max(0, Math.min(treeStage.value - 1, 3))
  return currentTreeConfig.value.stages[index]
})

// === 核心：讀取與跨日結算 ===
const loadUserData = async (uid) => {
  try {
    isLoading.value = true
    const { data, error } = await supabase.from('users').select('*').eq('user_id', uid).single()
    const today = new Date().toISOString().split('T')[0]

    if (error || !data) {
      // 新用戶
      await saveUserData(uid, 0, 0, 0, 'apple', [], today)
    } else {
      currentTreeId.value = data.current_tree_id || 'apple'
      unlockedTrees.value = data.unlocked_trees || []
      
      // 讀取歷史累積
      let loadedSavedGrowth = data.saved_growth || 0
      
      // 檢查是否跨日
      if (data.last_updated !== today) {
        console.log('跨日結算中...')
        // ⚠️ 重要：把「最後一次紀錄的今日分數」結算進「歷史分數」
        // 我們需要還原當天的分數計算邏輯
        const lastDayWater = data.water_count || 0
        const lastDayLeg = data.leg_count || 0
        
        const wScore = Math.min(lastDayWater / WATER_GOAL, 1) * POINTS_PER_WATER_GOAL
        const lScore = lastDayLeg * (POINTS_PER_LEG_GOAL / LEG_GOAL)
        const lastDayPoints = Math.min(wScore + lScore, DAILY_MAX_POINTS)
        
        // 累積進去
        loadedSavedGrowth = Math.min(loadedSavedGrowth + lastDayPoints, 100)
        
        // 重置今日計數
        waterCount.value = 0
        legCount.value = 0
        savedGrowth.value = loadedSavedGrowth
        
        // 存回資料庫 (更新日期)
        await syncToCloud()
      } else {
        // 同一天：直接載入
        waterCount.value = data.water_count
        legCount.value = data.leg_count || 0
        savedGrowth.value = loadedSavedGrowth
      }
    }
  } catch (e) { console.error(e) } 
  finally { isLoading.value = false }
}

const saveUserData = async (uid, water, legs, saved, treeId, unlocked, date) => {
  if (!uid) return
  await supabase.from('users').upsert({
    user_id: uid,
    water_count: water,
    leg_count: legs,
    saved_growth: saved, // 存入歷史分數
    current_tree_id: treeId,
    unlocked_trees: unlocked,
    last_updated: date
  })
}

// === 操作 ===
const handleWater = async () => {
  waterCount.value += WATER_PER_CLICK
  checkGrowth()
  await syncToCloud()
}

const handleLegs = async () => {
  legCount.value += LEG_PER_CLICK
  showRakeEffect.value = false
  nextTick(() => { showRakeEffect.value = true; setTimeout(() => showRakeEffect.value = false, 600) })
  
  if (isDailyCapped.value) {
    // 可以加個簡單提示，或是就不提示，讓字變紅就好
    console.log('今日進度已達上限') 
  }
  
  checkGrowth()
  await syncToCloud()
}

const checkGrowth = () => {
  if (treeStage.value === 4 && !showHarvestModal.value) {
    setTimeout(() => handleHarvest(), 500)
  }
}

const handleHarvest = async () => {
  if (!unlockedTrees.value.includes(currentTreeId.value)) {
    unlockedTrees.value.push(currentTreeId.value)
  }
  showHarvestModal.value = true
}

const closeHarvestModal = async () => {
  showHarvestModal.value = false
  const nextTreeId = getRandomTreeId(currentTreeId.value)
  currentTreeId.value = nextTreeId
  
  // 收成後重置所有進度
  waterCount.value = 0
  legCount.value = 0
  savedGrowth.value = 0 // 歷史分數歸零，重新開始下一棵樹
  
  await syncToCloud()
  alert(`新種子種下囉！這次是：${TREE_DATA[nextTreeId].name}`)
}

const syncToCloud = async () => {
  if (userId.value) {
    const today = new Date().toISOString().split('T')[0]
    await saveUserData(userId.value, waterCount.value, legCount.value, savedGrowth.value, currentTreeId.value, unlockedTrees.value, today)
  }
}

onMounted(async () => {
  if (import.meta.dev) {
    setTimeout(() => { userId.value = 'mock'; waterCount.value = 0; legCount.value = 0; isLoading.value = false }, 500)
    return
  }
  try {
    await $liff.ready
    if ($liff.isLoggedIn()) {
      const profile = await $liff.getProfile()
      userId.value = profile.userId
      await loadUserData(userId.value)
    } else { $liff.login() }
  } catch (e) { isLoading.value = false }
})
</script>

<style scoped>
@keyframes rakeFade {
  0% { opacity: 0; transform: translateY(10px) scale(0.8); }
  50% { opacity: 1; transform: translateY(0) scale(1.1); }
  100% { opacity: 0; transform: translateY(-10px) scale(1); }
}
.animate-rake-fade { animation: rakeFade 800ms ease-out forwards; }
@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); opacity: 1; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
.animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
</style>