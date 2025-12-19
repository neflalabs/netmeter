import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useReportStore = defineStore('report', () => {
    const { get } = useApi()

    // State
    const financialData = ref<any>({
        summary: { totalIncome: 0, transactionCount: 0, totalOutstanding: 0 },
        chart: [],
        transactions: []
    })
    const behaviorData = ref<any>({
        distribution: [],
        topDays: []
    })
    const isFetchingFinancial = ref(false)
    const isFetchingBehavior = ref(false)

    // Actions
    async function fetchFinancial(startDate: string, endDate: string) {
        isFetchingFinancial.value = true
        try {
            const query = new URLSearchParams({ startDate, endDate })
            const data = await get(`/reports/financial?${query}`)
            financialData.value = data
            return data
        } finally {
            isFetchingFinancial.value = false
        }
    }

    async function fetchBehavior() {
        isFetchingBehavior.value = true
        try {
            const data = await get('/reports/payment-dates')
            behaviorData.value = data
            return data
        } finally {
            isFetchingBehavior.value = false
        }
    }

    return {
        financialData,
        behaviorData,
        isFetchingFinancial,
        isFetchingBehavior,
        fetchFinancial,
        fetchBehavior
    }
})
