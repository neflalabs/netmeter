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
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    joinedAt: z.preprocess((val) => (val === '' ? null : val), z.coerce.date().nullable().optional()),
    firstConnectedAt: z.preprocess((val) => (val === '' ? null : val), z.coerce.date().nullable().optional()),
    dueDay: z.preprocess((val) => (val === '' ? null : val), z.number().int().min(1).max(31).nullable().optional()),
    reminderInterval: z.preprocess((val) => (val === '' ? null : val), z.number().int().min(1).nullable().optional()),
    reminderEnabled: z.boolean().optional(),
});

export const settingsSchema = z.object({
    monthlyFee: z.number().nonnegative().optional().nullable(),
    adminPhoneNumber: z.string().optional().nullable(),
    appTitle: z.string().optional().nullable(),
    appSubtitle: z.string().optional().nullable(),
    appUrl: z.string().url().or(z.string().length(0)).optional().nullable(),
    listingPerHome: z.number().int().positive().optional().nullable(),
    announcementTitle: z.string().optional().nullable(),
    announcementMessage: z.string().optional().nullable(),
    announcementType: z.enum(['INFO', 'WARNING', 'SUCCESS', 'DANGER']).optional().nullable(),
    announcementActive: z.boolean().optional().nullable(),


    billTemplate: z.string().optional().nullable(),
    paymentTemplate: z.string().optional().nullable(),
    reminderTemplate: z.string().optional().nullable(),
    globalDueDay: z.number().int().min(1).max(31).optional().nullable(),
    globalReminderInterval: z.number().int().min(1).optional().nullable(),
    waEnabled: z.boolean().optional().nullable(),
    waServiceUrl: z.string().url().or(z.string().length(0)).optional().nullable(),
    waApiKey: z.string().optional().nullable(),
    waInstanceId: z.string().optional().nullable(),
    waWebhookSecret: z.string().optional().nullable(),
    autoNotifyNewBill: z.boolean().optional().nullable(),
    autoNotifyPaymentSuccess: z.boolean().optional().nullable(),
    autoReminderEnabled: z.boolean().optional().nullable(),
    reminderTime: z.string().regex(/^([0-9]|0\d|1\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
    autoBillTime: z.string().regex(/^([0-9]|0\d|1\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
    quietHoursStart: z.string().regex(/^([0-9]|0\d|1\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
    quietHoursEnd: z.string().regex(/^([0-9]|0\d|1\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
    quietHoursWeekend: z.boolean().optional().nullable(),
    manualPaymentEnabled: z.boolean().optional().nullable(),
    qrisPaymentEnabled: z.boolean().optional().nullable(),
    manualPaymentDetails: z.string().optional().nullable(),
    midtransEnabled: z.boolean().optional().nullable(),
    midtransServerKey: z.string().optional().nullable(),
    midtransClientKey: z.string().optional().nullable(),
    midtransEnvironment: z.enum(['sandbox', 'production']).optional().nullable(),
    qrisRawString: z.string().optional().nullable(),
    xenditEnabled: z.boolean().optional().nullable(),
    xenditSecretKey: z.string().optional().nullable(),
    xenditVerificationToken: z.string().optional().nullable(),
    xenditEnvironment: z.enum(['sandbox', 'production']).optional().nullable(),
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
