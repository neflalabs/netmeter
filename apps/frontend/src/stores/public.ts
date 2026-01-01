import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { Settings } from '@/types'

export const usePublicStore = defineStore('public', () => {
    const settings = ref<Settings | null>(null)
    const publicBills = ref<any[]>([])
    const isFetchingSettings = ref(false)
    const isFetchingBills = ref(false)

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

    const { pause, resume } = useIntervalFn(async () => {
        await Promise.allSettled([
            fetchSettings(),
            fetchPublicBills()
        ])
    }, 30000, { immediate: false })

    function startPolling() {
        // Initial fetch
        fetchSettings()
        fetchPublicBills()
        resume()
    }

    function stopPolling() {
        pause()
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
