import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings } from '@/types'

export const usePublicStore = defineStore('public', () => {
    const settings = ref<Settings | null>(null)
    const publicBills = ref<any[]>([])
    const isFetchingSettings = ref(false)
    const isFetchingBills = ref(false)
    let pollingInterval: number | null = null

    async function fetchSettings() {
        isFetchingSettings.value = true
        try {
            const res = await fetch('/api/public/settings')
            if (res.ok) {
                settings.value = await res.json()
            }
        } catch (e) {
            console.error('Failed to fetch public settings', e)
        } finally {
            isFetchingSettings.value = false
        }
    }

    async function fetchPublicBills() {
        isFetchingBills.value = true
        try {
            const res = await fetch('/api/public/bills')
            if (res.ok) {
                publicBills.value = await res.json()
            }
        } catch (e) {
            console.error('Failed to fetch public bills', e)
        } finally {
            isFetchingBills.value = false
        }
    }

    function startPolling(intervalMs = 10000) {
        if (pollingInterval) return

        // Initial fetch
        fetchSettings()
        fetchPublicBills()

        pollingInterval = window.setInterval(() => {
            fetchSettings()
            fetchPublicBills()
        }, intervalMs)
    }

    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
        }
    }

    return {
        settings,
        publicBills,
        isFetchingSettings,
        isFetchingBills,
        fetchSettings,
        fetchPublicBills,
        startPolling,
        stopPolling
    }
})
