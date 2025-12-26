import { useApi } from '@/composables/useApi'
import { API_ENDPOINTS } from '@/utils/constants'

export const whatsappApi = () => {
    const api = useApi()

    const getStatus = async () => {
        return api.get(API_ENDPOINTS.WHATSAPP + '/status')
    }

    const getQR = async () => {
        return api.get(API_ENDPOINTS.WHATSAPP + '/qr')
    }

    const login = async () => {
        return api.post(API_ENDPOINTS.WHATSAPP + '/login')
    }

    const logout = async () => {
        return api.post(API_ENDPOINTS.WHATSAPP + '/logout')
    }

    const getLogs = async (page = 1, limit = 20, type?: string) => {
        let url = `${API_ENDPOINTS.WHATSAPP}/logs?page=${page}&limit=${limit}`
        if (type) url += `&type=${type}`
        return api.get(url)
    }

    const syncLogs = async () => {
        return api.post(API_ENDPOINTS.WHATSAPP + '/sync')
    }

    const checkPhone = async (phone: string) => {
        return api.get(`${API_ENDPOINTS.WHATSAPP}/check-phone?phone=${phone}`)
    }

    return {
        getStatus,
        getQR,
        login,
        logout,
        getLogs,
        syncLogs,
        checkPhone
    }
}
