<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const currentYear = new Date().getFullYear();
const router = useRouter();
const authStore = useAuthStore();

const handleClick = () => {
    if (!authStore.isAuthenticated) {
        router.push('/login');
    }
};
</script>

<template>
    <footer 
        class="text-center py-6 text-muted-foreground text-xs"
        :class="{ 'cursor-pointer hover:text-foreground transition-colors': !authStore.isAuthenticated }"
        @click="handleClick"
    >
        &copy; {{ currentYear }} Neflalabs
    </footer>
</template>
