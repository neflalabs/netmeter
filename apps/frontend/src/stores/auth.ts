import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
    id: string
    username: string
    name: string
    role: string
}

export const useAuthStore = defineStore('auth', () => {
    // State
    const token = ref<string | null>(localStorage.getItem('token'))
    const user = ref<User | null>(null)
    const expiresAt = ref<number | null>(null)

    // Getters
    const isAuthenticated = computed(() => !!token.value)

    // Actions
    function setToken(newToken: string) {
        token.value = newToken
        localStorage.setItem('token', newToken)
    }

    function setUser(newUser: User) {
        user.value = newUser
    }

    function logout() {
        token.value = null
        user.value = null
        expiresAt.value = null
        localStorage.removeItem('token')
    }

    function initialize() {
        const savedToken = localStorage.getItem('token')
        if (savedToken) {
            token.value = savedToken
        }
    }

    return {
        token,
        user,
        expiresAt,
        isAuthenticated,
        setToken,
        setUser,
        logout,
        initialize
    }
})
