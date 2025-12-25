<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Download, X } from 'lucide-vue-next'
import Button from './ui/Button.vue'

import { useAuthStore } from '@/stores/auth'

const deferredPrompt = ref<any>(null)
const showBanner = ref(false)
const authStore = useAuthStore()

onMounted(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault()
        // Stash the event so it can be triggered later.
        deferredPrompt.value = e
        
        // Update UI notify the user they can install the PWA
        // Only show if user is logged in
        if (authStore.isAuthenticated) {
            showBanner.value = true
        }
        
        console.log('PWA: beforeinstallprompt fired')
    })

    window.addEventListener('appinstalled', () => {
        // Hide the app-provided install promotion
        showBanner.value = false
        // Clear the deferredPrompt so it can be garbage collected
        deferredPrompt.value = null
        console.log('PWA: App installed')
    })
})

const handleInstall = async () => {
    if (!deferredPrompt.value) return
    
    // Show the install prompt
    deferredPrompt.value.prompt()
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.value.userChoice
    console.log(`PWA: User response to the install prompt: ${outcome}`)
    
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt.value = null
    showBanner.value = false
}

// Watch for authentication changes
import { watch } from 'vue'
watch(() => authStore.isAuthenticated, (newValue) => {
    if (newValue && deferredPrompt.value) {
        // If user logs in and we have a deferred prompt, show it
        showBanner.value = true
    } else if (!newValue) {
        // If user logs out, hide it
        showBanner.value = false
    }
})
</script>

<template>
    <div 
        v-if="showBanner"
        class="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm w-full sm:w-[320px]"
    >
        <div class="bg-card/95 backdrop-blur-md text-card-foreground p-3 rounded-2xl shadow-2xl border border-border flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <div class="bg-primary/10 p-2 rounded-xl text-primary">
                    <Download class="w-4 h-4" />
                </div>
                <div class="flex flex-col">
                    <h4 class="font-bold text-xs leading-tight">Instal Netmeter</h4>
                    <p class="text-[10px] text-muted-foreground leading-tight">Aplikasi manajemen tagihan.</p>
                </div>
            </div>
            
            <div class="flex items-center gap-1.5 ml-2">
                <Button size="sm" class="h-8 px-3 text-[11px] font-bold rounded-lg" @click="handleInstall">
                    Instal
                </Button>
                <button @click="showBanner = false" class="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                    <X class="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    </div>
</template>
