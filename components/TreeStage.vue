<template>
  <div class="flex flex-col items-center gap-3">
    <Transition name="grow">
      <div :key="stage" class="text-6xl">
        <span>{{ displayEmoji }}</span>
      </div>
    </Transition>
    <p class="text-deepBrown/80 text-lg">
      成長階段：第 {{ clampedStage }} 階段
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  stage: {
    type: Number,
    required: true
  }
})

const clampedStage = computed(() => Math.min(Math.max(props.stage, 1), 4))

const stageEmojis = ['🌱', '🌿', '🌳', '🍎']
const displayEmoji = computed(() => stageEmojis[clampedStage.value - 1])
</script>

<style scoped>
.grow-enter-active,
.grow-leave-active {
  transition: all 0.25s ease;
}
.grow-enter-from,
.grow-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(6px);
}
</style>

