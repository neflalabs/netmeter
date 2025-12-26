
import { Hono } from 'hono';
import { PaymentService } from '../services/payment';
import { XenditService } from '../services/xendit.service';
import { db } from '../db';
import { bills, users } from '@netmeter/db';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { idParamSchema } from '@netmeter/shared';

const app = new Hono();

// --- MIDTRANS ---

// Create Snap Token
app.post('/snap/:id', zValidator('param', idParamSchema), async (c) => {
    try {
        const { id: billId } = c.req.valid('param');

        // Fetch user data for customer details
        const bill = await db.query.bills.findFirst({
            where: eq(bills.id, billId),
        });

        // If relation check fails, fetch manually
        let user: any;
        if (bill && (bill as any).user) {
            user = (bill as any).user;
        } else if (bill) {
            const u = await db.select().from(users).where(eq(users.id, bill.userId));
            user = u[0];
        }

        if (!bill || !user) return c.json({ error: 'Bill or User not found' }, 404);

        const result = await PaymentService.createSnapTransaction(billId, user);
        return c.json(result);
    } catch (e: any) {
        console.error(e);
        return c.json({ error: e.message || 'Failed to create transaction' }, 500);
    }
});

// Midtrans Webhook (LEGACY)
app.post('/notification', async (c) => {
    try {
        const notification = await c.req.json();
        await PaymentService.handleNotification(notification);
        return c.json({ status: 'ok' });
    } catch (e) {
        console.error('Webhook Error:', e);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// Midtrans Webhook (NEW STANDARDIZED)
app.post('/midtrans/webhook', async (c) => {
    try {
        const notification = await c.req.json();
        await PaymentService.handleNotification(notification);
        return c.json({ status: 'ok' });
    } catch (e) {
        console.error('Midtrans Webhook Error:', e);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// --- XENDIT ---

// Create Xendit Invoice
app.post('/xendit/invoice/:id', zValidator('param', idParamSchema), async (c) => {
    try {
        const { id: billId } = c.req.valid('param');

        const bill = await db.query.bills.findFirst({
            where: eq(bills.id, billId),
        });

        let user: any;
        if (bill) {
            const u = await db.select().from(users).where(eq(users.id, bill.userId));
            user = u[0];
        }

        if (!bill || !user) return c.json({ error: 'Bill or User not found' }, 404);

        const result = await XenditService.createInvoice(billId, user);
        return c.json(result);
    } catch (e: any) {
        console.error(e);
        return c.json({ error: e.message || 'Failed to create Xendit invoice' }, 500);
    }
});

// Xendit Webhook
app.post('/xendit/webhook', async (c) => {
    try {
        const payload = await c.req.json();
        const callbackToken = c.req.header('x-callback-token');

        await XenditService.handleWebhook(payload, callbackToken);
        return c.json({ status: 'ok' });
    } catch (e) {
        console.error('Xendit Webhook Error:', e);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// --- COMMON ---

// Cancel/Reset Transaction (Midtrans only for now)
app.post('/cancel/:id', zValidator('param', idParamSchema), async (c) => {
    try {
        const { id: billId } = c.req.valid('param');

        const result = await PaymentService.cancelTransaction(billId);
        return c.json(result);
    } catch (e: any) {
        console.error(e);
        return c.json({ error: e.message || 'Failed to cancel transaction' }, 500);
    }
});

export default app;
