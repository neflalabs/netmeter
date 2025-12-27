<template>
  <aside class="fixed left-0 top-0 h-full w-64 bg-card/30 backdrop-blur-xl border-r border-border hidden md:flex flex-col z-50">
    <!-- Logo Section -->
    <div class="p-6 border-b border-border/50">
        <AppLogo />
    </div>

    <!-- Navigation Links -->
    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
            :class="[
                $route.path === item.path 
                    ? 'bg-primary/10 text-primary shadow-sm border border-primary/20' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            ]"
        >
            <component 
                :is="item.icon" 
                class="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                :class="[$route.path === item.path ? 'text-primary' : 'text-muted-foreground']"
            />
            <span class="font-medium tracking-tight">{{ item.label }}</span>
            <div 
                v-if="$route.path === item.path"
                class="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
            ></div>
        </router-link>
    </nav>

    <!-- Bottom Actions -->
    <div class="p-4 border-t border-border/50">
        <button 
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
        >
            <LogOut class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span class="font-medium">Logout</span>
        </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { LayoutDashboard, Receipt, Users, TrendingUp, Megaphone, Settings, LogOut } from 'lucide-vue-next'
import AppLogo from '@/components/AppLogo.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Tagihan', path: '/bills', icon: Receipt },
  { label: 'Pengguna', path: '/users', icon: Users },
  { label: 'Statistik', path: '/stats', icon: TrendingUp },
  { label: 'Pengumuman', path: '/announcement', icon: Megaphone },
  { label: 'Settings', path: '/settings', icon: Settings },
]

const handleLogout = () => {
    auth.logout()
    localStorage.removeItem('username')
    router.push('/login')
}
</script>
