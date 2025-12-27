<template>
  <section 
    class="flex flex-col items-center justify-start min-h-dvh p-4 relative"
    style="padding-top: max(1rem, env(safe-area-inset-top)); padding-bottom: max(2rem, env(safe-area-inset-bottom));"
  >
    <div v-if="isLoading" class="absolute inset-0 bg-blue-50/90 z-50 flex items-center justify-center">
      <div class="text-orchardGreen animate-pulse font-bold text-lg">📡 農場連線中...</div>
    </div>

    <div class="w-full max-w-md flex justify-between items-center mb-4 px-2 relative z-10">
      <button 
        @click="openSettings"
        class="flex items-center gap-1 bg-white px-3 py-2 rounded-xl shadow-sm text-sm font-medium text-slate-600 hover:bg-gray-50 active:scale-95 transition"
      >
        ⚙️ 提醒設定
      </button>

      <button 
        @click="showCollectionModal = true"
        class="flex items-center gap-1 bg-white px-3 py-2 rounded-xl shadow-sm text-sm font-medium text-slate-600 hover:bg-gray-50 active:scale-95 transition"
      >
        📖 我的圖鑑
      </button>
    </div>

    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 space-y-5 relative z-10">
      
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-bold text-orchardGreen">長青幸福農場</h1>
        <p class="text-sm text-slate-500">
          目前培育：
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
          <template v-if="currentTreeConfig.type === 'animal'">
            <div v-for="i in 6" :key="`heart-${i}`"
                 class="absolute text-red-400 text-3xl opacity-0 animate-float-up"
                 :style="{
                   left: `${30 + Math.random() * 40}%`, /* 集中在中間 */
                   animationDelay: `${Math.random() * 0.5}s`,
                   top: '50%' /* 從中間開始飄 */
                 }"
            >
              ❤️
            </div>
          </template>

          <template v-else>
            <div v-for="i in 6" :key="`drop-${i}`"
                 class="absolute text-blue-400 text-2xl opacity-0 animate-water-drop"
                 :style="{
                   left: `${20 + Math.random() * 60}%`,
                   animationDelay: `${Math.random() * 0.5}s`,
                   top: '-20px'
                 }"
            >
              💧
            </div>
          </template>
        </div>

        <div v-if="showRakeEffect" class="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
          <div class="text-6xl opacity-0 animate-rake-fade">🧹</div>
        </div>

        <div 
          class="absolute top-0 right-0 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm z-30 transition-colors duration-300"
          :class="[
            isTaskLack 
              ? 'bg-orange-100 text-orange-600 border-orange-300 animate-pulse'
              : 'bg-yellow-100 text-yellow-700 border-yellow-300'
          ]"
        >
          <span v-if="isTaskLack">🔥 還差一點點！</span>
          <span v-else>總成長 {{ displayProgress.toFixed(1) }}%</span>
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
            <span class="flex items-center gap-1">💧 今日喝水 <span class="text-xs text-gray-400">(目標 {{ userWaterGoal }}cc)</span></span>
            <span class="font-bold text-blue-600">{{ waterCount }} cc</span>
          </div>
          <div :class="['w-full bg-gray-200 rounded-full h-2.5 overflow-hidden', (isTaskLack && waterCount < userWaterGoal) ? 'ring-2 ring-orange-300 ring-offset-1' : '']">
            <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-500" :style="{ width: Math.min((waterCount / userWaterGoal) * 100, 100) + '%' }"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="flex items-center gap-1">🦵 今日抬腿 <span class="text-xs text-gray-400">(目標 {{ userLegGoal }}組)</span></span>
            <span class="font-bold text-slate-600">{{ legCount }} 組</span>
          </div>
          <div :class="['w-full bg-gray-200 rounded-full h-2.5 overflow-hidden', (isTaskLack && legCount < userLegGoal) ? 'ring-2 ring-orange-300 ring-offset-1' : '']">
            <div class="bg-orange-400 h-2.5 rounded-full transition-all duration-500" :style="{ width: Math.min((legCount / userLegGoal) * 100, 100) + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="h-24">
        <div v-if="treeStage < 4" class="grid grid-cols-2 gap-4 h-full">
          <TaskButton 
            label="補水 250cc" 
            icon="💧" 
            color="#6BBF59" 
            @click="handleWater" 
            :disabled="isLoading" 
            :class="(isTaskLack && waterCount < userWaterGoal) ? 'animate-bounce border-2 border-orange-400' : ''"
          />
          <TaskButton 
            label="抬腿 50 下" 
            subLabel="(完成 1 組)" 
            icon="🦵" 
            color="#FFB347" 
            @click="handleLegs" 
            :disabled="isLoading" 
            :class="(isTaskLack && legCount < userLegGoal) ? 'animate-bounce border-2 border-orange-400' : ''"
          />
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

      <div v-if="isTaskLack" class="bg-orange-100 text-orange-700 px-4 py-3 rounded-xl text-sm font-bold text-center animate-pulse border-2 border-orange-200 shadow-sm flex flex-col items-center justify-center gap-1">
        <div class="flex items-center gap-2">
          <span>☝️</span>
          <span>成長值已滿！請完成以下任務來收成：</span>
        </div>
        <div class="flex gap-2 text-xs mt-1">
          <span v-if="waterCount < userWaterGoal" class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">💧 喝滿水</span>
          <span v-if="legCount < userLegGoal" class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200">🦵 做完抬腿</span>
        </div>
      </div>

      <p class="text-xs text-center text-slate-400 mt-2">
        {{ currentTreeConfig.description }}
      </p>
    </div>

    <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-bold text-slate-800">⏰ 設定</h3>
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

          <div class="space-y-4 border-t border-b border-gray-100 py-4">
            <h4 class="text-sm font-bold text-slate-700">🎯 每日目標設定</h4>
            
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-600">💧 喝水量 (cc)</span>
              <div class="flex items-center gap-3">
                <button 
                  :disabled="tempSettings.waterGoal === 2000"
                  @click="tempSettings.waterGoal = Math.max(2000, tempSettings.waterGoal - 250)"
                  class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold hover:bg-blue-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >-</button>
                <span class="w-12 text-center font-bold text-slate-700">{{ tempSettings.waterGoal }}</span>
                <button 
                  :disabled="tempSettings.waterGoal >= 5000"
                  @click="tempSettings.waterGoal = Math.min(5000, tempSettings.waterGoal + 250)"
                  class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold hover:bg-blue-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400
                  "
                >+</button>
              </div>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-600">🦵 抬腿 (組)</span>
              <div class="flex items-center gap-3">
                <button 
                  :disabled="tempSettings.legGoal === 2"
                  @click="tempSettings.legGoal = Math.max(2, tempSettings.legGoal - 1)"
                  class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold hover:bg-orange-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >-</button>
                <span class="w-12 text-center font-bold text-slate-700">{{ tempSettings.legGoal }}</span>
                <button 
                  @click="tempSettings.legGoal = Math.min(20, tempSettings.legGoal + 1)"
                  class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold hover:bg-orange-200"
                >+</button>
              </div>
            </div>
            <p class="text-xs text-gray-400 text-center">
              * 調整目標後，達成率會即時重新計算
            </p>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-end">
              <label class="block text-sm text-slate-500">選擇提醒時間 (可複選)</label>
              <span class="text-xs font-bold text-orchardGreen">
                已選 {{ tempSettings.times.length }} 個時段
              </span>
            </div>
            
            <p class="text-xs text-slate-400 mb-2">
              ⚠️ 提醒時間以 <span class="font-bold text-orchardGreen">台北時間 (GMT+8)</span> 為準
            </p>
            
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
          </div>
          
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

    <div v-if="showCollectionModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-bounce-in flex flex-col max-h-[80vh]">
        
        <div class="flex justify-between items-center mb-4 border-b pb-2">
          <h3 class="text-xl font-bold text-slate-800">📖 作物圖鑑</h3>
          <button @click="showCollectionModal = false" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div class="mb-4 text-center">
          <span class="text-sm text-slate-500">收集進度</span>
          <div class="text-2xl font-bold text-orchardGreen">
            {{ unlockedTrees.length }} / {{ Object.keys(ITEM_DATA).length }}
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto custom-scrollbar p-1">
          <div class="grid grid-cols-2 gap-4">
            <div 
              v-for="(item, id) in ITEM_DATA" 
              :key="id"
              class="relative flex flex-col items-center p-3 rounded-xl border-2 transition-all"
              :class="unlockedTrees.includes(id) ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'"
            >
              <div class="absolute top-2 right-2">
                <span v-if="unlockedTrees.includes(id)" class="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-bold">已擁有</span>
                <span v-else class="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">未解鎖</span>
              </div>

              <div class="aspect-square w-full max-w-[120px] flex items-center justify-center mb-2 bg-gray-50/50 rounded-lg">
                <img 
                  :src="item.stages[3]" 
                  :class="[
                    'h-full w-full',  /* 填滿容器 */
                    'object-contain', /* 🌟 關鍵：保持比例，完整顯示 */
                    'p-2',            /* 留一點內距，不要貼邊 */
                    'transition-all duration-500',
                    unlockedTrees.includes(id) ? 'filter-none drop-shadow-md' : 'filter grayscale brightness-50 opacity-40'
                  ]"
                />
              </div>

              <div class="text-center">
                <h4 class="font-bold text-sm" :class="unlockedTrees.includes(id) ? 'text-slate-800' : 'text-slate-400'">
                  {{ unlockedTrees.includes(id) ? item.name : '???' }}
                </h4>
                <p class="text-[10px] mt-1 line-clamp-2" :class="unlockedTrees.includes(id) ? 'text-slate-500' : 'text-transparent bg-gray-200 rounded'">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'

