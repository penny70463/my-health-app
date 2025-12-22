<template>
  <section class="section-card space-y-4">
    <h1 class="text-2xl font-semibold text-orchardGreen">長青幸福果園</h1>
    <p class="text-lg text-deepBrown/80">
      歡迎加入健康伴侶，讓每天的喝水與抬腿更有趣。
    </p>

    <!-- 果樹顯示區（穩定區塊，抬腿時顯示耙子特效） -->
    <div class="inline-block w-full relative">
      <TreeStage :stage="treeStage" />
      <div
        v-if="showRakeEffect"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div class="text-4xl opacity-0 animate-rake-fade">🧹</div>
      </div>
    </div>

    <!-- 任務進度文字 -->
    <div class="text-base text-slate-600 space-y-1">
      <p>今日喝水：{{ waterCount }} / {{ dailyWaterTarget }} 杯</p>
      <p>樹的成長階段：第 {{ treeStage }} 階段（共 4 階）</p>
    </div>

    <!-- 任務按鈕 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <TaskButton
        label="喝水 200cc"
        icon="💧"
        color="#6BBF59"
        @click="handleWater"
      />
      <TaskButton
        label="抬腿 10 下"
        icon="🦵"
        color="#FFB347"
        @click="handleLegs"
      />
    </div>

    <p class="text-sm text-slate-500">
      小提醒：每喝滿 2 杯水，果樹就會成長一階；喝滿 8 杯會有小小驚喜喔！
    </p>

    <!-- 達成喝水目標時的簡單「彩帶/慶祝」動畫 -->
    <div
      v-if="showWaterReward"
      class="fixed inset-0 flex items-center justify-center pointer-events-none"
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
import { nextTick, ref } from 'vue'

const dailyWaterTarget = 8
const waterPerStage = 2

const waterCount = ref(0)
const treeStage = ref(1) // 1 ~ 4
const showWaterReward = ref(false)
const showRakeEffect = ref(false)

const maybeLevelUpTree = () => {
  // 每滿 2 杯升一階，最多到 4 階
  if (waterCount.value > 0 && waterCount.value % waterPerStage === 0) {
    treeStage.value = Math.min(4, treeStage.value + 1)
  }
}

const maybeShowWaterReward = () => {
  if (waterCount.value === dailyWaterTarget && !showWaterReward.value) {
    showWaterReward.value = true
    // 幾秒後自動收起提示
    setTimeout(() => {
      showWaterReward.value = false
    }, 2500)
  }
}

const handleWater = () => {
  // 喝水 +1，最多記到目標值
  if (waterCount.value < dailyWaterTarget) {
    waterCount.value += 1
    maybeLevelUpTree()
    maybeShowWaterReward()
  } else {
    // 已達標，再提醒一下
    alert('今天的喝水任務已經完成囉！')
  }
}

const handleLegs = () => {
  alert('完成鬆土！做得好～')
  // 觸發一次耙子特效
  showRakeEffect.value = false
  nextTick(() => {
    showRakeEffect.value = true
    setTimeout(() => {
      showRakeEffect.value = false
    }, 600)
  })
}
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

