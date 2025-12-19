<template>
  <div class="flex items-center justify-between px-2 py-4">
    <!-- Results Info -->
    <div class="hidden sm:block">
      <p class="text-[11px] text-muted-foreground italic">
        Menampilkan <span class="font-bold text-foreground">{{ from }}</span> sampai 
        <span class="font-bold text-foreground">{{ to }}</span> dari 
        <span class="font-bold text-foreground">{{ total }}</span> data
      </p>
    </div>

    <!-- Navigation -->
    <div class="flex items-center gap-1 ml-auto">
      <Button 
        variant="outline" 
        size="sm" 
        class="h-7 w-7 p-0" 
        :disabled="currentPage <= 1"
        @click="$emit('change', currentPage - 1)"
      >
        <ChevronLeft class="w-4 h-4" />
      </Button>

      <div class="flex items-center gap-1 px-2">
        <template v-for="page in pages" :key="page">
          <Button 
            v-if="typeof page === 'number'"
            :variant="page === currentPage ? 'default' : 'outline'" 
            size="sm" 
            class="h-7 min-w-[28px] px-1.5 text-[11px] font-medium"
            @click="$emit('change', page)"
          >
            {{ page }}
          </Button>
          <span v-else class="text-muted-foreground px-1 text-[11px]">...</span>
        </template>
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        class="h-7 w-7 p-0" 
        :disabled="currentPage >= totalPages"
        @click="$emit('change', currentPage + 1)"
      >
        <ChevronRight class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import Button from './Button.vue'

const props = defineProps<{
    currentPage: number
    totalPages: number
    total: number
    limit: number
}>()

defineEmits<{
    (e: 'change', page: number): void
}>()

const from = computed(() => ((props.currentPage - 1) * props.limit) + 1)
const to = computed(() => Math.min(props.currentPage * props.limit, props.total))

const pages = computed(() => {
    const total = props.totalPages
    const current = props.currentPage
    const delta = 1 // Number of pages adjacent to current page
    
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }
    
    const range: (number | string)[] = []
    
    // Always show first page
    range.push(1)
    
    if (current > delta + 2) {
        range.push('...')
    }
    
    const start = Math.max(2, current - delta)
    const end = Math.min(total - 1, current + delta)
    
    for (let i = start; i <= end; i++) {
        range.push(i)
    }
    
    if (current < total - delta - 1) {
        range.push('...')
    }
    
    // Always show last page
    range.push(total)
    
    return range
})
</script>
