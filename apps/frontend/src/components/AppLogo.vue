<template>
  <div class="flex items-center gap-2 group cursor-pointer" @click="$router.push('/')">
    <div class="relative w-8 h-8 flex items-center justify-center">
      <!-- Glow background -->
      <div class="absolute inset-0 bg-blue-500/20 blur-lg rounded-full group-hover:bg-blue-500/30 transition-all duration-500"></div>
      
      <!-- NeflaLabs SVG Logo with currentColor -->
      <svg
        viewBox="0 0 63.003902 72.75"
        class="w-full h-full relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(158.64648,-115.86133)">
            <path
                fill="currentColor"
                d="m -127.14453,115.86133 -31.50195,18.1875 v 36.375 l 31.50195,18.1875 31.501952,-18.1875 v -36.375 z m 0,4.79687 27.347655,15.78907 v 31.57812 l -27.347655,15.78906 -27.34766,-15.78906 v -31.57812 z" 
                class="opacity-100" />
            <path
                fill="currentColor"
                d="m -110.81201,161.66676 -16.33271,9.42967 -10.62772,-6.13593 v 10.3922 l 10.62772,6.13593 25.3327,-14.62586 z"
                class="opacity-80" />
            <path
                fill="currentColor"
                d="m -152.47742,144.19871 1e-5,22.66406 8.9998,5.19601 v -10.3922 -12.27186 z"
                class="opacity-80" />
            <path
                fill="currentColor"
                d="m -110.81183,132.41503 v 10.39202 5.32161 6.95044 l 8.99981,5.19601 v -22.66406 z"
                class="opacity-80" />
            <path
                fill="currentColor"
                d="m -127.14472,122.98518 -25.3327,14.62587 8.99981,5.196 16.33289,-9.42967 10.62772,6.13575 10e-6,-10.39201 z"
                class="opacity-80" />
            <path
                fill="currentColor"
                d="M -140.34165 143.53303 L -140.34165 161.12317 L -137.87876 161.12317 L -137.87876 148.28209 L -137.82863 148.28209 L -134.51152 161.12317 L -134.06142 161.12317 L -131.6719 161.12317 L -131.29724 161.12317 L -131.29724 153.45852 L -127.72899 153.45852 L -127.72899 150.94601 L -131.29724 150.94601 L -131.29724 146.04553 L -126.7492 146.04553 L -126.7492 143.53303 L -131.6719 143.53303 L -134.06142 143.53303 L -134.1348 143.53303 L -134.1348 154.0621 L -134.18492 154.0621 L -136.87365 143.53303 L -140.34165 143.53303 z " />
            <path
                fill="currentColor"
                d="M -125.14413 143.35061 L -125.2139 143.77177 L -127.714 158.78584 L -128.92478 158.78584 L -129.26584 161.12317 L -125.50483 161.12317 L -123.42176 161.12317 L -120.85861 161.12317 L -120.51702 158.78584 L -120.35579 157.68048 L -120.0292 155.29303 L -118.82307 146.59847 L -118.77294 146.59847 L -117.5415 155.29303 L -117.2149 157.68048 L -117.2149 157.63036 L -116.71209 161.12317 L -113.94792 161.12317 L -116.81286 143.53303 L -120.55682 143.53303 L -123.0409 158.78584 L -125.11571 158.78584 L -122.6156 143.77177 L -122.6156 143.35423 L -125.14413 143.35061 z " />
        </g>
      </svg>
    </div>
    
    <div class="flex flex-col leading-none">
      <div class="text-xl font-black tracking-tighter text-foreground group-hover:text-blue-500 transition-colors uppercase italic">
        <template v-if="displayTitle === 'NETMETER'">
          NET<span class="text-blue-600 dark:text-blue-400">METER</span>
        </template>
        <template v-else>
          {{ displayTitle }}
        </template>
      </div>
      <span class="text-[8px] font-bold tracking-[0.2em] text-muted-foreground uppercase opacity-70">
        {{ subtitle || 'Billing System' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title?: string
  subtitle?: string
}>()

const displayTitle = computed(() => (props.title || 'NetMeter').toUpperCase())
</script>
