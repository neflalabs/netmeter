
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import Footer from '@/components/Footer.vue';
import Toaster from '@/components/ui/Toaster.vue';
import AppLogo from '@/components/AppLogo.vue';

const appSettings = ref({
    appTitle: 'NetMeter',
    appSubtitle: '',
    adminPhoneNumber: ''
});

onMounted(async () => {
    try {
        const res = await fetch('/api/public/settings');
        if (res.ok) {
            const data = await res.json();
            appSettings.value = {
                appTitle: data.appTitle || 'NetMeter',
                appSubtitle: data.appSubtitle || '',
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
                <div>
                    <AppLogo :title="appSettings.appTitle" :subtitle="appSettings.appSubtitle" />
                </div>
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
