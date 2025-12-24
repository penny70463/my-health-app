<template>
  <section 
    class="flex flex-col items-center justify-center min-h-dvh p-4 relative"
    style="padding-top: max(2rem, env(safe-area-inset-top)); padding-bottom: max(2rem, env(safe-area-inset-bottom));"
  >
    <div v-if="isLoading" class="absolute inset-0 bg-blue-50/90 z-50 flex items-center justify-center">
      <div class="text-orchardGreen animate-pulse font-bold text-lg">📡 果園連線中...</div>
    </div>

    <div class="w-full max-w-md flex justify-between items-center mb-4 px-2 relative z-10">
      <button 
        @click="openSettings"
        class="flex items-center gap-1 bg-white px-3 py-2 rounded-xl shadow-sm text-sm font-medium text-slate-600 hover:bg-gray-50 active:scale-95 transition"
      >
        ⚙️ 提醒設定
      </button>

      <button 
        disabled
        class="flex items-center gap-1 bg-gray-200 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed opacity-80"
      >
        📖 我的圖鑑
        <span class="text-xs bg-gray-400 text-white px-1 rounded">開發中</span>
      </button>
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
        🚧 成長值已滿！但今日必須<span class="underline">喝滿 2000cc 水</span>才能收成喔！
      </div>

      <p class="text-xs text-center text-slate-400 mt-2">
        {{ currentTreeConfig.description }}
      </p>
    </div>

    <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-bold text-slate-800">⏰ 每日提醒設定</h3>
          <button @click="showSettingsModal = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-slate-600 font-medium">啟用每日通知</span>
            <button 
              @click="tempSettings.enabled = !tempSettings.enabled"
              :class="tempSettings.enabled ? 'bg-green-500' : 'bg-gray-300'"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            >
              <span 
                :class="tempSettings.enabled ? 'translate-x-6' : 'translate-x-1'"
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              />
            </button>
          </div>

          <div class="space-y-2">
            <label class="block text-sm text-slate-500">選擇提醒時間 (整點)</label>
            <div class="relative">
              <select 
                v-model="tempSettings.time"
                :disabled="!tempSettings.enabled"
                class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none appearance-none disabled:opacity-50"
              >
                <option v-for="hour in 24" :key="hour" :value="`${(hour-1).toString().padStart(2, '0')}:00`">
                  {{ (hour-1).toString().padStart(2, '0') }}:00
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          <p class="text-xs text-gray-400">
            * 系統將會在您指定的時間，檢查您是否尚未達成今日目標，並透過 LINE 傳送溫馨提醒。
          </p>
        </div>

        <button 
          @click="saveSettings"
          class="w-full bg-orchardGreen text-white font-bold py-3 rounded-xl hover:bg-green-600 transition"
        >
          儲存設定
        </button>
      </div>
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

// === 常數 ===
const WATER_GOAL = 2000
const WATER_PER_CLICK = 250
const LEG_GOAL = 2 
const LEG_PER_CLICK = 1 
const POINTS_PER_WATER_GOAL = 12.5 
const POINTS_PER_LEG_GOAL = 12.5 
const DAILY_MAX_POINTS = 30 

const supabase = useSupabaseClient()
const { $liff } = useNuxtApp()

// === 狀態 ===
const userId = ref(null)
const isLoading = ref(true)
const showRakeEffect = ref(false)
const showHarvestModal = ref(false)
const showSettingsModal = ref(false) // 設定彈窗開關

// 資料庫狀態
const waterCount = ref(0)
const legCount = ref(0)
const savedGrowth = ref(0) 
const currentTreeId = ref('apple')
const unlockedTrees = ref([])

// 設定狀態 (暫存)
const tempSettings = ref({
  enabled: true,
  time: '08:00'
})

// === Computed ===
const currentTreeConfig = computed(() => TREE_DATA[currentTreeId.value] || TREE_DATA['apple'])

const dailyPoints = computed(() => {
  const waterScore = Math.min(waterCount.value / WATER_GOAL, 1) * POINTS_PER_WATER_GOAL
  const scorePerLeg = POINTS_PER_LEG_GOAL / LEG_GOAL
  const legScore = legCount.value * scorePerLeg
  return Math.min(waterScore + legScore, DAILY_MAX_POINTS)
})

const isDailyCapped = computed(() => dailyPoints.value >= DAILY_MAX_POINTS)
const totalProgress = computed(() => Math.min(savedGrowth.value + dailyPoints.value, 100))

const treeStage = computed(() => {
  const p = totalProgress.value
  const isWaterGoalReached = waterCount.value >= WATER_GOAL
  if (p >= 100) return isWaterGoalReached ? 4 : 3
  if (p >= 75) return 3 
  if (p >= 25) return 2 
  return 1 
})

const isWaterLack = computed(() => totalProgress.value >= 100 && waterCount.value < WATER_GOAL)

const currentTreeImage = computed(() => {
  const index = Math.max(0, Math.min(treeStage.value - 1, 3))
  return currentTreeConfig.value.stages[index]
})

// === 核心功能 ===

// 打開設定視窗 (從資料庫狀態同步到暫存變數)
const openSettings = () => {
  showSettingsModal.value = true
}

