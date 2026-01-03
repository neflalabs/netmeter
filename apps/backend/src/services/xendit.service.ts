import { db } from '../db';
import { settings, bills, payments, users } from '@netmeter/db';
import { eq, and } from 'drizzle-orm';
import { NotificationService } from './notification';

export class XenditService {
    private static async getSettings() {
        const stored = await db.select().from(settings).limit(1);
        if (!stored.length) throw new Error('Settings not initialized');
        return stored[0];
    }

    static async createInvoice(billId: number, user: any) {
        const config = await this.getSettings();

        if (!config.xenditEnabled || !config.xenditSecretKey) {
            throw new Error('Xendit payment is disabled or not configured');
        }

        const bill = await db.query.bills.findFirst({
            where: eq(bills.id, billId)
        });

        if (!bill) throw new Error('Bill not found');
        if (bill.status === 'PAID') throw new Error('Bill already paid');

        // 1. Accumulate all UNPAID bills for this user
        const unpaidBills = await db.select().from(bills).where(
            and(
                eq(bills.userId, bill.userId),
                eq(bills.status, 'UNPAID')
            )
        ).orderBy(bills.year, bills.month);

        const totalAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

        // Generate Description
        const months = unpaidBills.map(b => `${b.month}/${b.year.toString().slice(-2)}`).join(', ');
        const description = `Pembayaran WiFi ${months}`;

        const externalId = `BILL-${billId}-${Date.now()}`;
        const authString = btoa(config.xenditSecretKey + ':');

        const payload = {
            external_id: externalId,
            amount: totalAmount,
            description: description,
            customer: {
                given_names: user.name,
                mobile_number: user.whatsapp || undefined,
            },
            success_redirect_url: `${config.appUrl}/pay/${bill.paymentToken}`,
            failure_redirect_url: `${config.appUrl}/pay/${bill.paymentToken}`,
            currency: 'IDR',
            reminder_time: 1,
        };

        const response = await fetch('https://api.xendit.co/v2/invoices', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authString}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Xendit Error:', err);
            throw new Error('Failed to create Xendit invoice');
        }

        const data = await response.json();

        return {
            invoice_url: data.invoice_url,
            external_id: externalId
        };
    }

    static async handleWebhook(payload: any, callbackToken?: string) {
        const config = await this.getSettings();

        // 1. Verify Callback Token if configured
        if (config.xenditVerificationToken && callbackToken !== config.xenditVerificationToken) {
            console.error('Invalid Xendit Callback Token');
            return false;
        }

        const { external_id, status, amount, payment_method, payment_channel, id: xenditId } = payload;

        // Extract Bill ID from External ID (BILL-{id}-{timestamp})
        const parts = external_id.split('-');
        if (parts.length < 3) return false;
        const billId = parseInt(parts[1]);
        if (isNaN(billId)) return false;

        let isPaid = false;
        let pStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' = 'PENDING';

        if (status === 'PAID' || status === 'SETTLED') {
            isPaid = true;
            pStatus = 'VERIFIED';
        } else if (status === 'EXPIRED') {
            pStatus = 'REJECTED';
        }

        // 1. Update Bill status if PAID
        if (isPaid) {
            const primaryBill = await db.query.bills.findFirst({
                where: eq(bills.id, billId)
            });

            if (primaryBill) {
                // Mark ALL unpaid bills for this user as PAID
                await db.update(bills).set({
                    status: 'PAID',
                    paidAt: new Date()
                }).where(and(
                    eq(bills.userId, primaryBill.userId),
                    eq(bills.status, 'UNPAID')
                ));
            }
        }


        const paymentData = {
            billId: billId,
            amount: amount,
            method: 'XENDIT',
            transactionId: xenditId,
            paymentType: payment_method,
            issuer: payment_channel,
            gatewayStatus: status,
            currency: 'IDR',
            rawResponse: JSON.stringify(payload),
            externalId: external_id,
            status: pStatus,
            paidAt: isPaid ? new Date() : null
        };

        // 2. Upsert Payment Record
        await db.insert(payments)
            .values(paymentData)
            .onConflictDoUpdate({
                target: payments.transactionId,
                set: paymentData
            });

        // 3. Send Notification if PAID
        if (isPaid && config.waEnabled && config.autoNotifyPaymentSuccess) {
            (async () => {
                try {
                    const billData = await db.select({
                        id: bills.id,
                        userId: bills.userId,
                        month: bills.month,
                        year: bills.year,
                        amount: bills.amount,
                        paymentToken: bills.paymentToken,
                        name: users.name,
                        whatsapp: users.whatsapp,
                    })
                        .from(bills)
                        .innerJoin(users, eq(bills.userId, users.id))
                        .where(eq(bills.id, billId))
                        .limit(1);

                    const bill = billData[0];
                    if (bill) {
                        const prettyMethod = `Xendit (${payment_channel || payment_method})`;
                        await NotificationService.sendReceiptNotification(bill, bill, config, paymentData.paidAt || undefined, amount, prettyMethod);
                    }
                } catch (err) {
                    console.error('[Xendit-Auto-Receipt] Failed:', err);
                }
            })().catch(e => console.error('[Xendit-Auto-Receipt-Background] Error:', e));
        }

        return true;
    }
}
