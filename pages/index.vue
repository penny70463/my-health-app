<template>
  <section class="section-card space-y-4">
    <h1 class="text-2xl font-semibold text-orchardGreen">長青幸福果園</h1>
    <p class="text-lg text-deepBrown/80">
      歡迎加入健康伴侶，讓每天的喝水與抬腿更有趣。
    </p>

    <TreeStage :stage="stage" />

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

    <p class="text-sm text-deepBrown/70">當前階段會在 1~4 之間循環。</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const stage = ref(1)

const nextStage = () => {
  stage.value = (stage.value % 4) + 1
}

const handleWater = () => {
  nextStage()
}

const handleLegs = () => {
  nextStage()
}
</script>

