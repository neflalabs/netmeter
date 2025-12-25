import { z } from 'zod';

export const authSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

export const userSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    whatsapp: z.string().min(1, 'WhatsApp number is required'),
    pppoeUsername: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    deviceModel: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    joinedAt: z.string().datetime().optional().or(z.date().optional()),
    firstConnectedAt: z.string().datetime().optional().or(z.date().optional()),
    dueDay: z.number().int().min(1).max(31).nullable().optional(),
    reminderInterval: z.number().int().min(1).nullable().optional(),
    reminderEnabled: z.boolean().optional(),
});

export const settingsSchema = z.object({
    monthlyFee: z.number().nonnegative().optional(),
    adminPhoneNumber: z.string().optional(),
    appTitle: z.string().optional(),
    appSubtitle: z.string().optional(),
    appUrl: z.string().url().or(z.string().length(0)).optional(),
    listingPerHome: z.number().int().positive().optional(),
    billTemplate: z.string().optional(),
    paymentTemplate: z.string().optional(),
    reminderTemplate: z.string().optional(),
    globalDueDay: z.number().int().min(1).max(31).optional(),
    globalReminderInterval: z.number().int().min(1).optional(),
    waEnabled: z.boolean().optional(),
    waServiceUrl: z.string().url().or(z.string().length(0)).optional(),
    waApiKey: z.string().optional(),
    waInstanceId: z.string().optional(),
    autoNotifyNewBill: z.boolean().optional(),
    autoNotifyPaymentSuccess: z.boolean().optional(),
    autoReminderEnabled: z.boolean().optional(),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    autoBillTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    quietHoursWeekend: z.boolean().optional(),
    manualPaymentEnabled: z.boolean().optional(),
    qrisPaymentEnabled: z.boolean().optional(),
    manualPaymentDetails: z.string().optional(),
    midtransEnabled: z.boolean().optional(),
    midtransServerKey: z.string().optional().nullable(),
    midtransClientKey: z.string().optional().nullable(),
    midtransEnvironment: z.enum(['sandbox', 'production']).optional(),
});

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
});

export const tokenParamSchema = z.object({
    token: z.string().min(1),
});

export const paginationSchema = z.object({
    page: z.preprocess((val) => val ?? '1', z.string().regex(/^\d+$/).transform(Number)),
    limit: z.preprocess((val) => val ?? '10', z.string().regex(/^\d+$/).transform(Number)),
});

export const manualPaySchema = z.object({
    paidAt: z.coerce.date().optional(),
    method: z.string().optional(),
});

export const whatsappSendSchema = z.object({
    phone: z.string().min(1),
    message: z.string().min(1),
    type: z.enum(['BILL', 'RECEIPT', 'REMINDER', 'OTHER']).optional(),
    userId: z.number().int().optional(),
});

export const financialReportSchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    method: z.string().optional(),
});

export const userIdQuerySchema = z.object({
    userId: z.string().regex(/^\d+$/).transform(Number).optional(),
});
