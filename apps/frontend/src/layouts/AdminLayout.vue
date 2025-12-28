<script setup lang="ts">
import AdminSidebar from '@/components/AdminSidebar.vue'
import Header from '@/components/Header.vue'
import MobileNav from '@/components/MobileNav.vue'
import Footer from '@/components/Footer.vue'
import Button from '@/components/ui/Button.vue'
import { LogOut } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const title = computed(() => route.meta.title as any)
const subtitle = computed(() => route.meta.subtitle as any)
const showBack = computed(() => route.meta.showBack as any)
const backTo = computed(() => route.meta.backTo as any)
const hideHeader = computed(() => route.meta.hideHeader as any)
const hideFooter = computed(() => route.meta.hideFooter as any)

const handleLogout = () => {
    auth.logout()
    localStorage.removeItem('username')
    router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background pb-20 md:pb-6 flex">
    <!-- Desktop Sidebar -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-w-0 overflow-x-hidden">
        <Header 
            v-if="!hideHeader"
            :title="title"
            :subtitle="subtitle"
            :show-back="showBack"
            :back-to="backTo"
        >
            <template #actions>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    @click="handleLogout" 
                    class="md:hidden text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    <LogOut class="w-5 h-5" />
                </Button>
            </template>
        </Header>

        <main class="flex-1 w-full p-4 md:p-8">
            <div class="max-w-7xl mx-auto space-y-8">
                <slot />
            </div>
        </main>
        
        <Footer v-if="!hideFooter" />
        <MobileNav />
    </div>
  </div>
</template>
