
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Wifi } from 'lucide-vue-next';
import ThemeToggle from '@/components/ThemeToggle.vue';
import Footer from '@/components/Footer.vue';
import Toaster from '@/components/ui/Toaster.vue';

const appSettings = ref({
    appTitle: 'NetMeter',
    adminPhoneNumber: ''
});

onMounted(async () => {
    try {
        const res = await fetch('/api/public/settings');
        if (res.ok) {
            const data = await res.json();
            appSettings.value = {
                appTitle: data.appTitle || 'NetMeter',
                adminPhoneNumber: data.adminPhoneNumber || ''
            };
        }
    } catch (e) {
        console.error('Failed to load settings', e);
    }
});
</script>

<template>
    <div class="min-h-screen bg-background flex flex-col font-sans">
        <!-- Header -->
        <header class="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
            <div class="container mx-auto flex justify-between items-center">
                <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div class="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                        <Wifi class="w-5 h-5" />
                    </div>
                    <div>
                        <h1 class="font-bold text-lg text-foreground leading-tight">{{ appSettings.appTitle }}</h1>
                    </div>
                </router-link>
                 <div class="flex gap-2 items-center">
                    <ThemeToggle />
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 container mx-auto px-4 py-8 max-w-2xl">
            <slot />
        </main>


        <Footer />
        <Toaster />
    </div>
</template>
