
import { Hono } from 'hono';
import { PaymentService } from '../services/payment';
import { db } from '../db';
import { bills, users } from '@netmeter/db';
import { eq } from 'drizzle-orm';

const app = new Hono();

// Create Snap Token
app.post('/snap/:billId', async (c) => {
    try {
        const billId = parseInt(c.req.param('billId'));
        if (isNaN(billId)) return c.json({ error: 'Invalid Bill ID' }, 400);

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

// Cancel/Reset Transaction
app.post('/cancel/:billId', async (c) => {
    try {
        const billId = parseInt(c.req.param('billId'));
        if (isNaN(billId)) return c.json({ error: 'Invalid Bill ID' }, 400);

        const result = await PaymentService.cancelTransaction(billId);
        return c.json(result);
    } catch (e: any) {
        console.error(e);
        return c.json({ error: e.message || 'Failed to cancel transaction' }, 500);
    }
});

// Midtrans Webhook
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

export default app;
