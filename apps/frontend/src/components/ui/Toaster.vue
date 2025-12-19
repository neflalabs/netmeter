<template>
    <div class="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 sm:flex-col md:max-w-[420px] pointer-events-none">
        <TransitionGroup name="toast">
            <Toast
                v-for="toast in toasts"
                :key="toast.id"
                :title="toast.title"
                :description="toast.description"
                :variant="toast.variant"
                @close="dismiss(toast.id)"
                class="mb-2"
            />
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import Toast from './Toast.vue'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease-in-out;
}

.toast-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.toast-leave-to {
    transform: translateX(100%);
    opacity: 0;
}
</style>
