<script setup lang="ts">
import Toaster from '@/components/ui/Toaster.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PWAInstall from '@/components/PWAInstall.vue'
</script>

<template>
  <PWAInstall />
  <Toaster />
  <ConfirmDialog />
  <router-view></router-view>
</template>
