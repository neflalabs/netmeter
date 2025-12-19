import { useApi } from '@/composables/useApi'
import type { User, CreateUserDTO, UpdateUserDTO } from '@/types'
import { API_ENDPOINTS } from '@/utils/constants'

/**
 * Users API module
 */
export const usersApi = () => {
    const api = useApi()

    const getAll = async (params?: { includeDeleted?: boolean }): Promise<User[]> => {
        const queryParams = new URLSearchParams()
        if (params?.includeDeleted) {
            queryParams.append('include_deleted', 'true')
        }
        return api.get<User[]>(`${API_ENDPOINTS.USERS}?${queryParams.toString()}`)
    }

    const get = async (id: number): Promise<User> => {
        return api.get<User>(`${API_ENDPOINTS.USERS}/${id}`)
    }

    const create = async (data: CreateUserDTO): Promise<User> => {
        return api.post<User>(API_ENDPOINTS.USERS, data)
    }

    const update = async (id: number, data: UpdateUserDTO): Promise<User> => {
        return api.put<User>(`${API_ENDPOINTS.USERS}/${id}`, data)
    }

    const remove = async (id: number): Promise<void> => {
        return api.delete<void>(`${API_ENDPOINTS.USERS}/${id}`)
    }

    const restore = async (id: number): Promise<User> => {
        return api.post<User>(`${API_ENDPOINTS.USERS}/${id}/restore`)
    }

    return {
        getAll,
        get,
        create,
        update,
        remove,
        restore
    }
}
