
import { Hono } from 'hono';
import { db } from '../db';
import { users, bills, settings, payments } from '@netmeter/db';
import { eq, and, desc, ne } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { tokenParamSchema } from '@netmeter/shared';

const app = new Hono();

// GET /bills - List all PAID bills for public timeline
app.get('/bills', async (c) => {
    try {
        const paidBills = await db.select({
            id: bills.id,
            month: bills.month,
            year: bills.year,
            userName: users.name,
            amount: bills.amount,
            paidAt: bills.paidAt
        })
            .from(bills)
            .innerJoin(users, eq(bills.userId, users.id))
            .leftJoin(payments, and(eq(payments.billId, bills.id), ne(payments.status, 'REJECTED')))
            .where(eq(bills.status, 'PAID'))
            .groupBy(bills.id)
            .orderBy(desc(bills.paidAt));

        return c.json(paidBills);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch public bills' }, 500);
    }
});

// GET /:token - Get Bill Details by Token
app.get('/bills/:token', zValidator('param', tokenParamSchema), async (c) => {
    try {
        // 1. Find Bill by Token
        const rawToken = c.req.valid('param').token;
        const token = rawToken?.trim();

        if (!token) {
            return c.json({ error: 'Token is required' }, 400);
        }

        const billData = await db.select({
            id: bills.id,
            month: bills.month,
            year: bills.year,
            amount: bills.amount,
            status: bills.status,
            paidAt: bills.paidAt,
            userName: users.name, // Only show name, no phone
            paymentMethod: payments.method,
            paymentProof: payments.proofUrl,
            transactionId: payments.transactionId,
            paymentType: payments.paymentType,
            issuer: payments.issuer, // Bank name or wallet (e.g. bca, gopay)
            gatewayStatus: payments.gatewayStatus,
            paymentStatus: payments.status,
            currency: payments.currency,
            userId: bills.userId // For diagnostic logging
        })
            .from(bills)
            .leftJoin(users, eq(bills.userId, users.id)) // Use leftJoin to see if bill exists but user is missing
            .leftJoin(payments, and(
                eq(payments.billId, bills.id),
                ne(payments.status, 'REJECTED')
            ))
            .where(eq(bills.paymentToken, token))
            .orderBy(desc(payments.status))
            .limit(1);

        if (billData.length === 0) {
            console.warn(`[Public-Bill] Bill not found for token: "${token}" (original: "${rawToken}")`);
            return c.json({ error: 'Invoice not found' }, 404);
        }

        const bill = billData[0];

        if (!bill.userName) {
            console.error(`[Public-Bill] Bill ${bill.id} found but user ${bill.userId} is missing!`);
            return c.json({ error: 'Data integrity error: User not found for this bill.' }, 404);
        }

        // 2. Get Admin Info (Bank Details) for Transfer
        // For now hardcoded or fetched from settings notes? 
        // User agreed to use "Info Rekening (Admin)".
        // We will fetch App Settings to get Admin Phone for WhatsApp link.
        const appSettings = await db.select().from(settings).limit(1);
        const adminPhone = appSettings.length > 0 ? appSettings[0].adminPhoneNumber : '';
        const bankDetails = appSettings.length > 0 ? appSettings[0].manualPaymentDetails : '';

        return c.json({
            ...bill,
            adminPhone, // For Confirm via WA button
            bankDetails: bankDetails || ''
        });

    } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch invoice' }, 500);
    }
});

// GET /settings - Get public app settings
app.get('/settings', async (c) => {
    try {
        const storedSettings = await db.select({
            appTitle: settings.appTitle,
            appSubtitle: settings.appSubtitle,
            adminPhoneNumber: settings.adminPhoneNumber,
            listingPerHome: settings.listingPerHome,
            manualPaymentEnabled: settings.manualPaymentEnabled,
            qrisPaymentEnabled: settings.qrisPaymentEnabled,
            manualPaymentDetails: settings.manualPaymentDetails,
            qrisStaticImage: settings.qrisStaticImage,

            // Midtrans Public Config
            midtransEnabled: settings.midtransEnabled,
            midtransClientKey: settings.midtransClientKey,
            midtransEnvironment: settings.midtransEnvironment
        }).from(settings).limit(1);

        if (storedSettings.length === 0) {
            const newSettings = await db.insert(settings).values({}).returning();
            return c.json(newSettings[0]);
        }
        return c.json(storedSettings[0]);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch public settings' }, 500);
    }
});

export default app;
