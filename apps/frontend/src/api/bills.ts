import { useApi } from '@/composables/useApi'
import type { GenerateBillsResponse } from '@/types'
import { API_ENDPOINTS } from '@/utils/constants'

/**
 * Bills API module
 */
export const billsApi = () => {
    const api = useApi()

    const getAll = async (params?: { userId?: number, page?: number, limit?: number }): Promise<any> => {
        const queryParams = new URLSearchParams()
        if (params?.userId) queryParams.append('userId', params.userId.toString())
        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())

        const url = `${API_ENDPOINTS.BILLS}?${queryParams.toString()}`
        return api.get<any>(url)
    }

    const generate = async (): Promise<GenerateBillsResponse> => {
        return api.post<GenerateBillsResponse>(`${API_ENDPOINTS.BILLS}/generate`)
    }

    const markAsPaid = async (id: number, paidAt?: Date, method: 'CASH' | 'MANUAL_TRANSFER' = 'CASH'): Promise<{ message: string }> => {
        return api.patch<{ message: string }>(`${API_ENDPOINTS.BILLS}/${id}/pay`, {
            paidAt: paidAt ? paidAt.toISOString() : undefined,
            method
        })
    }

    const notify = async (id: number): Promise<{ message: string }> => {
        return api.post<{ message: string }>(`${API_ENDPOINTS.BILLS}/${id}/notify`)
    }

    const notifyPayment = async (id: number): Promise<{ message: string }> => {
        return api.post<{ message: string }>(`${API_ENDPOINTS.BILLS}/${id}/payment-notify`)
    }

    const cancelPayment = async (id: number): Promise<{ success: boolean }> => {
        return api.post<{ success: boolean }>(`/api/payment/cancel/${id}`)
    }

    return {
        getAll,
        generate,
        markAsPaid,
        notify,
        notifyPayment,
        cancelPayment
    }
}
