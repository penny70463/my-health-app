<template>
  <button
    type="button"
    :style="{ backgroundColor: color }"
    class="flex flex-col w-full h-20 rounded-2xl shadow-soft text-white text-xl font-semibold flex items-center justify-center transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gentleOrange"
  >
    <span v-if="icon" class="text-xl">{{ icon }}</span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#6BBF59'
  },
  icon: {
    type: String,
    default: ''
  }
})
</script>

