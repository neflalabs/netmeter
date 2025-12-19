<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<template>
    <footer class="text-center py-6 text-muted-foreground text-xs">
        &copy; {{ currentYear }} Neflalabs
    </footer>
</template>
