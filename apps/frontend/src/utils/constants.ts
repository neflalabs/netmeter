export const API_ENDPOINTS = {
    AUTH: '/api/auth',
    USERS: '/api/users',
    BILLS: '/api/bills',
    SETTINGS: '/api/settings',
    REPORTS: '/api/reports' as const, // For stats
    BACKUP: '/api/backup',
    WHATSAPP: '/api/whatsapp'
} as const

export const USER_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    DELETED: 'DELETED'
} as const

export const BILL_STATUS = {
    UNPAID: 'UNPAID',
    PAID: 'PAID'
} as const

export const PAYMENT_PREFERENCE = {
    MANUAL: 'MANUAL',
    AUTO: 'AUTO'
} as const

export const ANNOUNCEMENT_TYPES = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    PROMO: 'PROMO'
} as const
