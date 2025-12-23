<template>
  <section 
    class="flex flex-col items-center justify-center min-h-dvh p-4 relative"
    style="padding-top: max(2rem, env(safe-area-inset-top)); padding-bottom: max(2rem, env(safe-area-inset-bottom));"
  >
    
    <div v-if="isLoading" class="absolute inset-0 bg-blue-50/90 z-50 flex items-center justify-center">
      <div class="text-orchardGreen animate-pulse font-bold text-lg">📡 果園連線中...</div>
    </div>

    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 space-y-6 relative z-10">
      
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold text-orchardGreen">長青幸福果園</h1>
        <p class="text-sm text-slate-500">
          歡迎加入健康伴侶，讓每天的喝水與抬腿更有趣。
        </p>
      </div>

      <div class="relative w-full flex justify-center py-4">
        <TreeStage :stage="treeStage" />
        <div
          v-if="showRakeEffect"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div class="text-6xl opacity-0 animate-rake-fade">🧹</div>
        </div>
      </div>

      <div class="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-slate-600">
        <div class="flex justify-between items-center">
          <span>今日喝水</span>
          <span class="font-bold text-blue-600 text-lg">{{ waterCount }} / {{ dailyWaterTarget }} 杯</span>
        </div>
        <div class="flex justify-between items-center">
          <span>成長階段</span>
          <span>第 {{ treeStage }} 階段</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-500" :style="{ width: (waterCount / dailyWaterTarget) * 100 + '%' }"></div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
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

      <p class="text-xs text-center text-slate-400">
        小提醒：每喝滿 2 杯水，果樹就會成長一階。
      </p>
    </div>

    <div
      v-if="showWaterReward"
      class="fixed inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/20"
    >
      <div
        class="bg-white rounded-3xl p-8 shadow-2xl border-4 border-yellow-300 text-center animate-bounce-in"
      >
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-xl text-slate-800 font-bold mb-2">任務達成！</h3>
        <p class="text-slate-600">太棒了！今天的水分補給充足！</p>
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

const userId = ref(null)        
const isLoading = ref(true)     
const waterCount = ref(0)
const treeStage = ref(1)        
const showWaterReward = ref(false)
const showRakeEffect = ref(false)

// === 3. 核心邏輯：從雲端讀取資料 ===
const loadUserData = async (uid) => {
  try {
    isLoading.value = true
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', uid)
      .single()

    const today = new Date().toISOString().split('T')[0] 

    if (error || !data) {
      console.log('新用戶，建立資料...')
      await saveUserData(uid, 0, 1, today) 
      waterCount.value = 0
      treeStage.value = 1
    } else {
      if (data.last_updated === today) {
        waterCount.value = data.water_count
        treeStage.value = data.tree_stage
      } else {
        console.log('跨日重置')
        waterCount.value = 0
        treeStage.value = 1
        await saveUserData(uid, 0, 1, today)
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

// === 5. 操作邏輯 ===
const maybeLevelUpTree = () => {
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
    waterCount.value += 1
    maybeLevelUpTree()
    maybeShowWaterReward()
    if (userId.value) {
      const today = new Date().toISOString().split('T')[0]
      await saveUserData(userId.value, waterCount.value, treeStage.value, today)
    }
  } else {
    alert('今天的喝水任務已經完成囉！')
  }
}

const handleLegs = async () => {
  // alert('完成鬆土！做得好～') // 拿掉 alert 體驗比較順暢
  showRakeEffect.value = false
  nextTick(() => {
    showRakeEffect.value = true
    setTimeout(() => {
      showRakeEffect.value = false
    }, 600)
  })
  if (userId.value) {
    const today = new Date().toISOString().split('T')[0]
    await saveUserData(userId.value, waterCount.value, treeStage.value, today)
  }
}

// === 6. 初始化入口 ===
onMounted(async () => {
  try {
    await $liff.ready
    if ($liff.isLoggedIn()) {
      const profile = await $liff.getProfile()
      userId.value = profile.userId
      await loadUserData(userId.value)
    } else {
      $liff.login()
    }
  } catch (e) {
    console.error('LIFF 初始化失敗', e)
    isLoading.value = false 
  }
})
</script>

<style scoped>
@keyframes rakeFade {
  0% { opacity: 0; transform: translateY(10px) scale(0.8); }
  50% { opacity: 1; transform: translateY(0) scale(1.1); }
  100% { opacity: 0; transform: translateY(-10px) scale(1); }
}
.animate-rake-fade {
  animation: rakeFade 800ms ease-out forwards;
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); opacity: 1; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
.animate-bounce-in {
  animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
</style>