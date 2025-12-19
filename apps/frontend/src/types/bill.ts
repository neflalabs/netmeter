export interface Bill {
    id: number
    userId: number
    month: number
    year: number
    amount: number
    status: 'UNPAID' | 'PAID'
    paymentToken?: string
    createdAt: Date | string
    // Joined fields from API
    userName?: string
    whatsapp?: string
    paidAt?: Date | string
    // Payment details
    paymentMethod?: string
    paymentType?: string
    paymentIssuer?: string
    gatewayStatus?: string
    transactionId?: string
}

export interface GenerateBillsResponse {
    message: string
    generatedCount: number
    month: number
    year: number
}
