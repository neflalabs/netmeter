export interface Settings {
    id: number
    monthlyFee: number
    adminPhoneNumber: string
    appTitle: string
    appSubtitle: string
    appUrl?: string
    listingPerHome: number

    // Announcement
    announcementTitle?: string
    announcementMessage?: string
    announcementType?: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER'
    announcementActive?: boolean
    announcementCreatedAt?: Date | string
    announcementUpdatedAt?: Date | string

    billTemplate?: string
    paymentTemplate?: string

    // Payment Configuration
    manualPaymentEnabled?: boolean
    qrisPaymentEnabled?: boolean
    manualPaymentDetails?: string;
    qrisRawString?: string;

    midtransEnabled?: boolean;
    midtransServerKey?: string;
    midtransClientKey?: string;
    midtransEnvironment?: 'sandbox' | 'production';

    xenditEnabled?: boolean;
    xenditSecretKey?: string;
    xenditVerificationToken?: string;
    xenditEnvironment?: 'sandbox' | 'production';

    // Notification Features
    reminderTemplate?: string;
    globalDueDay?: number;
    globalReminderInterval?: number;
    waEnabled?: boolean;
    waServiceUrl?: string;
    waApiKey?: string;
    waInstanceId?: string;
    waWebhookSecret?: string;
    autoNotifyNewBill?: boolean;
    autoNotifyPaymentSuccess?: boolean;
    autoReminderEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    quietHoursWeekend?: boolean;
    reminderTime?: string;
    autoBillTime?: string;

    updatedAt?: Date | string
}

export interface UpdateSettingsDTO {
    monthlyFee?: number
    adminPhoneNumber?: string
    appTitle?: string
    appSubtitle?: string
    appUrl?: string
    listingPerHome?: number
    announcementTitle?: string
    announcementMessage?: string
    announcementType?: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER'
    announcementActive?: boolean
    announcementCreatedAt?: Date | string
    announcementUpdatedAt?: Date | string


    billTemplate?: string
    paymentTemplate?: string

    // Payment Configuration
    manualPaymentEnabled?: boolean
    qrisPaymentEnabled?: boolean
    manualPaymentDetails?: string;
    qrisRawString?: string;

    midtransEnabled?: boolean;
    midtransServerKey?: string;
    midtransClientKey?: string;
    midtransEnvironment?: 'sandbox' | 'production';

    xenditEnabled?: boolean;
    xenditSecretKey?: string;
    xenditVerificationToken?: string;
    xenditEnvironment?: 'sandbox' | 'production';

    // Notification Features
    reminderTemplate?: string;
    globalDueDay?: number;
    globalReminderInterval?: number;
    waEnabled?: boolean;
    waServiceUrl?: string;
    waApiKey?: string;
    waInstanceId?: string;
    waWebhookSecret?: string;
    autoNotifyNewBill?: boolean;
    autoNotifyPaymentSuccess?: boolean;
    autoReminderEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    quietHoursWeekend?: boolean;
    reminderTime?: string;
    autoBillTime?: string;
}
