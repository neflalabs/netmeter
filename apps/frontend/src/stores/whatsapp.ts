import { defineStore } from 'pinia'
import { ref } from 'vue'
import { whatsappApi } from '@/api/whatsapp'

export const useWhatsappStore = defineStore('whatsapp', () => {
    const api = whatsappApi()

    // State
    const connectionStatus = ref<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('DISCONNECTED')
    const qrCode = ref<string | null>(null)
    const logs = ref<any[]>([])
    const isFetching = ref(false)

    // Actions
    async function fetchStatus() {
        try {
            const data: any = await api.getStatus()
            connectionStatus.value = data.status
            return data
        } catch (e) {
            connectionStatus.value = 'DISCONNECTED'
        }
    }

    async function fetchQR() {
        isFetching.value = true
        try {
            const data: any = await api.getQR()
            qrCode.value = data.qr
            return data
        } finally {
            isFetching.value = false
        }
    }

    async function login() {
        connectionStatus.value = 'CONNECTING'
        await api.login()
        await fetchStatus()
    }

    async function logout() {
        await api.logout()
        connectionStatus.value = 'DISCONNECTED'
        qrCode.value = null
    }

    async function fetchLogs() {
        const data: any = await api.getLogs()
        logs.value = data.logs
        return data
    }

    return {
        connectionStatus,
        qrCode,
        logs,
        isFetching,
        fetchStatus,
        fetchQR,
        login,
        logout,
        fetchLogs
    }
})