// === 常數 (目標改為變數，分數固定) ===
const WATER_PER_CLICK = 250
const LEG_PER_CLICK = 1 
// 🌟 不管目標設多少，完成後的總分固定 (確保公平)
const POINTS_PER_WATER_TASK = 15 // 佔每日 30 分的一半
const POINTS_PER_LEG_TASK = 15   // 佔每日 30 分的一半
const DAILY_MAX_POINTS = 30 

const supabase = useSupabaseClient()
const { $liff } = useNuxtApp()

const userId = ref(null)
const displayName = ref(null)
const isLoading = ref(true)
const showRakeEffect = ref(false)
const showWaterEffect = ref(false) 
const showHarvestModal = ref(false)
const showSettingsModal = ref(false)
const showCollectionModal = ref(false) // 控制圖鑑彈窗

const waterCount = ref(0)
const legCount = ref(0)
const savedGrowth = ref(0) 
const currentTreeId = ref('apple')
const unlockedTrees = ref([])

// 🌟 新增：使用者自訂目標
const userWaterGoal = ref(2000)
const userLegGoal = ref(2)

// 🌟 修改：設定暫存加入目標
const tempSettings = ref({
  enabled: true,
  times: [],
  waterGoal: 2000,
  legGoal: 2
})

const currentTreeConfig = computed(() => ITEM_DATA[currentTreeId.value] || ITEM_DATA['apple'])

