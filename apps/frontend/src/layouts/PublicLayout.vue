<script setup lang="ts">
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import AppLogo from '@/components/AppLogo.vue'
import Button from '@/components/ui/Button.vue'
import { LayoutDashboard } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

import { usePublicStore } from '@/stores/public'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const publicStore = usePublicStore()
const isLoggedIn = computed(() => authStore.isAuthenticated)
const settings = computed(() => publicStore.settings || {})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
    </div>

    <Header 
        v-if="!route.meta.hideHeader"
        class="z-10 bg-transparent border-none py-2"
        :show-back="!!route.meta.showBack"
        :back-to="String(route.meta.backTo || '')"
    >
        <template #title>
             <AppLogo :title="settings && 'appTitle' in settings ? (settings.appTitle as string) : undefined" :subtitle="settings && 'appSubtitle' in settings ? (settings.appSubtitle as string) : undefined" />
        </template>
        <template #actions>
            <Button v-if="isLoggedIn && route.name === 'home'" size="sm" variant="outline" @click="router.push('/dashboard')" class="shadow-sm">
                <LayoutDashboard class="w-4 h-4 mr-2" />
                Dashboard
            </Button>
        </template>
    </Header>

    <main class="flex-1 z-10 w-full px-4 py-4 md:py-8">
        <div class="max-w-4xl mx-auto w-full">
            <slot />
        </div>
    </main>

    <Footer v-if="!route.meta.hideFooter" class="z-10" />
  </div>
</template>
