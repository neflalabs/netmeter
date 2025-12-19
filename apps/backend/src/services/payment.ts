import { db } from '../db';
import { settings, bills, payments, users } from '@netmeter/db';
import { eq, and } from 'drizzle-orm';
import { whatsappService } from './whatsapp';
import { NotificationService, MONTH_NAMES } from './notification';

export class PaymentService {
    private static async getSettings() {
        const stored = await db.select().from(settings).limit(1);
        if (!stored.length) throw new Error('Settings not initialized');
        return stored[0];
    }

    static async cancelTransaction(billId: number) {
        const config = await this.getSettings();

        // 1. Find the pending "external" transaction ID to cancel on Midtrans
        const pendingPayment = await db.query.payments.findFirst({
            where: and(
                eq(payments.billId, billId),
                eq(payments.status, 'PENDING' as const),
                eq(payments.method, 'MIDTRANS')
            ),
            orderBy: (payments, { desc }) => [desc(payments.id)]
        });

        if (pendingPayment && pendingPayment.externalId && config.midtransServerKey) {
            try {
                const authString = btoa(config.midtransServerKey + ':');
                const isProduction = config.midtransEnvironment === 'production';
                const cancelUrl = isProduction
                    ? `https://api.midtrans.com/v2/${pendingPayment.externalId}/cancel`
                    : `https://api.sandbox.midtrans.com/v2/${pendingPayment.externalId}/cancel`;

                await fetch(cancelUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${authString}`
                    }
                });
                console.log(`Midtrans Cancelled: ${pendingPayment.externalId}`);
            } catch (err) {
                console.error('Failed to cancel Midtrans transaction:', err);
                // We continue even if cancel fails, so user can at least retry locally
            }
        }

        // 2. Clear Snap Token to force fresh one next time
        await db.update(bills).set({
            snapToken: null,
            snapTokenExpiry: null
        }).where(eq(bills.id, billId));

        // 3. Mark any PENDING payments as REJECTED so they don't block logic
        await db.update(payments).set({
            status: 'REJECTED' as const,
            gatewayStatus: 'cancelled_by_user'
        }).where(
            and(
                eq(payments.billId, billId),
                eq(payments.status, 'PENDING' as const)
            )
        );

        return { success: true };
    }

    static async createSnapTransaction(billId: number, user: any) {
        const config = await this.getSettings();

        if (!config.midtransEnabled || !config.midtransServerKey) {
            throw new Error('Midtrans payment is disabled or not configured');
        }

        const bill = await db.query.bills.findFirst({
            where: eq(bills.id, billId)
        });

        if (!bill) throw new Error('Bill not found');
        if (bill.status === 'PAID') throw new Error('Bill already paid');

        // Check if we have a cached valid token
        const now = new Date();
        const currentEnv = config.midtransEnvironment;

        if (bill.snapToken && bill.snapTokenExpiry) {
            const expiry = new Date(bill.snapTokenExpiry);

            // Extract environment info from previous token if possible or just rely on expiry
            // BUT, to be safe against env changes, we should probably encode env in orderId or just reset it.
            // Simplified: if we have a token, we check if Midtrans would accept it.
            // Actually, a better way is to store the environment used to generate the token.
            // For now, let's just make sure we don't reuse if environment changed.
            // Since we don't store env in DB yet, we'll clearing it in settings.ts is more robust.
            // But we can also check if the snapToken URL would match.

            if (expiry > now && bill.snapAmount === bill.amount) {
                // Token is still valid and amount matches, reuse it
                return {
                    token: bill.snapToken,
                    redirect_url: `https://app.${currentEnv === 'production' ? '' : 'sandbox.'}midtrans.com/snap/v2/vtweb/${bill.snapToken}`,
                    orderId: `BILL-${billId}` // Standard format
                };
            }
        }

        // Generate new token
        const orderId = `BILL-${billId}-${Date.now()}`;
        const grossAmount = bill.amount;

        const authString = btoa(config.midtransServerKey + ':');
        const isProduction = config.midtransEnvironment === 'production';
        const baseUrl = isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        const payload = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount
            },
            customer_details: {
                first_name: user.name,
                phone: user.whatsapp || user.phoneNumber || '', // Fallback
            },
            item_details: [
                {
                    id: `BILL-${billId}`,
                    price: grossAmount,
                    quantity: 1,
                    name: `WiFi ${bill.month}/${bill.year}`
                }
            ]
        };

        const response = await fetch(baseUrl, {
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
            console.error('Midtrans Error:', err);
            throw new Error('Failed to create Snap transaction');
        }

        const data = await response.json();

        // Cache the token (expires in 24 hours)
        const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await db.update(bills).set({
            snapToken: data.token,
            snapTokenExpiry: tokenExpiry,
            snapAmount: grossAmount
        }).where(eq(bills.id, billId));

        return {
            token: data.token,
            redirect_url: data.redirect_url,
            orderId
        };
    }

    static async verifySignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string) {
        const config = await this.getSettings();
        if (!config.midtransServerKey) return false;

        const data = orderId + statusCode + grossAmount + config.midtransServerKey;
        const hasher = new Bun.CryptoHasher('sha512');
        hasher.update(data);
        const expectedSignature = hasher.digest('hex');

        return signatureKey === expectedSignature;
    }

    static async handleNotification(notification: any) {
        const { order_id, transaction_status, fraud_status, signature_key, status_code, gross_amount } = notification;

        // Extract Bill ID from Order ID (BILL-{id}-{timestamp})
        const parts = order_id.split('-');
        if (parts.length < 3) return false; // Invalid format
        const billId = parseInt(parts[1]);

        if (isNaN(billId)) return false;

        // Verify Signature
        const isValid = await this.verifySignature(order_id, status_code, gross_amount, signature_key);
        if (!isValid) {
            console.error('Invalid Midtrans Signature');
            return false;
        }

        let isPaid = false;
        let pStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' = 'PENDING';

        if (transaction_status == 'capture') {
            if (fraud_status == 'challenge') {
                pStatus = 'PENDING';
            } else if (fraud_status == 'accept') {
                isPaid = true;
                pStatus = 'VERIFIED';
            }
        } else if (transaction_status == 'settlement') {
            isPaid = true;
            pStatus = 'VERIFIED';
        } else if (transaction_status == 'cancel' || transaction_status == 'deny' || transaction_status == 'expire') {
            pStatus = 'REJECTED';
            // Reset Snap Token so user can retry with a fresh one
            await db.update(bills).set({
                snapToken: null,
                snapTokenExpiry: null
            }).where(eq(bills.id, billId));
        } else if (transaction_status == 'pending') {
            pStatus = 'PENDING';
        }

        // 1. Update Bill status if PAID
        if (isPaid) {
            const bill = await db.query.bills.findFirst({
                where: eq(bills.id, billId)
            });

            if (bill && bill.status !== 'PAID') {
                await db.update(bills).set({
                    status: 'PAID',
                    paidAt: new Date()
                }).where(eq(bills.id, billId));
            }
        }

        const paymentData = {
            billId: billId,
            amount: parseInt(gross_amount),
            method: 'MIDTRANS',
            transactionId: notification.transaction_id,
            paymentType: notification.payment_type,
            issuer: notification.bank || notification.issuer || notification.acquirer || (notification.va_numbers?.[0]?.bank),
            gatewayStatus: transaction_status,
            currency: notification.currency || 'IDR',
            rawResponse: JSON.stringify(notification),
            externalId: order_id,
            status: pStatus,
            paidAt: isPaid ? new Date() : null
        };

        // 2. Upsert Payment Record using transactionId
        await db.insert(payments)
            .values(paymentData)
            .onConflictDoUpdate({
                target: payments.transactionId,
                set: paymentData
            });

        // 3. Send Automatic Receipt Notification if LUNAS
        const finalConfig = await this.getSettings();
        if (isPaid && finalConfig.waEnabled && finalConfig.autoNotifyPaymentSuccess) {
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
                    const user = bill; // They are joined now

                    if (bill && user) {
                        const prettyMethod = NotificationService.getPrettyPaymentMethod(paymentData.method, paymentData.paymentType, paymentData.issuer);
                        await NotificationService.sendReceiptNotification(bill, user, finalConfig, paymentData.paidAt || undefined, paymentData.amount, prettyMethod);
                    }
                } catch (err) {
                    console.error('[Auto-Receipt] Failed:', err);
                }
            })().catch(e => console.error('[Auto-Receipt-Background] Error:', e));
        }

        return true;
    }
}
