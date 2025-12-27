import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
    // State
    const theme = ref<'light' | 'dark'>(
        (localStorage.getItem('theme') as 'light' | 'dark') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    )
    const isSidebarOpen = ref(localStorage.getItem('sidebar_open') !== 'false')
    const globalLoading = ref(false)

    // Actions
    function toggleTheme() {
        setTheme(theme.value === 'light' ? 'dark' : 'light')
    }

    function setTheme(newTheme: 'light' | 'dark' | 'auto') {
        if (newTheme === 'auto') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            theme.value = systemTheme
            localStorage.removeItem('theme')
        } else {
            theme.value = newTheme
            localStorage.setItem('theme', newTheme)
        }
    }

    function toggleSidebar() {
        isSidebarOpen.value = !isSidebarOpen.value
    }

    function setGlobalLoading(loading: boolean) {
        globalLoading.value = loading
    }

    // Persistence Watchers
    watch(theme, (newTheme) => {
        localStorage.setItem('theme', newTheme)
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, { immediate: true })

    watch(isSidebarOpen, (isOpen) => {
        localStorage.setItem('sidebar_open', String(isOpen))
    })

    return {
        theme,
        isSidebarOpen,
        globalLoading,
        toggleTheme,
        toggleSidebar,
        setGlobalLoading,
        setTheme
    }
})
