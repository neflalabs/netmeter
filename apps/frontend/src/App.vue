<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicStore } from '@/stores/public'
import Toaster from '@/components/ui/Toaster.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PWAInstall from '@/components/PWAInstall.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import PublicLayout from '@/layouts/PublicLayout.vue'

const route = useRoute()
const publicStore = usePublicStore()

const layouts = {
  admin: AdminLayout,
  public: PublicLayout
}

const currentLayout = computed(() => {
  const layoutName = route.meta.layout as keyof typeof layouts
  return layouts[layoutName] || null
})

onMounted(() => {
  publicStore.startPolling()
})

onUnmounted(() => {
  publicStore.stopPolling()
})
</script>

<template>
  <PWAInstall />
  <Toaster />
  <ConfirmDialog />
  
  <component :is="currentLayout" v-if="currentLayout">
    <router-view></router-view>
  </component>
  <router-view v-else></router-view>
</template>
