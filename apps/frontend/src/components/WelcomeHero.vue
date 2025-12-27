<template>
  <div 
    class="w-full rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-md hover:border-primary/20"
  >
    <!-- Background Decorative Elements -->
    <div class="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>
    <div class="absolute -left-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>

    <div class="relative flex items-center gap-5">
        <!-- Dynamic Icon Container -->
        <div class="relative">
            <div class="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-slow"></div>
            <div class="relative p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                <component :is="timeConfig.icon" class="w-8 h-8 animate-float" />
            </div>
        </div>

        <!-- Text Content -->
        <div class="flex-1">
            <h2 class="text-xl font-black text-foreground tracking-tight">
                Selamat {{ timeConfig.label }}, <span class="text-primary">Tetangga!</span>
            </h2>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                {{ timeConfig.quote }}
            </p>
            
            <div class="flex items-center gap-3 mt-4">
                <div class="flex items-center gap-1.5 px-3 py-1 bg-secondary/50 rounded-full border border-border/50">
                    <Wifi class="w-3 h-3 text-green-500" />
                    <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Koneksi Lancar</span>
                </div>
                <div class="text-[10px] font-medium text-muted-foreground italic opacity-60">
                   {{ currentTime }}
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Sun, CloudSun, Moon, Wifi } from 'lucide-vue-next'

const now = ref(new Date())
let timer: any = null

onMounted(() => {
    timer = setInterval(() => {
        now.value = new Date()
    }, 60000) // Update every minute
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
})

const currentTime = computed(() => {
    return now.value.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
    }) + ' WIT'
})

const timeConfig = computed(() => {
    const hour = now.value.getHours()
    
    if (hour >= 5 && hour < 11) {
        return {
            label: 'Pagi',
            icon: Sun,
            quote: 'Awali harimu dengan semangat dan koneksi yang lancar! ✨'
        }
    } else if (hour >= 11 && hour < 15) {
        return {
            label: 'Siang',
            icon: CloudSun,
            quote: 'Istirahat sejenak, nikmati harimu sambil tetap terhubung. ☕'
        }
    } else if (hour >= 15 && hour < 18) {
        return {
            label: 'Sore',
            icon: CloudSun,
            quote: 'Waktunya bersantai di pengujung hari yang produktif. ⛅'
        }
    } else {
        return {
            label: 'Malam',
            icon: Moon,
            quote: 'Selamat beristirahat, semoga harimu menyenangkan besok. 🌙'
        }
    }
})
</script>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 6s ease-in-out infinite;
}
</style>
