import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsApi } from '@/api/settings'
import type { Settings, UpdateSettingsDTO } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
    const api = settingsApi()

    // State
    const settings = ref<Settings | null>(null)
    const isFetching = ref(false)
    const lastUpdated = ref<number | null>(null)

    // Getters
    const appTitle = computed(() => settings.value?.appTitle || 'NetMeter')
    const midtransEnabled = computed(() => settings.value?.midtransEnabled || false)

    // Actions
    async function fetchSettings(force = false) {
        // Caching: don't refetch if fetched in last 5 minutes unless forced
        const now = Date.now()
        if (!force && settings.value && lastUpdated.value && (now - lastUpdated.value < 5 * 60 * 1000)) {
            return settings.value
        }

        isFetching.value = true
        try {
            const data = await api.get()
            settings.value = data
            lastUpdated.value = Date.now()
            return data
        } finally {
            isFetching.value = false
        }
    }

    async function updateSettings(data: UpdateSettingsDTO) {
        isFetching.value = true
        try {
            const updated = await api.update(data)
            settings.value = updated
            lastUpdated.value = Date.now()
            return updated
        } finally {
            isFetching.value = false
        }
    }

    return {
        settings,
        isFetching,
        lastUpdated,
        appTitle,
        midtransEnabled,
        fetchSettings,
        updateSettings
    }
})
