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
            <div class="relative">
                <h3 class="font-bold text-base animate-shiny" :class="variants[type].titleColor">
                    {{ title || 'Pengumuman' }}
                    <span class="animate-shiny-extra">✨</span>
                </h3>
                <Transition name="fade-date" mode="out-in">
                    <p :key="formattedDate" class="text-xs opacity-75 h-4" :class="variants[type].textColor">
                        {{ formattedDate }}
                    </p>
                </Transition>
            </div>
        </div>
    </div>
    
    <!-- Body -->
    <div class="px-5 py-4" :class="variants[type].body">
        <div 
            class="text-sm leading-relaxed text-justify prose prose-sm max-w-none prose-strong:text-current prose-p:text-current prose-headings:text-current prose-li:text-current prose-a:text-current prose-a:underline hover:prose-a:opacity-80 transition-opacity" 
            :class="[
                variants[type].textColor,
                { 'line-clamp-3': !isExpanded && isLongContent }
            ]"
            v-html="message"
        ></div>
        
        <!-- Toggle Button -->
        <div v-if="isLongContent" class="mt-2 text-right">
            <button 
                @click="isExpanded = !isExpanded" 
                class="text-xs font-semibold underline hover:opacity-80 focus:outline-none transition-colors flex items-center gap-1 ml-auto"
                :class="variants[type].iconColor"
            >
                {{ isExpanded ? 'Sembunyikan' : 'Selengkapnya...' }}
                <ChevronDown 
                    class="w-3 h-3 transition-transform duration-300" 
                    :class="{ 'rotate-180': isExpanded }"
                />
            </button>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info, AlertTriangle, CheckCircle2, AlertOctagon, ChevronDown } from 'lucide-vue-next'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTimeAgo } from '@vueuse/core'

const props = defineProps<{
    title?: string
    message?: string
    type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER'
    active?: boolean
    createdAt?: string | Date
    updatedAt?: string | Date
}>()

const type = computed(() => props.type || 'INFO')

// Truncation Logic
const isExpanded = ref(false)
const isLongContent = computed(() => {
    // Simple check: if stripping HTML tags results in > 200 chars
    const text = props.message?.replace(/<[^>]*>?/gm, '') || ''
    return text.length > 200
})

// Dynamic Date Logic
const showRelative = ref(false)
const interval = ref<any>(null)

onMounted(() => {
    interval.value = setInterval(() => {
        showRelative.value = !showRelative.value
    }, 7000)
})

onUnmounted(() => {
    if (interval.value) clearInterval(interval.value)
})

const rawDate = computed(() => props.updatedAt || props.createdAt)
const timeAgo = useTimeAgo(computed(() => rawDate.value ? new Date(rawDate.value) : new Date()))

const formattedDate = computed(() => {
    // If no date is saved yet, fallback to today's date logic
    const date = rawDate.value ? new Date(rawDate.value) : new Date()
    const isUpdate = !!props.updatedAt && !!rawDate.value

    if (showRelative.value) {
        // Simple Indonesian translation for useTimeAgo output if it's default english
        // Or we can just use the raw value if it's already localized (unlikely by default)
        let agoText = timeAgo.value
        
        // Basic mapping for common English outputs if needed, or just keep it simple.
        // For a high quality result, let's try to make it feel Indonesian.
        agoText = agoText
            .replace('just now', 'baru saja')
            .replace(' ago', ' lalu')
            .replace('yesterday', 'kemarin')
            .replace('last month', 'bulan lalu')
            .replace('last year', 'tahun lalu')
            .replace('minutes', 'menit')
            .replace('minute', 'menit')
            .replace('hours', 'jam')
            .replace('hour', 'jam')
            .replace('days', 'hari')
            .replace('day', 'hari')
            .replace('weeks', 'minggu')
            .replace('week', 'minggu')
            .replace('months', 'bulan')
            .replace('month', 'bulan')
            .replace('years', 'tahun')
            .replace('year', 'tahun')

        return `${isUpdate ? 'Diperbarui' : 'Dibuat'} ${agoText}`
    }

    // Absolute Format: Indonesian
    return date.toLocaleDateString('id-ID', { 
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

<style scoped>
@keyframes shine-pulse {
  0%, 100% {
    filter: brightness(1) drop-shadow(0 0 0px rgba(255, 215, 0, 0));
  }
  50% {
    filter: brightness(1.2) drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
  }
}

@keyframes shine-pulse-dark {
  0%, 100% {
    filter: brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0));
  }
  50% {
    filter: brightness(1.3) drop-shadow(0 0 8px currentColor);
  }
}

@keyframes particle-idle {
  0%, 100% {
    opacity: 0;
    transform: translate(0, 0) scale(0);
  }
  25% {
    opacity: 1;
    transform: translate(10px, -5px) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(20px, 0) scale(0.8);
  }
  75% {
    opacity: 1;
    transform: translate(10px, 5px) scale(0.5);
  }
}

@keyframes particle-fast {
  0% {
    opacity: 0;
    transform: translate(-10px, 0) scale(0);
  }
  50% {
    opacity: 1;
    transform: translate(20px, -2px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(40px, 0) scale(0);
  }
}

.animate-shiny {
  position: relative;
  display: inline-block;
  animation: shine-pulse 3s ease-in-out infinite;
  /* Ensure text is solid and visible */
  color: currentColor !important;
  background: none !important;
  -webkit-background-clip: initial !important;
  background-clip: initial !important;
}

/* Light Particles (Sparkles) */
.animate-shiny::before,
.animate-shiny::after,
.animate-shiny-extra {
  content: '✨';
  position: absolute;
  font-size: 10px;
  pointer-events: none;
  z-index: 10;
  filter: drop-shadow(0 0 5px white);
  color: white;
}

.animate-shiny::before {
  top: -12px;
  left: -5px;
  animation: particle-idle 4s ease-in-out infinite;
}

.animate-shiny::after {
  bottom: -8px;
  right: 20%;
  animation: particle-fast 6s ease-in-out infinite 1s;
}

.animate-shiny-extra {
    top: 0;
    right: -18px;
    animation: particle-idle 5s ease-in-out infinite 2.5s;
}

/* Fade Transition for Date */
.fade-date-enter-active,
.fade-date-leave-active {
  transition: all 0.5s ease;
}

.fade-date-enter-from,
.fade-date-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
