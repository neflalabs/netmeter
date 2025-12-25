<template>
  <div 
     v-if="active && (title || message)"
     class="w-full rounded-xl border shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500"
     :class="variants[type].border"
  >
    <!-- Header -->
    <div class="px-5 py-3 flex items-center justify-between border-b" :class="variants[type].header">
        <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg" :class="variants[type].iconBg">
                <component :is="icons[type]" class="w-5 h-5" :class="variants[type].iconColor" />
            </div>
            <div>
                <h3 class="font-bold text-base" :class="variants[type].titleColor">{{ title || 'Pengumuman' }}</h3>
                <p class="text-xs opacity-75" :class="variants[type].textColor">{{ formattedDate }}</p>
            </div>
        </div>
    </div>
    
    <!-- Body -->
    <div class="px-5 py-4" :class="variants[type].body">
        <div 
            class="text-sm leading-relaxed prose prose-sm max-w-none prose-strong:text-current prose-p:text-current prose-headings:text-current prose-li:text-current" 
            :class="variants[type].textColor"
            v-html="message"
        ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
    title?: string
    message?: string
    type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER'
    active?: boolean
}>()

const type = computed(() => props.type || 'INFO')

const formattedDate = computed(() => {
    const now = new Date()
    return now.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })
})

const variants = {
    INFO: {
        border: 'border-blue-200 dark:border-blue-800',
        header: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800',
        body: 'bg-blue-50/50 dark:bg-blue-900/10',
        iconBg: 'bg-blue-100 dark:bg-blue-800/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        titleColor: 'text-blue-900 dark:text-blue-200',
        textColor: 'text-blue-800 dark:text-blue-300'
    },
    WARNING: {
        border: 'border-yellow-200 dark:border-yellow-800',
        header: 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800',
        body: 'bg-yellow-50/50 dark:bg-yellow-900/10',
        iconBg: 'bg-yellow-100 dark:bg-yellow-800/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        titleColor: 'text-yellow-900 dark:text-yellow-200',
        textColor: 'text-yellow-800 dark:text-yellow-300'
    },
    SUCCESS: {
        border: 'border-green-200 dark:border-green-800',
        header: 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800',
        body: 'bg-green-50/50 dark:bg-green-900/10',
        iconBg: 'bg-green-100 dark:bg-green-800/30',
        iconColor: 'text-green-600 dark:text-green-400',
        titleColor: 'text-green-900 dark:text-green-200',
        textColor: 'text-green-800 dark:text-green-300'
    },
    DANGER: {
        border: 'border-red-200 dark:border-red-800',
        header: 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800',
        body: 'bg-red-50/50 dark:bg-red-900/10',
        iconBg: 'bg-red-100 dark:bg-red-800/30',
        iconColor: 'text-red-600 dark:text-red-400',
        titleColor: 'text-red-900 dark:text-red-200',
        textColor: 'text-red-800 dark:text-red-300'
    }
}

const icons = {
    INFO: Info,
    WARNING: AlertTriangle,
    SUCCESS: CheckCircle2,
    DANGER: AlertOctagon
}
</script>
