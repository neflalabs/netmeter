import cron from 'node-cron';
import { db } from './db';
import { users, bills, settings, payments } from '@netmeter/db';
import { eq, and, isNull } from 'drizzle-orm';
import { NotificationService, MONTH_NAMES, normalizeTime } from './services/notification';

/**
 * Generate monthly bills for all active users
 * Called automatically on the 1st of each month at 00:01
 */
async function generateMonthlyBills() {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-12
        const currentYear = today.getFullYear();

        console.log(`[Scheduler] Starting bill generation for ${currentMonth}/${currentYear}...`);

        // 1. Get Settings for Monthly Fee
        const appSettings = await db.select().from(settings).limit(1);
        const monthlyFee = appSettings.length > 0 ? appSettings[0].monthlyFee : 0;

        if (monthlyFee <= 0) {
            console.error('[Scheduler] Monthly fee not set, skipping bill generation');
            return;
        }

        // 2. Get All Active Users (not deleted)
        const activeUsers = await db.select().from(users).where(
            and(
                eq(users.status, 'ACTIVE'),
                isNull(users.deletedAt)
            )
        );

        if (activeUsers.length === 0) {
            console.log('[Scheduler] No active users found');
            return;
        }

        // 3. Fetch existing bills for this month
        const existingBills = await db.select()
            .from(bills)
            .where(and(
                eq(bills.month, currentMonth),
                eq(bills.year, currentYear)
            ));

        const existingUserIds = new Set(existingBills.map(b => b.userId));

        // 4. Filter users who don't have a bill yet
        const usersNeedingBills = activeUsers.filter(u => !existingUserIds.has(u.id));

        if (usersNeedingBills.length === 0) {
            console.log('[Scheduler] All active users already have bills for this month');
            return;
        }

        // 5. Batch insert all bills within a transaction
        await db.transaction(async (tx) => {
            const insertedBills = await tx.insert(bills).values(
                usersNeedingBills.map(user => ({
                    userId: user.id,
                    month: currentMonth,
                    year: currentYear,
                    amount: monthlyFee,
                    status: 'UNPAID' as const,
                    paymentToken: crypto.randomUUID(),
                }))
            ).returning();

            console.log(`[Scheduler] ✅ Generated ${insertedBills.length} bills successfully within transaction`);
        });

        // 6. Automatic notifications are now handled by sandAutoBills at a fixed time.
        console.log(`[Scheduler] ✅ Generated ${usersNeedingBills.length} bills successfully. Notifications will follow at the scheduled time.`);

    } catch (error) {
        console.error('[Scheduler] ❌ Error generating bills:', error);
    }
}

/**
 * Send automatic reminders for unpaid bills
 */
async function sendAutoReminders() {
    try {
        console.log('[Scheduler] Starting automatic reminders check...');

        // 1. Get Settings
        const appSettings = await db.select().from(settings).limit(1);
        if (appSettings.length === 0 || !appSettings[0].waEnabled || !appSettings[0].autoReminderEnabled) {
            console.log('[Scheduler] Auto-reminders disabled or settings missing');
            return;
        }

        const sets = appSettings[0];
        const today = new Date();
        const todayDay = today.getDate();

        // 2. Get all Unpaid Bills with Users
        const unpaidBills = await db.select({
            bill: bills,
            user: users
        })
            .from(bills)
            .innerJoin(users, eq(bills.userId, users.id))
            .where(
                and(
                    eq(bills.status, 'UNPAID'),
                    eq(users.status, 'ACTIVE'),
                    isNull(users.deletedAt),
                    eq(users.reminderEnabled, true)
                )
            );

        console.log(`[Scheduler] Found ${unpaidBills.length} unpaid bills for active users`);

        for (const item of unpaidBills) {
            const { bill, user } = item;

            // Logic for when to send
            const dueDay = user.dueDay || sets.globalDueDay || 10;
            const interval = user.reminderInterval || sets.globalReminderInterval || 3;

            // Simplified logic: Send if today is dueDay OR it's been a multiple of interval days after dueDay
            let shouldRemind = false;

            if (todayDay === dueDay) {
                shouldRemind = true;
            } else if (todayDay > dueDay) {
                if ((todayDay - dueDay) % interval === 0) {
                    shouldRemind = true;
                }
            } else {
                // todayDay < dueDay
                // Handle edge case: if today is EOM and dueDay is higher than EOM
                const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                if (todayDay === lastDayOfMonth && dueDay > lastDayOfMonth) {
                    shouldRemind = true;
                }
            }

            if (shouldRemind) {
                console.log(`[Scheduler] 🔔 Sending reminder to ${user.name} (Due: ${dueDay}, Interval: ${interval})`);
                await NotificationService.sendReminderNotification(bill, user, sets);
            }
        }

        console.log('[Scheduler] ✅ Automatic reminders check completed');
    } catch (error) {
        console.error('[Scheduler] ❌ Error in sendAutoReminders:', error);
    }
}

