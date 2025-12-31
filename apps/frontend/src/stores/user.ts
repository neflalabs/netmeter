import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi } from '@/api/users'
import type { User, CreateUserDTO, UpdateUserDTO } from '@/types'

export const useUserStore = defineStore('user', () => {
    const api = usersApi()

    // State
    const users = ref<User[]>([])
    const isFetching = ref(false)
    const lastUpdated = ref<number | null>(null)
    const pagination = ref({
        total: 0,
        totalPages: 0,
        page: 1,
        limit: 5
    })

    // Actions
    async function fetchUsers(force = false, includeDeleted = true, page = pagination.value.page, limit = pagination.value.limit) {
        const now = Date.now()
        const isStale = !lastUpdated.value || (now - lastUpdated.value > 5 * 60 * 1000)

        // If data is available and not forced and not stale, return immediately
        if (!force && users.value.length > 0 && !isStale && pagination.value.page === page && pagination.value.limit === limit) {
            return users.value
        }

        isFetching.value = true
        try {
            const res = await api.getAll({ includeDeleted, page, limit })
            users.value = res.data || []
            pagination.value = {
                total: res.pagination?.total || 0,
                totalPages: res.pagination?.totalPages || 0,
                page: res.pagination?.page || page,
                limit: res.pagination?.limit || limit
            }
            lastUpdated.value = Date.now()
            return users.value
        } finally {
            isFetching.value = false
        }
    }

    async function createUser(data: CreateUserDTO) {
        const newUser = await api.create(data)
        users.value.push(newUser)
        return newUser
    }

    async function updateUser(id: number, data: UpdateUserDTO) {
        const updated = await api.update(id, data)
        const index = users.value.findIndex(u => u.id === id)
        if (index !== -1) {
            users.value[index] = updated
        }
        return updated
    }

    async function deleteUser(id: number) {
        await api.remove(id)
        // Refresh to get updated status/deletedAt
        await fetchUsers(true)
    }

    async function restoreUser(id: number) {
        await api.restore(id)
        // Refresh to get updated status/deletedAt
        await fetchUsers(true)
    }

    return {
        users,
        isFetching,
        lastUpdated,
        pagination,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        restoreUser
    }
})
