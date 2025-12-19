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

    // Actions
    async function fetchUsers(force = false, includeDeleted = true) {
        const now = Date.now()
        const isStale = !lastUpdated.value || (now - lastUpdated.value > 5 * 60 * 1000)

        // If data is available and not forced, return immediately
        if (!force && users.value.length > 0 && !isStale) {
            return users.value
        }

        // SWR: If we have data but it's stale, fetch in background without showing loader
        if (users.value.length > 0 && isStale) {
            api.getAll({ includeDeleted }).then(data => {
                users.value = data
                lastUpdated.value = Date.now()
            })
            return users.value
        }

        isFetching.value = true
        try {
            const data = await api.getAll({ includeDeleted })
            users.value = data
            lastUpdated.value = Date.now()
            return data
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
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        restoreUser
    }
})
