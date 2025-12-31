
import { Hono } from 'hono';
import { db } from '../db';
import { users, bills, settings, payments } from '@netmeter/db';
import { eq, and, isNull, ne, desc, or, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { idParamSchema, manualPaySchema, userIdQuerySchema, paginationSchema } from '@netmeter/shared';
import { whatsappService } from '../services/whatsapp';
import { NotificationService, MONTH_NAMES, formatDate } from '../services/notification';
import { z } from 'zod';

const app = new Hono();

const billsQuerySchema = paginationSchema.extend({
    userId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET / - List all bills
app.get('/', zValidator('query', billsQuerySchema), async (c) => {
    try {
        const { userId, page, limit } = c.req.valid('query');
        const offset = (page - 1) * limit;

        const whereClause = userId ? eq(bills.userId, userId) : undefined;

        // 1. Get total count
        const [totalCount] = await db.select({ count: sql<number>`count(*)` })
            .from(bills)
            .where(whereClause);

        // 2. Build paginated query
        let query = db.select({
            id: bills.id,
            month: bills.month,
            year: bills.year,
            amount: bills.amount,
            status: bills.status,
            userId: bills.userId,
            userName: users.name,
            whatsapp: users.whatsapp,
            createdAt: bills.createdAt,
            paymentToken: bills.paymentToken,
            paidAt: bills.paidAt,
            // Payment details
            paymentMethod: payments.method,
            paymentType: payments.paymentType,
            paymentIssuer: payments.issuer,
            gatewayStatus: payments.gatewayStatus,
            transactionId: payments.transactionId,
        })
            .from(bills)
            .innerJoin(users, eq(bills.userId, users.id))
            .leftJoin(payments, and(
                eq(bills.id, payments.billId),
                ne(payments.status, 'REJECTED')
            ))
            .$dynamic(); // Enable dynamic query building

        if (whereClause) {
            query = query.where(whereClause);
        }

        const allBills = await query
            .groupBy(bills.id)
            .orderBy(desc(bills.year), desc(bills.month))
            .limit(limit)
            .offset(offset);

        return c.json({
            data: allBills,
            pagination: {
                page,
                limit,
                total: totalCount.count,
                totalPages: Math.ceil(totalCount.count / limit)
            }
        });
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch bills' }, 500);
    }
});

// POST /generate - Generate bills for all active users
app.post('/generate', async (c) => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-12
        const currentYear = today.getFullYear();

        // 1. Get Settings for Monthly Fee
        const appSettings = await db.select().from(settings).limit(1);
        const monthlyFee = appSettings.length > 0 ? appSettings[0].monthlyFee : 0;

        // Validation: Check if monthly fee is set
        if (monthlyFee <= 0) {
            return c.json({ error: 'Harga langganan belum diatur. Silakan atur harga di menu Settings terlebih dahulu.' }, 400);
        }

        // 2. Get All Active Users (not deleted)
        const activeUsers = await db.select().from(users).where(
            and(
                eq(users.status, 'ACTIVE'),
                isNull(users.deletedAt)
            )
        );

        if (activeUsers.length === 0) {
            return c.json({ message: 'No active users found', generatedCount: 0 });
        }

        // 3. Fetch existing bills for this month in ONE query (eliminates N+1 problem)
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
            return c.json({
                message: 'All active users already have bills for this month',
                generatedCount: 0,
                month: currentMonth,
                year: currentYear
            });
        }

        // 5. Batch insert all bills within a transaction
        const result = await db.transaction(async (tx) => {
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

            return insertedBills.length;
        });

        // 6. Automatic notifications are now handled by the scheduler at a fixed time
        // so we don't send them here anymore.

        return c.json({
            message: 'Bills generated successfully',
            generatedCount: result,
            month: currentMonth,
            year: currentYear
        });

    } catch (e: any) {
        console.error(e);
        return c.json({ error: e.message || 'Failed to generate bills' }, 500);
    }
});