/**
 * Send automatic bill notifications for bills that haven't been notified yet
 */
async function sendAutoBills() {
    try {
        console.log('[Scheduler] Starting automatic bill notifications check...');

        const appSettings = await db.select().from(settings).limit(1);
        if (appSettings.length === 0 || !appSettings[0].waEnabled || !appSettings[0].autoNotifyNewBill) {
            return;
        }

        const sets = appSettings[0];

        // Find all Unpaid bills that have NO successful BILL log
        const billsToNotify = await db.select({
            bill: bills,
            user: users
        })
            .from(bills)
            .innerJoin(users, eq(bills.userId, users.id))
            .where(
                and(
                    eq(bills.status, 'UNPAID'),
                    eq(users.status, 'ACTIVE'),
                    isNull(users.deletedAt)
                )
            );

        for (const item of billsToNotify) {
            // sendBillNotification now includes hasAlreadySent check internally
            await NotificationService.sendBillNotification(item.bill, item.user, sets);
        }

        console.log('[Scheduler] ✅ Automatic bill notifications check completed');
    } catch (error) {
        console.error('[Scheduler] ❌ Error in sendAutoBills:', error);
    }
}

/**
 * Retries notifications that were held due to quiet hours
 */
async function retryHeldNotifications() {
    try {
        const appSettings = await db.select().from(settings).limit(1);
        if (appSettings.length === 0 || !appSettings[0].waEnabled) return;

        // If still in quiet hours, don't even try
        if (NotificationService.isWithinQuietHours(appSettings[0])) return;

        console.log('[Scheduler] Checking for held notifications to catch up...');

        // 1. Check for missing Receipts for PAID bills
        const paidBills = await db.select({
            bill: bills,
            user: users,
            payment: payments
        })
            .from(bills)
            .innerJoin(users, eq(bills.userId, users.id))
            .leftJoin(payments, eq(payments.billId, bills.id))
            .where(eq(bills.status, 'PAID'));

        for (const item of paidBills) {
            // sendReceiptNotification includes hasAlreadySent check internally
            const prettyMethod = item.payment
                ? NotificationService.getPrettyPaymentMethod(item.payment.method, item.payment.paymentType, item.payment.issuer)
                : undefined;

            await NotificationService.sendReceiptNotification(
                item.bill,
                item.user,
                appSettings[0],
                item.payment?.paidAt || undefined,
                item.payment?.amount || undefined,
                prettyMethod
            );
        }

        // 2. Check for missing Bills (already covered by sendAutoBills, but good to have)
        await sendAutoBills();

    } catch (error) {
        console.error('[Scheduler] ❌ Error in retryHeldNotifications:', error);
    }
}

/**
 * Start the bill generation scheduler
 * Runs at 00:01 on the 1st of every month (Asia/Jayapura timezone)
 */
export function startScheduler() {
    console.log('[Scheduler] Initializing scheduler...');

    // 1. Monthly Bill Gen (1st of month at 00:01)
    cron.schedule('1 0 1 * *', async () => {
        console.log('[Scheduler] Triggered: Monthly bill generation');
        await generateMonthlyBills();
    }, {
        timezone: 'Asia/Jayapura'
    });

    // 2. Daily Tasks (Check every minute for specific times)
    cron.schedule('* * * * *', async () => {
        try {
            const appSettings = await db.select().from(settings).limit(1);
            if (appSettings.length === 0) return;

            const sets = appSettings[0];
            const reminderTime = sets.reminderTime || '09:00';
            const autoBillTime = sets.autoBillTime || '09:00';

            // Get current time in Asia/Jayapura
            const now = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Jayapura',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(new Date());

            // Run Reminders
            if (normalizeTime(now) === normalizeTime(reminderTime)) {
                console.log(`[Scheduler] Triggered: Auto-reminders at ${now} (Normalized: ${normalizeTime(now)})`);
                await sendAutoReminders();
            }

            // Run Auto Bill Notifications
            if (normalizeTime(now) === normalizeTime(autoBillTime)) {
                console.log(`[Scheduler] Triggered: Auto-bill notifications at ${now} (Normalized: ${normalizeTime(now)})`);
                await sendAutoBills();
            }

            // Periodic catch-up for held notifications (run every 30 mins)
            const minutes = new Date().getMinutes();
            if (minutes % 30 === 0) {
                await retryHeldNotifications();
            }

        } catch (e) {
            console.error('[Scheduler] Cron Error:', e);
        }
    }, {
        timezone: 'Asia/Jayapura'
    });

    console.log('[Scheduler] ✅ Schedulers started (Monthly gen & Daily/Periodic tasks)');
}
