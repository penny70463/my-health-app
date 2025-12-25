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

      <div class="relative w-full flex justify-center py-2 h-48 items-end overflow-hidden rounded-2xl">
        <img 
          :src="currentTreeImage" 
          alt="Tree" 
          class="h-44 w-auto object-contain transition-all duration-700 ease-in-out relative z-10"
        />
        
        <div v-if="showWaterEffect" class="pointer-events-none absolute inset-0 z-20">
          <div v-for="i in 6" :key="i"
               class="absolute text-blue-400 text-2xl opacity-0 animate-water-drop"
               :style="{
                 left: `${20 + Math.random() * 60}%`, // 隨機分佈
                 animationDelay: `${Math.random() * 0.5}s`, // 隨機延遲
                 top: '-20px'
               }"
          >
            💧
          </div>
        </div>

        <div v-if="showRakeEffect" class="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
          <div class="text-6xl opacity-0 animate-rake-fade">🧹</div>
        </div>

        <div class="absolute top-0 right-0 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full border border-yellow-300 z-30">
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

      <div class="h-24"> <div v-if="treeStage < 4" class="grid grid-cols-2 gap-4 h-full">
          <TaskButton label="喝水 250cc" icon="💧" color="#6BBF59" @click="handleWater" :disabled="isLoading" />
          <TaskButton label="抬腿 20 下" subLabel="(完成 1 組)" icon="🦵" color="#FFB347" @click="handleLegs" :disabled="isLoading" />
        </div>

        <div v-else class="flex items-center justify-center h-full animate-bounce-in">
          <button 
            @click="handleHarvest"
            class="w-full h-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xl font-bold rounded-2xl shadow-lg transform transition active:scale-95 flex flex-col items-center justify-center gap-1 border-4 border-white ring-4 ring-yellow-200"
          >
            <span class="text-3xl">🧺</span>
            <span>採收果實 & 種新種子</span>
          </button>
        </div>

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
            <div class="flex justify-between items-end">
              <label class="block text-sm text-slate-500">選擇提醒時間 (可複選)</label>
              <span class="text-xs font-bold text-orchardGreen">
                已選 {{ tempSettings.times.length }} 個時段
              </span>
            </div>
            
            <div class="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
              <button
                v-for="hour in 24"
                :key="hour"
                @click="toggleTime(`${(hour-1).toString().padStart(2, '0')}:00`)"
                :disabled="!tempSettings.enabled"
                :class="[
                  'py-2 rounded-lg text-sm font-bold transition-all border',
                  tempSettings.times.includes(`${(hour-1).toString().padStart(2, '0')}:00`)
                    ? 'bg-orchardGreen text-white border-orchardGreen shadow-md scale-105'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-gray-50'
                ]"
              >
                {{ (hour-1).toString().padStart(2, '0') }}
              </button>
            </div>
            <p class="text-xs text-gray-400 text-center mt-1">
              點選綠色按鈕可取消選擇
            </p>
          </div>
          
          <p class="text-xs text-gray-400">
            * 系統將會在您指定的時間，檢查您是否尚未達成今日目標，並透過 LINE 傳送溫馨提醒。
          </p>

          <div class="pt-2 border-t border-gray-100">
            <p class="text-xs text-center text-slate-500 mb-2">覺得好用嗎？邀請朋友一起來種樹！🌱</p>
            <a 
              href="https://line.me/R/ti/p/@928vmpwo"
              target="_blank"
              class="flex items-center justify-center gap-2 w-full py-2 bg-[#06C755]/10 text-[#06C755] border border-[#06C755] rounded-xl font-bold hover:bg-[#06C755] hover:text-white transition duration-300"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.15 8.23a10.22 10.22 0 00-1.63-3.64 10.15 10.15 0 00-3.63-2.6 11.2 11.2 0 00-4.66-1c-2.48 0-4.68.8-6.33 2.3A10.17 10.17 0 001.96 9.4C.68 12.35 1 15.63 2.8 18.28c.3.43.3.6.2.98-.32 1.2-.7 2.37-1.16 3.53a.85.85 0 00.94 1.15c1.47-.33 2.92-.73 4.36-1.17.4-.12.75-.07 1.1.13a10.87 10.87 0 008.28.32 10.27 10.27 0 006.18-5.74c1.24-3.1.8-6.34-1.55-9.25z"/></svg>
              加入好友 / 分享連結
            </a>
          </div>

        </div>

        <button 
          @click="saveSettings"
          class="w-full bg-orchardGreen text-white font-bold py-3 rounded-xl hover:bg-green-600 transition shadow-lg shadow-green-100"
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

// 輔助函式：隨機取得下一個樹種
const getRandomTreeId = (currentId) => {
  const keys = Object.keys(TREE_DATA)
  const available = keys.filter(k => k !== currentId)
  if (available.length === 0) return currentId 
  return available[Math.floor(Math.random() * available.length)]
}

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
const showWaterEffect = ref(false) 
const showHarvestModal = ref(false)
const showSettingsModal = ref(false)

