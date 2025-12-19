import { useApi } from '@/composables/useApi'
import type { Settings, UpdateSettingsDTO } from '@/types'
import { API_ENDPOINTS } from '@/utils/constants'

/**
 * Settings API module
 */
export const settingsApi = () => {
    const api = useApi()

    const get = async (): Promise<Settings> => {
        return api.get<Settings>(API_ENDPOINTS.SETTINGS)
    }

    const update = async (data: UpdateSettingsDTO): Promise<Settings> => {
        return api.put<Settings>(API_ENDPOINTS.SETTINGS, data)
    }

    return {
        get,
        update
    }
}
