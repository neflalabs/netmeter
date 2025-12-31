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
    const financialData = ref<any>(null)
    const lastUpdated = ref<number | null>(null)
    const pagination = ref({
        total: 0,
        totalPages: 0,
        page: 1,
        limit: 5
    })

    // Filters (Shared between views)
    const filters = ref({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        status: 'ALL',
        userId: undefined as number | undefined
    })

    // Actions
    async function fetchBills(force = false, page = pagination.value.page, limit = pagination.value.limit) {
        const now = Date.now()
        const isStale = !lastUpdated.value || (now - lastUpdated.value > 60 * 1000) // 1 minute stale

        // If not forced and data is fresh and same page, return cached
        if (!force && bills.value.length > 0 && !isStale && pagination.value.page === page && pagination.value.limit === limit) {
            return bills.value
        }

        // Fresh fetch
        isFetching.value = true
        try {
            const res = await api.getAll({
                userId: filters.value.userId,
                page,
                limit
            })
            bills.value = res.data || []
            pagination.value = {
                total: res.pagination?.total || 0,
                totalPages: res.pagination?.totalPages || 0,
                page: res.pagination?.page || page,
                limit: res.pagination?.limit || limit
            }
            lastUpdated.value = Date.now()
            return bills.value
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
        pagination,
        fetchBills,
        fetchFinancialStats,
        markAsPaid
    }
})
