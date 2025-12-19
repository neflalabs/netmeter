<template>
    <div
        class="pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all"
        :class="getVariantClasses(variant)"
        role="alert"
    >
        <div class="grid gap-1">
            <h5 v-if="title" class="text-sm font-semibold leading-none tracking-tight">
                {{ title }}
            </h5>
            <div v-if="description" class="text-sm opacity-90">
                {{ description }}
            </div>
        </div>
        <button
            @click="$emit('close')"
            class="absolute right-2 top-2 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        >
            <X class="h-4 w-4" />
        </button>
    </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
    title?: string
    description?: string
    variant?: 'default' | 'destructive' | 'success' // Added success
}

defineProps<Props>()
defineEmits(['close'])

const getVariantClasses = (variant: Props['variant']) => {
    switch (variant) {
        case 'destructive':
            return 'border-destructive bg-destructive text-destructive-foreground'
        case 'success':
            return 'border-green-600 bg-green-600 text-white'
        default:
            return 'border bg-background text-foreground'
    }
}
</script>