// PATCH /:id/pay - Mark bill as PAID
app.patch('/:id/pay', zValidator('param', idParamSchema), zValidator('json', manualPaySchema), async (c) => {
    try {
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');
        const paidAt = body.paidAt || new Date();
        const method = body.method || 'CASH'; // Default to CASH

        // 1. Get Bill & User Details
        const billData = await db.select({
            id: bills.id,
            amount: bills.amount,
            month: bills.month,
            year: bills.year,
            userId: bills.userId,
            paymentToken: bills.paymentToken,
            name: users.name,
            whatsapp: users.whatsapp,
        })
            .from(bills)
            .innerJoin(users, eq(bills.userId, users.id))
            .where(eq(bills.id, id))
            .limit(1);

        if (billData.length === 0) {
            return c.json({ error: 'Bill not found' }, 404);
        }

        const bill = billData[0];

        // 2. Mark any existing PENDING payments as REJECTED
        await db.update(payments).set({
            status: 'REJECTED' as const,
            gatewayStatus: 'cancelled_by_admin'
        }).where(
            and(
                eq(payments.billId, id),
                eq(payments.status, 'PENDING' as const)
            )
        );

        // 3. Record Payment
        await db.insert(payments).values({
            billId: id,
            amount: bill.amount,
            method: method,
            transactionId: `MANUAL-${id}-${Date.now()}`,
            paymentType: method.toLowerCase(),
            currency: 'IDR',
            gatewayStatus: 'manual',
            status: 'VERIFIED',
            paidAt: paidAt
        });

        // 3. Update Bill Status
        await db.update(bills)
            .set({
                status: 'PAID',
                paidAt: paidAt
            })
            .where(eq(bills.id, id));

        // 4. Send Automatic Receipt if enabled
        (async () => {
            try {
                let appSettings = await db.select().from(settings).limit(1);
                if (appSettings.length > 0 && appSettings[0].waEnabled && appSettings[0].autoNotifyPaymentSuccess) {
                    const prettyMethod = NotificationService.getPrettyPaymentMethod(method);
                    await NotificationService.sendReceiptNotification(bill, bill, appSettings[0], paidAt, bill.amount, prettyMethod);
                }
            } catch (err) {
                console.error('[Auto-Receipt-Manual] Failed:', err);
            }
        })().catch(e => console.error('[Auto-Receipt-Manual-Background] Error:', e));

        return c.json({ message: 'Bill marked as paid and payment recorded' });
    } catch (e: any) {
        console.error('Error in PATCH /:id/pay', e);
        return c.json({ error: e.message || 'Failed to update bill' }, 500);
    }
});


// POST /:id/notify - Send Bill Notification
app.post('/:id/notify', zValidator('param', idParamSchema), async (c) => {
    try {
        const { id } = c.req.valid('param');

        // 1. Get Bill & User Details
        const billData = await db.select({
            id: bills.id,
            userId: bills.userId,
            month: bills.month,
            year: bills.year,
            amount: bills.amount,
            name: users.name,
            whatsapp: users.whatsapp,
            createdAt: bills.createdAt,
            paymentToken: bills.paymentToken,
        })
            .from(bills)
            .innerJoin(users, eq(bills.userId, users.id))
            .where(eq(bills.id, id))
            .limit(1);

        if (billData.length === 0) {
            return c.json({ error: 'Bill not found' }, 404);
        }

        const bill = billData[0];

        // 2. Get Settings for Template
        // 2. Get Settings for Template
        let appSettings = await db.select().from(settings).limit(1);
        if (appSettings.length === 0) {
            appSettings = await db.insert(settings).values({}).returning();
        }

        const appUrl = appSettings[0].appUrl || 'https://net.home.npx.my.id';
        const template = appSettings[0].billTemplate || ''; // Should use DB default

        console.log(`[Bills] Attempting to send notification for bill ${id}`);
        console.log(`[Bills] waEnabled: ${appSettings[0].waEnabled}, User: ${bill.name}, Phone: ${bill.whatsapp}`);

        // 3. Send Notification
        const result = await NotificationService.sendBillNotification(bill, bill, appSettings[0], true);

        console.log(`[Bills] Notification result:`, result);

        if (result === null) {
            return c.json({
                error: 'WhatsApp notifications are disabled. Enable "Status Notifikasi Global" in Settings > Notification tab.'
            }, 400);
        }

        if (result === 'ALREADY_SENT') {
            return c.json({ error: 'Notifikasi tagihan ini sudah pernah dikirim.' }, 400);
        }

        if (result === 'HELD') {
            return c.json({
                message: 'Notifikasi ditahan karena di luar jam kerja (Quite Hours). Akan dikirim otomatis besok pagi.',
                status: 'HELD'
            });
        }

        return c.json({
            message: 'Notification sent successfully',
            details: { to: bill.whatsapp, content: result }
        });

    } catch (e: any) {
        console.error('[Bills] Error sending notification:', e);
        return c.json({ error: e.message || 'Failed to send notification' }, 500);
    }
});

