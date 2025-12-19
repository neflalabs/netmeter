<template>
    <Transition name="fade">
        <div v-if="isVisible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div 
                class="bg-card w-full max-w-md rounded-lg shadow-lg border border-border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div class="space-y-2">
                    <h3 class="text-lg font-semibold leading-none tracking-tight">
                        {{ options.title }}
                    </h3>
                    <p class="text-sm text-muted-foreground">
                        {{ options.message }}
                    </p>
                </div>
                
                <div class="flex justify-end gap-2 pt-2">
                    <Button variant="outline" @click="handleCancel">
                        {{ options.cancelText || 'Batal' }}
                    </Button>
                    <Button 
                        :variant="options.variant === 'destructive' ? 'destructive' : 'default'" 
                        @click="handleConfirm"
                    >
                        {{ options.confirmText || 'Ya, Lanjutkan' }}
                    </Button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import Button from '@/components/ui/Button.vue'

const { isVisible, options, handleConfirm, handleCancel } = useConfirm()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
