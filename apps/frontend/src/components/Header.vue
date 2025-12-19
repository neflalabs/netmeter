<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

const props = defineProps<{
  title?: string
  subtitle?: string
  showBack?: boolean
  backTo?: string
}>()

const router = useRouter()

const handleBack = () => {
    if (props.backTo) {
        router.push(props.backTo)
    } else {
        router.back()
    }
}
</script>

<template>
    <header class="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
            <div class="container mx-auto flex justify-between items-center">
            <div class="flex items-center gap-3">
                <Button 
                    v-if="showBack" 
                    variant="ghost" 
                    size="icon" 
                    class="-ml-2" 
                    @click="handleBack"
                >
                    <ArrowLeft class="w-5 h-5" />
                </Button>
                
                <div>
                    <!-- Title Slot or Prop -->
                    <slot name="title">
                        <h1 v-if="title" class="font-bold text-lg text-foreground leading-tight">
                            {{ title }}
                        </h1>
                    </slot>
                    
                    <!-- Subtitle Slot or Prop -->
                    <slot name="subtitle">
                        <p v-if="subtitle" class="text-xs text-muted-foreground">
                            {{ subtitle }}
                        </p>
                    </slot>
                </div>
            </div>

            <!-- Right Actions Slot -->
            <div class="flex gap-2 items-center">
                <ThemeToggle />
                <slot name="actions"></slot>
            </div>
        </div>
    </header>
</template>
