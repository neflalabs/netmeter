<template>
  <div class="bg-card text-card-foreground rounded-xl p-4 border border-border shadow-sm flex flex-col justify-between h-full transition-all hover:border-ring/50">
    <!-- Header: Icon & Title -->
    <div class="flex items-center gap-3 mb-2">
        <div class="p-2 rounded-lg" :class="variants[variant].bg">
            <slot name="icon">
                <component :is="icon" v-if="icon" class="w-5 h-5" :class="variants[variant].text" />
            </slot>
        </div>
        <div class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {{ title }}
        </div>
    </div>

    <!-- Content: Value -->
    <div>
        <div class="flex items-baseline gap-1">
             <slot>
                <span class="text-2xl font-bold text-foreground">{{ value }}</span>
             </slot>
        </div>
        
        <!-- Description / Footer -->
        <div v-if="description || $slots.footer" class="mt-2 text-xs text-muted-foreground">
            <slot name="footer">
                {{ description }}
            </slot>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Component } from 'vue'

interface Props {
    title: string
    value?: string | number
    description?: string
    icon?: Component
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'primary'
})

const variants = {
    primary: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    secondary: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
    success: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
    warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400' },
    danger: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' }
}
</script>