// POST /:id/payment-notify - Send Payment Receipt Notification
app.post('/:id/payment-notify', zValidator('param', idParamSchema), async (c) => {
    try {
        const { id } = c.req.valid('param');

        // 1. Get Bill & Payment Details
        const billData = await db.select({
            id: bills.id,
            month: bills.month,
            year: bills.year,
            amount: bills.amount, // Bill amount
            status: bills.status,
            paidAt: bills.paidAt,
            name: users.name,
            whatsapp: users.whatsapp,
            paymentAmount: payments.amount,
            paymentPaidAt: payments.paidAt,
            paymentMethod: payments.method,
            paymentType: payments.paymentType,
            paymentIssuer: payments.issuer,
            paymentToken: bills.paymentToken,
            userId: bills.userId,
        })
            .from(bills)
            .innerJoin(users, eq(bills.userId, users.id))
            .leftJoin(payments, eq(payments.billId, bills.id))
            .where(eq(bills.id, id))
            .limit(1);

        if (billData.length === 0) {
            return c.json({ error: 'Bill not found' }, 404);
        }

        const data = billData[0];

        // Check if paid (either has payment record OR status is PAID)
        if (!data.paymentAmount && data.status !== 'PAID') {
            return c.json({ error: 'Bill has not been paid yet' }, 400);
        }

        // 2. Get Settings for Template
        // 2. Get Settings for Template
        let appSettings = await db.select().from(settings).limit(1);
        if (appSettings.length === 0) {
            appSettings = await db.insert(settings).values({}).returning();
        }

        const appUrl = appSettings[0].appUrl || 'https://net.home.npx.my.id';
        const template = appSettings[0].paymentTemplate || '';

        // 3. Send WhatsApp
        const amountToUse = data.paymentAmount || data.amount;
        const dateToUse = data.paymentPaidAt || data.paidAt || new Date();
        const prettyMethod = NotificationService.getPrettyPaymentMethod(
            data.paymentMethod || 'MANUAL',
            data.paymentType,
            data.paymentIssuer
        );
        const result = await NotificationService.sendReceiptNotification(data, data, appSettings[0], dateToUse, amountToUse, prettyMethod);

        if (result === 'ALREADY_SENT') {
            return c.json({ error: 'Notifikasi pembayaran ini sudah pernah dikirim.' }, 400);
        }

        if (result === 'HELD') {
            return c.json({
                message: 'Notifikasi ditahan karena di luar jam kerja (Quite Hours). Akan dikirim otomatis besok pagi.',
                status: 'HELD'
            });
        }

        return c.json({
            message: 'Payment notification sent successfully',
            details: { to: data.whatsapp, content: result }
        });

    } catch (e: any) {
        console.error('Error sending payment notification:', e);
        return c.json({ error: e.message || 'Failed to send notification' }, 500);
    }
});

export default app;
