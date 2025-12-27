<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import Button from '@/components/ui/Button.vue'
import { Moon, Sun } from 'lucide-vue-next'

const { toggleTheme } = useTheme()
</script>

<template>
  <Button 
    variant="ghost" 
    size="icon" 
    class="border border-border/50 hover:bg-accent hover:text-accent-foreground rounded-xl w-10 h-10 shadow-sm transition-all duration-300"
    @click="toggleTheme"
  >
    <Sun class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
    <Moon class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>