// 🌟 修改：根據自訂目標計算分數
const dailyPoints = computed(() => {
  // 計算達成率 (0 ~ 1)
  const waterProgress = Math.min(waterCount.value / userWaterGoal.value, 1)
  const legProgress = Math.min(legCount.value / userLegGoal.value, 1)
  
  // 換算分數
  const wScore = waterProgress * POINTS_PER_WATER_TASK
  const lScore = legProgress * POINTS_PER_LEG_TASK
  
  return Math.min(wScore + lScore, DAILY_MAX_POINTS)
})

const isDailyCapped = computed(() => dailyPoints.value >= DAILY_MAX_POINTS)

const totalProgress = computed(() => {
  return Math.max(0, Math.min(savedGrowth.value + dailyPoints.value, 100))
})

// 🌟 修改：雙重卡控使用自訂目標
const isDailyTaskDone = computed(() => {
  return waterCount.value >= userWaterGoal.value && legCount.value >= userLegGoal.value
})

const displayProgress = computed(() => {
  const p = totalProgress.value
  if (p >= 100 && !isDailyTaskDone.value) return 99.9
  return p
})

const treeStage = computed(() => {
  const p = totalProgress.value
  if (p >= 100) return isDailyTaskDone.value ? 4 : 3
  if (p >= 50) return 3 
  if (p >= 20) return 2 
  return 1 
})

// 🌟 修改：缺任務判斷使用自訂目標
const isTaskLack = computed(() => totalProgress.value >= 100 && !isDailyTaskDone.value)

const currentTreeImage = computed(() => {
  const index = Math.max(0, Math.min(treeStage.value - 1, 3))
  return currentTreeConfig.value.stages[index]
})

// Functions
const toggleTime = (timeStr) => {
  const index = tempSettings.value.times.indexOf(timeStr)
  if (index === -1) { tempSettings.value.times.push(timeStr) } 
  else { tempSettings.value.times.splice(index, 1) }
}

const openSettings = () => { showSettingsModal.value = true }

