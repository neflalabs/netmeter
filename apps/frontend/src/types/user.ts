export interface User {
    id: number
    name: string
    whatsapp: string
    pppoeUsername?: string
    status: 'ACTIVE' | 'INACTIVE'
    paymentPreference?: 'MANUAL' | 'AUTO'
    address?: string
    deviceModel?: string
    notes?: string
    joinedAt?: Date | string
    firstConnectedAt?: Date | string
    deletedAt?: Date | string

    // Notification Customization
    dueDay?: number
    reminderInterval?: number
    reminderEnabled?: boolean

    createdAt: Date | string
}

export interface CreateUserDTO {
    name: string
    whatsapp: string
    pppoeUsername?: string
    address?: string
    deviceModel?: string
    notes?: string
    joinedAt?: string
    dueDay?: number
    reminderInterval?: number
    reminderEnabled?: boolean
}

export interface UpdateUserDTO extends Partial<CreateUserDTO> {
    status?: 'ACTIVE' | 'INACTIVE'
    dueDay?: number
    reminderInterval?: number
    reminderEnabled?: boolean
}
