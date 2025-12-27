import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    whatsapp: text('whatsapp').notNull(),
    pppoeUsername: text('pppoe_username').unique(),
    status: text('status').default('ACTIVE'),
    paymentPreference: text('payment_preference').default('MANUAL'),

    // Additional Details
    address: text('address'),
    deviceModel: text('device_model'),
    notes: text('notes'),
    joinedAt: integer('joined_at', { mode: 'timestamp' }),
    firstConnectedAt: integer('first_connected_at', { mode: 'timestamp' }),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete

    // Notification Customization per User
    dueDay: integer('due_day'), // Override globalDueDay
    reminderInterval: integer('reminder_interval'), // Override globalReminderInterval
    reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
    statusIdx: index('idx_users_status').on(table.status),
    whatsappIdx: index('idx_users_whatsapp').on(table.whatsapp),
}));

export const settings = sqliteTable('settings', {
    singleton: integer('singleton').primaryKey().default(1), // Always 1 - enforces single row
    monthlyFee: integer('monthly_fee').notNull().default(0), // Default 0 (unset)
    adminPhoneNumber: text('admin_phone_number').notNull().default(''),
    appTitle: text('app_title').default('NetMeter'),
    appSubtitle: text('app_subtitle').default('Cara baru patungan WiFi'),
    appUrl: text('app_url').default(''), // Public URL for links/webhooks
    listingPerHome: integer('listing_per_home').notNull().default(6), // Limit listings on homepage

    // Announcement Configuration
    announcementTitle: text('announcement_title').default('Pengumuman'),
    announcementMessage: text('announcement_message').default(''),
    announcementType: text('announcement_type', { enum: ['INFO', 'WARNING', 'SUCCESS', 'DANGER'] }).default('INFO'),
    announcementActive: integer('announcement_active', { mode: 'boolean' }).default(false),
    announcementCreatedAt: integer('announcement_created_at', { mode: 'timestamp' }),
    announcementUpdatedAt: integer('announcement_updated_at', { mode: 'timestamp' }),

    billTemplate: text('bill_template').default('Assalamualaikum {name}, patungan bulan {month} / {year} sebesar Rp. {amount} sudah bisa dibayar.{br} Untuk membayar secara otomatis, klik di sini: {link} {br}{br} _Pesan ini dikirim otomatis oleh aplikasi._'),
    paymentTemplate: text('payment_template').default('Assalamualaikum {name}, patungan sebesar Rp. {amount} via {method} sudah diterima. detailnya bisa cek disini : {link} {br} Maturnuwun! {br}{br} _Pesan ini dikirim otomatis oleh aplikasi._'),
    reminderTemplate: text('reminder_template').default('Assalamualaikum {name}, sekadar mengingatkan patungan WiFi bulan {month} / {year} sebesar Rp. {amount} belum lunas. Jika sudah bayar, abaikan pesan ini: {link} {br}{br} _Pesan ini dikirim otomatis oleh aplikasi._'),

    // Global Notification Config
    globalDueDay: integer('global_due_day').default(10), // Default day 10
    globalReminderInterval: integer('global_reminder_interval').default(3), // Every 3 days

    waEnabled: integer('wa_enabled', { mode: 'boolean' }).default(false),
    waServiceUrl: text('wa_service_url').default('http://localhost:3030/api/v1'), // Default URL
    waApiKey: text('wa_api_key').default(''), // Default empty
    waInstanceId: text('wa_instance_id').default(''), // Default instance
    waWebhookSecret: text('wa_webhook_secret').default(''), // Secret for webhook verification
    autoNotifyNewBill: integer('auto_notify_new_bill', { mode: 'boolean' }).default(false),
    autoNotifyPaymentSuccess: integer('auto_notify_payment_success', { mode: 'boolean' }).default(false),
    autoReminderEnabled: integer('auto_reminder_enabled', { mode: 'boolean' }).default(false),
    reminderTime: text('reminder_time').default('09:00'),
    autoBillTime: text('auto_bill_time').default('09:00'),

    // Working Hours for notifications
    quietHoursStart: text('quiet_hours_start').default('21:00'),
    quietHoursEnd: text('quiet_hours_end').default('08:00'),
    quietHoursWeekend: integer('quiet_hours_weekend', { mode: 'boolean' }).default(true),

    // Payment Methods Configuration
    manualPaymentEnabled: integer('manual_payment_enabled', { mode: 'boolean' }).default(true),
    qrisPaymentEnabled: integer('qris_payment_enabled', { mode: 'boolean' }).default(false),
    manualPaymentDetails: text('manual_payment_details').default('Tidak ingin menggunakan pembayaran otomatis? Silakan lakukan pembayaran tunai dengan menghubungi admin.'), // Bank details etc.
    qrisRawString: text('qris_raw_string').default('00020101021126610014COM.GO-JEK.WWW01189360091439280284540210G9280284540303UMI51440014ID.CO.QRIS.WWW0215ID10253777680290303UMI5204553353033605802ID5910NEFLA LABS6006SORONG61059844562070703A0163044598'), // Raw QRIS string for dynamic injection

    // Midtrans Configuration
    midtransEnabled: integer('midtrans_enabled', { mode: 'boolean' }).default(false),
    midtransServerKey: text('midtrans_server_key'),
    midtransClientKey: text('midtrans_client_key'),
    midtransEnvironment: text('midtrans_environment').default('sandbox'),

    // Xendit Configuration
    xenditEnabled: integer('xendit_enabled', { mode: 'boolean' }).default(false),
    xenditSecretKey: text('xendit_secret_key'),
    xenditVerificationToken: text('xendit_verification_token'),
    xenditEnvironment: text('xendit_environment').default('sandbox'),

    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const bills = sqliteTable('bills', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    month: integer('month').notNull(), // 1-12
    year: integer('year').notNull(), // 2024
    amount: integer('amount').notNull(),
    status: text('status', { enum: ['UNPAID', 'PAID'] }).default('UNPAID'),
    paymentToken: text('payment_token').notNull().unique(),

    // Midtrans Snap Token Caching
    snapToken: text('snap_token'),
    snapTokenExpiry: integer('snap_token_expiry', { mode: 'timestamp' }),
    snapAmount: integer('snap_amount'),

    paidAt: integer('paid_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index('idx_bills_user_id').on(table.userId),
    statusIdx: index('idx_bills_status').on(table.status),
    monthYearIdx: index('idx_bills_month_year').on(table.month, table.year),
    paymentTokenIdx: index('idx_bills_payment_token').on(table.paymentToken),
    uniqueUserMonthYear: unique('unique_user_month_year').on(table.userId, table.month, table.year),
}));

export const payments = sqliteTable('payments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    billId: integer('bill_id').references(() => bills.id, { onDelete: 'cascade' }).notNull(),
    amount: integer('amount').notNull(),
    method: text('method').notNull(), // 'CASH', 'MANUAL_TRANSFER', 'MIDTRANS'

    // Standardization Fields
    transactionId: text('transaction_id').unique(), // Midtrans transaction_id
    paymentType: text('payment_type'), // gopay, bank_transfer, etc.
    issuer: text('issuer'), // bca, bni, gopay, etc.
    gatewayStatus: text('gateway_status'), // settlement, capture, pending
    currency: text('currency').default('IDR'),
    rawResponse: text('raw_response'), // Full JSON payload
    externalId: text('external_id'), // Midtrans order_id

    proofUrl: text('proof_url'),
    status: text('status', { enum: ['PENDING', 'VERIFIED', 'REJECTED'] }).default('PENDING'),
    paidAt: integer('paid_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
    billIdIdx: index('idx_payments_bill_id').on(table.billId),
    transactionIdIdx: index('idx_payments_transaction_id').on(table.transactionId),
    statusIdx: index('idx_payments_status').on(table.status),
}));

// whatappLogs functionality to log WhatsApp message activities
export const whatsappLogs = sqliteTable('whatsapp_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    recipient: text('recipient').notNull(), // phone number
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    billId: integer('bill_id').references(() => bills.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    type: text('type', { enum: ['BILL', 'RECEIPT', 'REMINDER', 'INCOMING', 'OTHER'] }).default('OTHER'),
    status: text('status', { enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'] }).default('SENT'),
    waMessageId: text('wa_message_id').unique(), // ID from wa-bot (whatsmeow)
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
    recipientIdx: index('idx_wa_logs_recipient').on(table.recipient),
    userIdIdx: index('idx_wa_logs_user_id').on(table.userId),
    billIdIdx: index('idx_wa_logs_bill_id').on(table.billId),
    createdAtIdx: index('idx_wa_logs_created_at').on(table.createdAt),
}));
