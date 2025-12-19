export interface Settings {
    id: number
    monthlyFee: number
    adminPhoneNumber: string
    appTitle: string
    appSubtitle: string
    appUrl?: string
    listingPerHome: number
    billTemplate?: string
    paymentTemplate?: string

    // Payment Configuration
    manualPaymentEnabled?: boolean
    qrisPaymentEnabled?: boolean
    manualPaymentDetails?: string;
    qrisStaticImage?: string;

    midtransEnabled?: boolean;
    midtransServerKey?: string;
    midtransClientKey?: string;
    midtransEnvironment?: 'sandbox' | 'production';

    // Notification Features
    reminderTemplate?: string;
    globalDueDay?: number;
    globalReminderInterval?: number;
    waEnabled?: boolean;
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
    billTemplate?: string
    paymentTemplate?: string

    // Payment Configuration
    manualPaymentEnabled?: boolean
    qrisPaymentEnabled?: boolean
    manualPaymentDetails?: string;
    qrisStaticImage?: string;

    midtransEnabled?: boolean;
    midtransServerKey?: string;
    midtransClientKey?: string;
    midtransEnvironment?: 'sandbox' | 'production';

    // Notification Features
    reminderTemplate?: string;
    globalDueDay?: number;
    globalReminderInterval?: number;
    waEnabled?: boolean;
    autoNotifyNewBill?: boolean;
    autoNotifyPaymentSuccess?: boolean;
    autoReminderEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    quietHoursWeekend?: boolean;
    reminderTime?: string;
    autoBillTime?: string;
}
