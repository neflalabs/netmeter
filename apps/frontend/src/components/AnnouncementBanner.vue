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
                <p class="text-xs opacity-75" :class="variants[type].textColor">{{ formattedDate }}</p>
            </div>
        </div>
    </div>
    
    <!-- Body -->
    <div class="px-5 py-4" :class="variants[type].body">
        <div 
            class="text-sm leading-relaxed text-justify prose prose-sm max-w-none prose-strong:text-current prose-p:text-current prose-headings:text-current prose-li:text-current prose-a:text-current prose-a:underline hover:prose-a:opacity-80 transition-opacity" 
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
</style>
