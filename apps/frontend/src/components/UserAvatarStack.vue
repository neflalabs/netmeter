<template>
  <div class="flex items-center">
    <div class="flex -space-x-2 overflow-hidden">
      <UserAvatar 
        v-for="name in displayedUsers" 
        :key="name" 
        :name="name" 
        size="sm"
        class="ring-2 ring-background"
      />
      <div 
        v-if="remainingCount > 0"
        class="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary border-2 border-background text-[10px] font-bold text-muted-foreground shadow-sm"
      >
        +{{ remainingCount }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UserAvatar from './UserAvatar.vue'

const props = defineProps<{
  users: string[]
  limit?: number
}>()

const limit = computed(() => props.limit || 3)

const displayedUsers = computed(() => {
  return props.users.slice(0, limit.value)
})

const remainingCount = computed(() => {
  return Math.max(0, props.users.length - limit.value)
})
</script>
