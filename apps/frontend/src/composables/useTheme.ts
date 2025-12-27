import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

export function useTheme() {
    const app = useAppStore()

    return {
        theme: computed(() => app.theme),
        toggleTheme: app.toggleTheme,
        setTheme: app.setTheme
    }
}