// 儲存設定到資料庫
const saveSettings = async () => {
  if (!userId.value) return
  
  try {
    const { error } = await supabase
      .from('users')
      .update({
        is_reminder_enabled: tempSettings.value.enabled,
        reminder_time: tempSettings.value.time
      })
      .eq('user_id', userId.value)

    if (error) throw error
    
    alert('設定已儲存！')
    showSettingsModal.value = false
  } catch (e) {
    alert('儲存失敗，請稍後再試')
    console.error(e)
  }
}

const loadUserData = async (uid) => {
  try {
    isLoading.value = true
    const { data, error } = await supabase.from('users').select('*').eq('user_id', uid).single()
    
    // 取得台灣時間的日期字串 (避免時區問題)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

    if (error || !data) {
      // 初始化新用戶
      await saveUserData(uid, 0, 0, 0, 'apple', [], today)
    } else {
      currentTreeId.value = data.current_tree_id || 'apple'
      unlockedTrees.value = data.unlocked_trees || []
      
      // 設定載入
      if (data.reminder_time) tempSettings.value.time = data.reminder_time.slice(0, 5)
      if (data.is_reminder_enabled !== undefined) tempSettings.value.enabled = data.is_reminder_enabled

      // 🌟 判斷是否跨日 (改用 last_active_date)
      const lastDate = data.last_active_date || data.last_updated // 相容舊資料
      
      if (lastDate !== today) {
        // === 這是新的一天 ===
        console.log('跨日結算中...')
        
        // 1. 結算昨天的成長值
        const lastDayWater = data.daily_water || data.water_count || 0
        const lastDayLeg = data.daily_leg || data.leg_count || 0
        
        const wScore = Math.min(lastDayWater / WATER_GOAL, 1) * POINTS_PER_WATER_GOAL
        const lScore = lastDayLeg * (POINTS_PER_LEG_GOAL / LEG_GOAL)
        const lastDayPoints = Math.min(wScore + lScore, DAILY_MAX_POINTS)
        
        // 2. 累加到 savedGrowth
        let newSavedGrowth = (data.saved_growth || 0) + lastDayPoints
        if (newSavedGrowth > 100) newSavedGrowth = 100 // 上限 100
        
        // 3. 重置今日數據
        waterCount.value = 0
        legCount.value = 0
        savedGrowth.value = newSavedGrowth
        
        // 4. 存回資料庫 (同步歸零狀態)
        await saveUserData(userId.value, 0, 0, newSavedGrowth, currentTreeId.value, unlockedTrees.value, today)
        
      } else {
        // === 還是同一天 ===
        // 優先讀取 daily_water，如果沒有才讀 water_count
        waterCount.value = data.daily_water !== null ? data.daily_water : data.water_count
        legCount.value = data.daily_leg !== null ? data.daily_leg : data.leg_count
        savedGrowth.value = data.saved_growth || 0
      }
    }
  } catch (e) { console.error(e) } 
  finally { isLoading.value = false }
}

const saveUserData = async (uid, water, legs, saved, treeId, unlocked, date) => {
  if (!uid) return
  
  await supabase.from('users').upsert({
    user_id: uid,
    
    // 累積總量 (如果您想保留歷史紀錄，建議還是存一下，雖然這裡邏輯主要靠 daily)
    // 但為了簡單，我們假設 water_count 在這裡代表「今日喝水量」
    // 如果您的資料庫 water_count 是用來存總累積的，這裡邏輯要改。
    // 根據您的 Tree 邏輯，saved_growth 已經處理了累積，所以這裡 water 視為今日數據。
    
    // 👇 關鍵修改：同時寫入舊欄位(相容性)與新欄位(給提醒用)
    water_count: water,       // 前端畫面上的數值
    leg_count: legs,          // 前端畫面上的數值
    
    daily_water: water,       // 🌟 新增：給 remind.js 讀的
    daily_leg: legs,          // 🌟 新增：給 remind.js 讀的
    last_active_date: date,   // 🌟 新增：給 remind.js 判斷日期
    
    saved_growth: saved,
    current_tree_id: treeId,
    unlocked_trees: unlocked,
    last_updated: date        // 舊欄位保留無妨
  }).select()
}

const handleWater = async () => {
  waterCount.value += WATER_PER_CLICK
  checkGrowth()
  await syncToCloud()
}

const handleLegs = async () => {
  legCount.value += LEG_PER_CLICK
  showRakeEffect.value = false
  nextTick(() => { showRakeEffect.value = true; setTimeout(() => showRakeEffect.value = false, 600) })
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
  waterCount.value = 0
  legCount.value = 0
  savedGrowth.value = 0
  await syncToCloud()
  alert(`新種子種下囉！這次是：${TREE_DATA[nextTreeId].name}`)
}

const syncToCloud = async () => {
  if (userId.value) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
    await saveUserData(
      userId.value, 
      waterCount.value, 
      legCount.value, 
      savedGrowth.value, 
      currentTreeId.value, 
      unlockedTrees.value, 
      today
    )
  }
}

onMounted(async () => {
  if (import.meta.dev) {
    setTimeout(() => { 
      userId.value = 'mock'; 
      waterCount.value = 0; 
      legCount.value = 0; 
      isLoading.value = false 
    }, 500)
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