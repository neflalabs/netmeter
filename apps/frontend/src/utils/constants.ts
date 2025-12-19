export const API_ENDPOINTS = {
    AUTH: '/api/auth',
    USERS: '/api/users',
    BILLS: '/api/bills',
    SETTINGS: '/api/settings',
    WHATSAPP: '/api/whatsapp',
    BACKUP: '/api/backup'
} as const

export const USER_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
} as const

export const BILL_STATUS = {
    UNPAID: 'UNPAID',
    PAID: 'PAID'
} as const

export const PAYMENT_PREFERENCE = {
    MANUAL: 'MANUAL',
    AUTO: 'AUTO'
} as const
