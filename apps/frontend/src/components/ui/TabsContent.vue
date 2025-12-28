<script setup lang="ts">
import { TabsContent, type TabsContentProps } from 'radix-vue'

const props = defineProps<TabsContentProps>()
</script>

<template>
  <TabsContent
    v-bind="props"
    class="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <slot />
  </TabsContent>
</template>
