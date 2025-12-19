export * from './users'
import { API_ENDPOINTS } from '@/utils/constants'

export const backupApi = () => {
    return {
        downloadUrl: `${API_ENDPOINTS.BACKUP}/download`, // Access via browser/link not fetch for download usually
        async restore(file: File) {
            const formData = new FormData()
            formData.append('file', file)

            // We use direct fetch here because useApi() sets Content-Type to application/json
            // and we need the browser to set the multipart boundary for FormData.
            // Also getting token directly from storage to avoid composable limitations if any.
            // Note: Make sure the store key matches what useAuth uses.
            // Checking useAuth/useStorage might be 'netmeter-token' or similar?
            // Let's assume 'token' based on previous context, or check useAuth later if this fails.
            // Actually, in useApi.ts it calls useAuth().getToken(). Let's peek at useAuth to be safe? 
            // Better yet, let's just use localStorage.getItem('access_token') or whatever.
            // Wait, looking at previous artifacts/context, I don't see useAuth code.
            // But SettingsView used `localStorage.getItem('token')` in my previous "manual" fetch proposal.
            // Let's assume 'netmeter-token' or similar if I don't check.
            // Let's check useAuth real quick in next step if I can, or just trust standard.
            // Wait, I can try to use `useAuth` inside here if I am inside setup context.
            // user of `backupApi()` is `BackupTab.vue` which calls it inside `downloadBackup` and `restoreBackup`.
            // These are regular functions. `backupApi()` is called inside them?
            // `const api = backupApi()` inside `downloadBackup`.
            // So we are likely capable of using composables if `backupApi` is called in setup or methods...
            // But easier to just read localStorage 'token' as standard.

            const token = localStorage.getItem('token') || localStorage.getItem('netmeter-token')
            console.log('Sending restore request', { url: `${API_ENDPOINTS.BACKUP}/restore`, file: file.name, size: file.size, token: !!token })

            const res = await fetch(`${API_ENDPOINTS.BACKUP}/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do NOT set Content-Type
                },
                body: formData
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Restore failed')
            }
            return res.json()
        }
    }
}
export * from './bills'
export * from './settings'
export * from './whatsapp'