// 資料庫狀態
const waterCount = ref(0)
const legCount = ref(0)
const savedGrowth = ref(0) 
const currentTreeId = ref('apple')
const unlockedTrees = ref([])

// 設定狀態 (使用陣列支援複選)
const tempSettings = ref({
  enabled: true,
  times: []
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

// 🌟 修改：成長階段邏輯 (讓 50% 就能變中樹)
const treeStage = computed(() => {
  const p = totalProgress.value
  const isWaterGoalReached = waterCount.value >= WATER_GOAL
  
  // 階段 4: 滿分 + 喝水達標 (顯示收成按鈕)
  if (p >= 100) return isWaterGoalReached ? 4 : 3
  
  // 階段 3: 超過 50% (中樹)
  if (p >= 50) return 3 
  
  // 階段 2: 超過 20% (小樹)
  if (p >= 20) return 2 
  
  // 階段 1: 種子
  return 1 
})

const isWaterLack = computed(() => totalProgress.value >= 100 && waterCount.value < WATER_GOAL)

const currentTreeImage = computed(() => {
  const index = Math.max(0, Math.min(treeStage.value - 1, 3))
  return currentTreeConfig.value.stages[index]
})

// === 核心功能 ===

const toggleTime = (timeStr) => {
  const index = tempSettings.value.times.indexOf(timeStr)
  if (index === -1) {
    tempSettings.value.times.push(timeStr)
  } else {
    tempSettings.value.times.splice(index, 1)
  }
}

const openSettings = () => {
  showSettingsModal.value = true
}

const saveSettings = async () => {
  if (!userId.value) return
  const timeString = tempSettings.value.times.sort().join(',')

  try {
    const { error } = await supabase
      .from('users')
      .update({
        is_reminder_enabled: tempSettings.value.enabled,
        reminder_time: timeString
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
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

    if (error || !data) {
      await saveUserData(uid, 0, 0, 0, 'apple', [], today)
    } else {
      currentTreeId.value = data.current_tree_id || 'apple'
      unlockedTrees.value = data.unlocked_trees || []
      
      if (data.reminder_time) {
        tempSettings.value.times = data.reminder_time.includes(',') 
          ? data.reminder_time.split(',') 
          : [data.reminder_time]
      } else {
        tempSettings.value.times = ['08:00']
      }
      
      if (data.is_reminder_enabled !== undefined) tempSettings.value.enabled = data.is_reminder_enabled

      const lastDate = data.last_active_date || data.last_updated
      
      if (lastDate !== today) {
        console.log('跨日結算中...')
        const lastDayWater = data.daily_water || data.water_count || 0
        const lastDayLeg = data.daily_leg || data.leg_count || 0
        const wScore = Math.min(lastDayWater / WATER_GOAL, 1) * POINTS_PER_WATER_GOAL
        const lScore = lastDayLeg * (POINTS_PER_LEG_GOAL / LEG_GOAL)
        const lastDayPoints = Math.min(wScore + lScore, DAILY_MAX_POINTS)
        
        let newSavedGrowth = (data.saved_growth || 0) + lastDayPoints
        if (newSavedGrowth > 100) newSavedGrowth = 100
        
        waterCount.value = 0
        legCount.value = 0
        savedGrowth.value = newSavedGrowth
        await saveUserData(userId.value, 0, 0, newSavedGrowth, currentTreeId.value, unlockedTrees.value, today)
        
      } else {
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
    water_count: water, 
    leg_count: legs,
    daily_water: water,
    daily_leg: legs,
    last_active_date: date,
    saved_growth: saved,
    current_tree_id: treeId,
    unlocked_trees: unlocked,
    last_updated: date
  }).select()
}

const handleWater = async () => {
  waterCount.value += WATER_PER_CLICK
  showWaterEffect.value = false
  nextTick(() => { 
    showWaterEffect.value = true; 
    setTimeout(() => showWaterEffect.value = false, 1000) 
  })
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

// 🌟 修改：不再自動彈窗，改由使用者點擊按鈕觸發
const checkGrowth = () => {
  // 原本這裡有 setTimeout 自動 harvest，現在留空即可
  // 畫面會因為 treeStage 變成 4 而自動切換成「收成按鈕」
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
/* 掃把動畫 */
@keyframes rakeFade {
  0% { opacity: 0; transform: translateY(10px) scale(0.8); }
  50% { opacity: 1; transform: translateY(0) scale(1.1); }
  100% { opacity: 0; transform: translateY(-10px) scale(1); }
}
.animate-rake-fade { animation: rakeFade 800ms ease-out forwards; }

/* 澆水水滴動畫 */
@keyframes waterDrop {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(120px) scale(1); opacity: 0; }
}
.animate-water-drop { animation: waterDrop 1s ease-in forwards; }

/* 彈窗動畫 */
@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); opacity: 1; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
.animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }

/* 自訂捲軸 */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>