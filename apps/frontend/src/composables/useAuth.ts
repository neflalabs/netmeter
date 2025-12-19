import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable for authentication state and operations
 * (Bridge to Pinia authStore)
 */
export const useAuth = () => {
    const auth = useAuthStore()

    return {
        token: computed(() => auth.token),
        isAuthenticated: computed(() => auth.isAuthenticated),
        setToken: auth.setToken,
        logout: auth.logout,
        removeToken: auth.logout // Alias for compatibility
    }
}
