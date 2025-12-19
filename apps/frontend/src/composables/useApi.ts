import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

interface ApiError {
    error: string
}

/**
 * API client with automatic auth header injection and global error handling
 */
export const useApi = () => {
    const auth = useAuthStore()
    const ui = useUIStore()

    const getHeaders = (): HeadersInit => {
        const token = auth.token
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        return headers
    }

    const handleResponse = async <T>(response: Response): Promise<T> => {
        if (!response.ok) {
            // Handle 401 Unauthorized globally
            if (response.status === 401) {
                auth.logout()
                ui.toast({
                    title: 'Sesi Berakhir',
                    description: 'Silahkan login kembali.',
                    variant: 'destructive'
                })
                throw new Error('Unauthorized')
            }

            const error: ApiError = await response.json().catch(() => ({ error: 'Network error' }))
            const errorMessage = error.error || `HTTP ${response.status}`

            // Global error toast
            ui.toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive'
            })

            throw new Error(errorMessage)
        }
        return response.json()
    }

    const get = async <T>(url: string): Promise<T> => {
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-store' // Ensure no-cache for GET requests
        })
        return handleResponse<T>(response)
    }

    const post = async <T>(url: string, data?: unknown): Promise<T> => {
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: data ? JSON.stringify(data) : undefined
        })
        return handleResponse<T>(response)
    }

    const put = async <T>(url: string, data: unknown): Promise<T> => {
        const response = await fetch(url, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        })
        return handleResponse<T>(response)
    }

    const patch = async <T>(url: string, data?: unknown): Promise<T> => {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: getHeaders(),
            body: data ? JSON.stringify(data) : undefined
        })
        return handleResponse<T>(response)
    }

    const del = async <T>(url: string): Promise<T> => {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getHeaders()
        })
        return handleResponse<T>(response)
    }

    return {
        get,
        post,
        put,
        patch,
        delete: del
    }
}