const saveSettings = async () => {
  if (!userId.value) return
  const timeString = tempSettings.value.times.sort().join(',')
  try {
    // 🌟 立即更新變數，讓介面即時反應
    userWaterGoal.value = tempSettings.value.waterGoal
    userLegGoal.value = tempSettings.value.legGoal

    const { error } = await supabase.from('users').update({
        is_reminder_enabled: tempSettings.value.enabled,
        reminder_time: timeString,
        goal_water: tempSettings.value.waterGoal, // 存入 DB
        goal_leg: tempSettings.value.legGoal      // 存入 DB
      }).eq('user_id', userId.value)
      
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
      
      // 🌟 讀取自訂目標
      userWaterGoal.value = data.goal_water || 2000
      userLegGoal.value = data.goal_leg || 2
      // 同步到暫存
      tempSettings.value.waterGoal = userWaterGoal.value
      tempSettings.value.legGoal = userLegGoal.value

      if (data.reminder_time) {
        tempSettings.value.times = data.reminder_time.includes(',') ? data.reminder_time.split(',') : [data.reminder_time]
      } else { tempSettings.value.times = ['08:00'] }
      
      if (data.is_reminder_enabled !== undefined) tempSettings.value.enabled = data.is_reminder_enabled

      const lastDate = data.last_active_date || data.last_updated
      
      if (lastDate !== today) {
        console.log('跨日結算中...')
        const lastDayWater = data.daily_water || data.water_count || 0
        const lastDayLeg = data.daily_leg || data.leg_count || 0
        
        // 🌟 跨日計算：簡單起見，直接用「喝 2000 / 做 2 組」當作昨天的滿分標準
        // 或是您也可以考慮把昨天的 goal 也存下來，但這裡為了簡化，
        // 我們假設跨日計算還是用「固定標準 (2000/2)」或「當前標準」。
        // 這裡採用「當前標準」來計算昨天的得分。
        const wScore = Math.min(lastDayWater / userWaterGoal.value, 1) * POINTS_PER_WATER_TASK
        const lScore = Math.min(lastDayLeg / userLegGoal.value, 1) * POINTS_PER_LEG_TASK
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
  const payload = {
    user_id: uid, 
    water_count: water, 
    leg_count: legs, 
    daily_water: water, 
    daily_leg: legs, 
    last_active_date: date, 
    saved_growth: saved, 
    current_tree_id: treeId, 
    unlocked_trees: unlocked, 
    last_updated: date,
    display_name: displayName.value
  }
  await supabase.from('users').upsert(payload).select()
}

const handleWater = async () => {
  waterCount.value += WATER_PER_CLICK
  showWaterEffect.value = false
  nextTick(() => { showWaterEffect.value = true; setTimeout(() => showWaterEffect.value = false, 1000) })
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

const checkGrowth = () => {}

const handleHarvest = async () => {
  if (!unlockedTrees.value.includes(currentTreeId.value)) {
    unlockedTrees.value.push(currentTreeId.value)
  }
  showHarvestModal.value = true
}

const closeHarvestModal = async () => {
  showHarvestModal.value = false
  
  // 🌟 修改這裡：把 unlockedTrees.value 傳進去
  const nextId = getRandomItemId(currentTreeId.value, unlockedTrees.value)
  
  currentTreeId.value = nextId
  
  // 扣除法歸零進度
  savedGrowth.value = -dailyPoints.value 
  
  await syncToCloud()
  
  // 這裡可以加個判斷，如果是新物種顯示不同的訊息
  const isNew = !unlockedTrees.value.includes(nextId)
  const msg = isNew 
    ? `太幸運了！發現了新物種：${ITEM_DATA[nextId].name} 🌱` 
    : `新生命種下囉！這次是：${ITEM_DATA[nextId].name} 🌱`
    
  alert(msg)
}

const syncToCloud = async () => {
  if (userId.value) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
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
      displayName.value = profile.displayName
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

@keyframes waterDrop {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(120px) scale(1); opacity: 0; }
}
.animate-water-drop { animation: waterDrop 1s ease-in forwards; }

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); opacity: 1; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
.animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }

/* 愛心飄升動畫 */
@keyframes floatUp {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  20% { opacity: 1; transform: scale(1.2); } /* 變大 */
  100% { transform: translateY(-80px) scale(1); opacity: 0; } /* 往上飄並消失 */
}
.animate-float-up { animation: floatUp 1.2s ease-out forwards; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>