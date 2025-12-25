<template>
  <div 
    class="relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-background shadow-sm"
    :class="[sizeClasses[size], colorClass]"
  >
    <span class="font-bold text-white uppercase tracking-wider" :class="textSize[size]">
        {{ initials }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

const textSize = {
    xs: 'text-[8px]',
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
}

// Generate consistent color based on name string
const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500'
]

const colorClass = computed(() => {
    let hash = 0
    for (let i = 0; i < props.name.length; i++) {
        hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
})

const initials = computed(() => {
    const parts = props.name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2)
    return (parts[0][0] + parts[1][0]).substring(0, 2)
})
</script>
