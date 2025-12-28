<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const currentYear = new Date().getFullYear();
const router = useRouter();
const authStore = useAuthStore();

const handleClick = () => {
    if (!authStore.isAuthenticated) {
        router.push('/login');
    } else {
        // When logged in, only navigate on mobile (md breakpoint is 768px)
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            router.push('/');
        }
    }
};

const isInteractable = computed(() => {
    if (!authStore.isAuthenticated) return true;
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
})
</script>

<template>
    <footer 
        class="text-center py-6 text-muted-foreground text-xs"
        :class="{ 'cursor-pointer hover:text-foreground transition-colors': isInteractable }"
        @click="handleClick"
    >
        &copy; {{ currentYear }} Neflalabs
    </footer>
</template>
