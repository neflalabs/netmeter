import { useApi } from '@/composables/useApi'

export const reportsApi = () => {
    const api = useApi()

    const getFinancial = async (startDate: string, endDate: string) => {
        const query = new URLSearchParams({ startDate, endDate })
        return api.get<any>(`/api/reports/financial?${query.toString()}`)
    }

    const getPaymentDates = async () => {
        return api.get<any>('/api/reports/payment-dates')
    }

    return {
        getFinancial,
        getPaymentDates
    }
}
