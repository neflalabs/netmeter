import { defineStore } from 'pinia'
import { ref } from 'vue'
import { billsApi } from '@/api/bills'
import { reportsApi } from '@/api/reports'
import type { Bill } from '@/types'

export const useBillStore = defineStore('bill', () => {
    const api = billsApi()
    const reports = reportsApi()

    // State
    const bills = ref<Bill[]>([])
    const isFetching = ref(false)
    const isBackgroundFetching = ref(false)
    const financialData = ref<any>(null)
    const lastUpdated = ref<number | null>(null)

    // Filters (Shared between views)
    const filters = ref({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        status: 'ALL'
    })

    // Actions
    async function fetchBills(force = false) {
        const now = Date.now()
        const isStale = !lastUpdated.value || (now - lastUpdated.value > 60 * 1000) // 1 minute stale

        // If not forced and data is fresh, return cached
        if (!force && bills.value.length > 0 && !isStale) {
            return bills.value
        }

        // If we have data, show it but fetch new in background
        if (bills.value.length > 0) {
            isBackgroundFetching.value = true
            api.getAll().then(data => {
                bills.value = data
                lastUpdated.value = Date.now()
            }).finally(() => {
                isBackgroundFetching.value = false
            })
            return bills.value
        }

        // Fresh fetch
        isFetching.value = true
        try {
            const data = await api.getAll()
            bills.value = data
            lastUpdated.value = Date.now()
            return data
        } finally {
            isFetching.value = false
        }
    }

    async function fetchFinancialStats(startDate: string, endDate: string) {
        isFetching.value = true
        try {
            const data = await reports.getFinancial(startDate, endDate)
            financialData.value = data
            return data
        } finally {
            isFetching.value = false
        }
    }

    async function markAsPaid(id: number, paidAt?: Date, method: 'CASH' | 'MANUAL_TRANSFER' = 'CASH') {
        await api.markAsPaid(id, paidAt, method)
        // Locally update bill status
        const bill = bills.value.find(b => b.id === id)
        if (bill) {
            bill.status = 'PAID'
            bill.paidAt = (paidAt || new Date()).toISOString()
        }
        // Invalidate stats so they are refetched
        financialData.value = null
    }

    return {
        bills,
        filters,
        financialData,
        isFetching,
        fetchBills,
        fetchFinancialStats,
        markAsPaid
    }
})
