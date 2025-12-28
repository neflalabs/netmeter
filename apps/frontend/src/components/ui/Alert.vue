<script setup lang="ts">
import { type HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
  variant?: 'default' | 'destructive' | 'warning' | 'info' | 'success'
}>()

const variants = {
  default: 'bg-background text-foreground',
  destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/10',
  warning: 'border-yellow-500/50 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10',
  info: 'border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10',
  success: 'border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10',
}
</script>

<template>
  <div
    role="alert"
    :class="[
      'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
      variants[props.variant || 'default'],
      props.class
    ]"
  >
    <slot />
  </div>
</template>
