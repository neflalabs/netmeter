<script setup lang="ts">
import { LayoutDashboard, Receipt, Users, TrendingUp, Settings } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Tagihan', path: '/bills', icon: Receipt },
  { label: 'Pengguna', path: '/users', icon: Users },
  { label: 'Statistik', path: '/stats', icon: TrendingUp },
  { label: 'Settings', path: '/settings', icon: Settings },
]

const isActive = (path: string) => {
    if (path === '/dashboard') return route.path === '/dashboard'
    return route.path.startsWith(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border flex justify-around items-center px-2 py-2 md:hidden">
    <router-link 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all duration-300"
        :class="[
            isActive(item.path) 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
        ]"
    >
        <component 
            :is="item.icon" 
            class="w-5 h-5"
            :class="[isActive(item.path) ? 'text-primary' : 'text-muted-foreground']"
        />
        <span class="text-[10px] font-medium tracking-tight">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
/* Optional: add a safe area bottom padding for notched phones */
nav {
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
}
</style>
