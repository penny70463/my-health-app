<template>
  <button
    type="button"
    :style="{ backgroundColor: color }"
    class="w-full h-20 rounded-2xl shadow-soft text-white text-xl font-semibold flex items-center justify-center gap-3 transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gentleOrange"
  >
    <span v-if="icon" class="text-2xl">{{ icon }}</span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    color?: string
    icon?: string
  }>(),
  {
    color: '#6BBF59',
    icon: ''
  }
)
</script>

