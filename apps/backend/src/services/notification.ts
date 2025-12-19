import { db } from '../db';
import { whatsappService } from './whatsapp';
import { whatsappLogs } from '@netmeter/db';
import { and, eq, sql } from 'drizzle-orm';

export const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatDate(date: Date | string | null): string {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(d);
}

/**
 * Normalizes a time string (e.g., "09:00", "9:00", "09:00 AM") into "HH:mm" 24h format.
 * Also handles potential Unicode/non-standard spaces from Intl.DateTimeFormat.
 */
export function normalizeTime(timeStr: string | null | undefined): string {
    if (!timeStr) return '00:00';

    // Remove any non-digit/non-colon characters (like spaces, AM/PM, or Unicode junk)
    // but keep a way to detect AM/PM if present
    const isPM = timeStr.toUpperCase().includes('PM');
    const isAM = timeStr.toUpperCase().includes('AM');

    const clean = timeStr.replace(/[^\d:]/g, '');
    const parts = clean.split(':');
    if (parts.length < 2) return '00:00';

    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export class NotificationService {
    /**
     * Processes a template with variables and replaces them with actual data.
     */
    static processTemplate(template: string, data: {
        name?: string,
        month?: string,
        year?: string,
        amount?: string,
        date?: string,
        day?: string,
        link?: string,
        method?: string
    }) {
        let message = template;
        if (data.name) message = message.replace(/{name}/g, data.name);
        if (data.month) message = message.replace(/{month}/g, data.month);
        if (data.year) message = message.replace(/{year}/g, data.year);
        if (data.amount) message = message.replace(/{amount}/g, data.amount);
        if (data.date) message = message.replace(/{date}/g, data.date);
        if (data.day) message = message.replace(/{day}/g, data.day);
        if (data.link) message = message.replace(/{link}/g, data.link);
        if (data.method) message = message.replace(/{method}/g, data.method);

        // Add support for manual line breaks
        message = message.replace(/{br}/g, '\n');

        return message;
    }

    /**
     * Checks if current time (in Asia/Jayapura) is within quiet hours.
     */
    static isWithinQuietHours(appSettings: any): boolean {
        if (!appSettings.quietHoursStart || !appSettings.quietHoursEnd) return false;

        // Get current time in Asia/Jayapura
        const nowFormatted = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Jayapura',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(new Date());

        const nowStr = normalizeTime(nowFormatted);
        const start = normalizeTime(appSettings.quietHoursStart); // e.g. "21:00"
        const end = normalizeTime(appSettings.quietHoursEnd);     // e.g. "08:00"

        if (start < end) {
            // e.g. 02:00 to 06:00
            return nowStr >= start && nowStr <= end;
        } else {
            // e.g. 21:00 to 08:00 (crosses midnight)
            return nowStr >= start || nowStr <= end;
        }
    }

    /**
     * Checks if a specific notification type has already been sent for a bill.
     */
    static async hasAlreadySent(type: 'BILL' | 'RECEIPT' | 'REMINDER', billId: number): Promise<boolean> {
        const logs = await db.select()
            .from(whatsappLogs)
            .where(and(
                eq(whatsappLogs.type, type),
                eq(whatsappLogs.billId, billId),
                sql`${whatsappLogs.status} IN ('SENT', 'DELIVERED', 'READ')`
            ))
            .limit(1);

        return logs.length > 0;
    }

    /**
     * Sends a bill notification to a user based on app settings.
     */
    static async sendBillNotification(bill: any, user: any, appSettings: any, isManual = false) {
        if (!appSettings.waEnabled || (!appSettings.autoNotifyNewBill && !isManual)) {
            return null;
        }

        // Apply rate limiting for automatic sends
        if (!isManual) {
            const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
            console.log(`[Notification] Rate limiting: waiting ${delay}ms before sending BILL to ${user.name}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 1. Check for Duplicate
        if (await this.hasAlreadySent('BILL', bill.id)) {
            console.log(`[Notification] Duplicate BILL skipped for bill ${bill.id}`);
            return 'ALREADY_SENT';
        }

        // 2. Check for Quiet Hours
        if (this.isWithinQuietHours(appSettings)) {
            console.log(`[Notification] BILL held for bill ${bill.id} due to quiet hours`);
            return 'HELD';
        }

        const appUrl = appSettings.appUrl || '';
        const template = appSettings.billTemplate || '';

        const formattedAmount = new Intl.NumberFormat('id-ID').format(bill.amount);
        const monthName = MONTH_NAMES[bill.month - 1] || String(bill.month);
        const createdAt = bill.createdAt || new Date();
        const formattedDate = formatDate(createdAt);
        const dayOnly = new Date(createdAt).getDate();

        const message = this.processTemplate(template, {
            name: user.name,
            month: monthName,
            year: String(bill.year),
            amount: formattedAmount,
            date: formattedDate,
            day: String(dayOnly),
            link: `${appUrl.replace(/\/$/, '')}/pay/${bill.paymentToken || ''}`
        });

        try {
            await whatsappService.sendMessage(user.whatsapp, message, 'BILL', user.id, bill.id);
            console.log(`[Notification] Sent bill for ${user.name}`);
            return message;
        } catch (e) {
            console.error(`[Notification] Failed to send to ${user.name}:`, e);
            throw e;
        }
    }

    /**
     * Maps technical payment types to human-readable names.
     */
    static getPrettyPaymentMethod(method: string, paymentType?: string | null, issuer?: string | null): string {
        if (method !== 'MIDTRANS') {
            // Map CASH/MANUAL_TRANSFER to something nicer if needed
            if (method === 'CASH') return 'Tunai';
            if (method === 'MANUAL_TRANSFER') return 'Transfer Manual';
            return method;
        }

        const type = paymentType?.toLowerCase();
        const issuerName = issuer?.toUpperCase();

        if (type === 'gopay') return 'GoPay';
        if (type === 'shopeepay') return 'ShopeePay';
        if (type === 'qris') return 'QRIS';
        if (type === 'bank_transfer') return `Transfer Bank (${issuerName || 'ATM'})`;
        if (type === 'credit_card') return 'Kartu Kredit';
        if (type === 'cstore') return `Gerai Retail (${issuerName || 'Indomaret/Alfamart'})`;
        if (type === 'echannel' || type === 'billpayment') return `Transfer Bank Mandiri/E-Channel`;

        return `Midtrans (${type || 'Otomatis'})`;
    }

    /**
     * Sends a receipt notification (payment success) to a user.
     */
    static async sendReceiptNotification(bill: any, user: any, appSettings: any, paymentDate?: Date, paymentAmount?: number, paymentMethod?: string, isManual = false) {
        if (!appSettings.waEnabled || (!appSettings.autoNotifyPaymentSuccess && !isManual)) {
            return null;
        }

        // Apply rate limiting for automatic sends
        if (!isManual) {
            const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
            console.log(`[Notification] Rate limiting: waiting ${delay}ms before sending RECEIPT to ${user.name || user.userName}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 1. Check for Duplicate (Optional for receipts, but user asked for maximal 1 notification)
        if (await this.hasAlreadySent('RECEIPT', bill.id)) {
            console.log(`[Notification] Duplicate RECEIPT skipped for bill ${bill.id}`);
            return 'ALREADY_SENT';
        }

        // 2. Check for Quiet Hours
        if (this.isWithinQuietHours(appSettings)) {
            console.log(`[Notification] RECEIPT held for bill ${bill.id} due to quiet hours`);
            return 'HELD';
        }

        const appUrl = appSettings.appUrl || '';
        const template = appSettings.paymentTemplate || '';

        const amountToUse = paymentAmount || bill.amount;
        const dateToUse = paymentDate || bill.paidAt || new Date();

        const formattedAmount = new Intl.NumberFormat('id-ID').format(amountToUse);
        const monthName = MONTH_NAMES[bill.month - 1] || String(bill.month);
        const formattedDate = formatDate(dateToUse);
        const dayOnly = new Date(dateToUse).getDate();

        const message = this.processTemplate(template, {
            name: user.name || user.userName,
            month: monthName,
            year: String(bill.year),
            amount: formattedAmount,
            date: formattedDate,
            day: String(dayOnly),
            link: `${appUrl.replace(/\/$/, '')}/pay/${bill.paymentToken || ''}`,
            method: paymentMethod
        });

        try {
            await whatsappService.sendMessage(user.whatsapp, message, 'RECEIPT', user.id || user.userId, bill.id || bill.billId);
            console.log(`[Notification] Sent receipt for ${user.name || user.userName}`);
            return message;
        } catch (e) {
            console.error(`[Notification] Failed to send receipt to ${user.name || user.userName}:`, e);
            throw e;
        }
    }

    /**
     * Sends a reminder notification for an unpaid bill.
     */
    static async sendReminderNotification(bill: any, user: any, appSettings: any) {
        if (!appSettings.waEnabled || !appSettings.autoReminderEnabled) {
            return null;
        }

        // Apply rate limiting for reminders (always automatic in this context)
        const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
        console.log(`[Notification] Rate limiting: waiting ${delay}ms before sending REMINDER to ${user.name || user.userName}`);
        await new Promise(resolve => setTimeout(resolve, delay));

        const appUrl = appSettings.appUrl || '';
        const template = appSettings.reminderTemplate || '';

        const formattedAmount = new Intl.NumberFormat('id-ID').format(bill.amount);
        const monthName = MONTH_NAMES[bill.month - 1] || String(bill.month);
        const createdAt = bill.createdAt || new Date();
        const formattedDate = formatDate(createdAt);
        const dayOnly = new Date(createdAt).getDate();

        const message = this.processTemplate(template, {
            name: user.name || user.userName,
            month: monthName,
            year: String(bill.year),
            amount: formattedAmount,
            date: formattedDate,
            day: String(dayOnly),
            link: `${appUrl.replace(/\/$/, '')}/pay/${bill.paymentToken || ''}`
        });

        try {
            await whatsappService.sendMessage(user.whatsapp, message, 'REMINDER', user.id || user.userId, bill.id);
            console.log(`[Notification] Sent reminder for ${user.name || user.userName}`);
            return message;
        } catch (e) {
            console.error(`[Notification] Failed to send reminder to ${user.name || user.userName}:`, e);
            throw e;
        }
    }
}
