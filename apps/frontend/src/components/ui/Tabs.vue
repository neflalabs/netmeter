<script setup lang="ts">
import { TabsRoot, type TabsRootProps, useForwardProps } from 'radix-vue'

const props = defineProps<TabsRootProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <TabsRoot v-bind="forwarded">
    <slot />
  </TabsRoot>
</template>
