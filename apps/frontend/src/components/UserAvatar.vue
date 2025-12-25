<template>
  <div 
    class="relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-background shadow-sm"
    :class="[sizeClasses[size], colorClass]"
  >
    <User class="text-white" :class="iconSize[size]" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>(), {
  size: 'md'
})

const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
}

const iconSize = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
}

// Generate consistent color based on name string
const colors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 
    'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-teal-500', 'bg-emerald-500', 'bg-cyan-500'
]

const colorClass = computed(() => {
    let hash = 0
    for (let i = 0; i < props.name.length; i++) {
        hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
})
</script>
