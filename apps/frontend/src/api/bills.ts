import { useApi } from '@/composables/useApi'
import type { Bill, GenerateBillsResponse } from '@/types'
import { API_ENDPOINTS } from '@/utils/constants'

/**
 * Bills API module
 */
export const billsApi = () => {
    const api = useApi()

    const getAll = async (userId?: number): Promise<Bill[]> => {
        const url = userId ? `${API_ENDPOINTS.BILLS}?userId=${userId}` : API_ENDPOINTS.BILLS
        return api.get<Bill[]>(url)
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
