import { db } from '../db';
import { whatsappLogs } from '@netmeter/db';
import { eq, sql } from 'drizzle-orm';

export class WhatsappService {
    private baseUrl: string;
    private internalSecret: string;

    constructor() {
        // 'whatsapp' is the service name in docker-compose, resolved to its IP
        this.baseUrl = process.env.WHATSAPP_URL || 'http://whatsapp:3000/api/whatsapp';
        this.internalSecret = process.env.WHATSAPP_INTERNAL_SECRET || 'INTERNAL_PSK_SECRET';
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.internalSecret}`,
            'Content-Type': 'application/json'
        };
    }

    async getStatus() {
        try {
            const res = await fetch(`${this.baseUrl}/status`, {
                headers: this.getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch status');
            return await res.json();
        } catch (e) {
            console.error('WhatsApp Service Error:', e);
            return { status: 'DISCONNECTED', error: 'Service unreachable' };
        }
    }

    async login() {
        try {
            const res = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            if (!res.ok) throw new Error('Failed to login');
            return await res.json();
        } catch (e) {
            console.error('WhatsApp Service Error:', e);
            throw e;
        }
    }

    async logout() {
        try {
            const res = await fetch(`${this.baseUrl}/logout`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            if (!res.ok) throw new Error('Failed to logout');
            return await res.json();
        } catch (e) {
            console.error('WhatsApp Service Error:', e);
            throw e;
        }
    }

    async sendMessage(to: string, message: string, type: 'BILL' | 'RECEIPT' | 'REMINDER' | 'OTHER' = 'OTHER', userId?: number, billId?: number) {
        try {
            const res = await fetch(`${this.baseUrl}/send`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ phone: to, message }),
            });

            const result = await res.json();

            // Record log in database
            await db.insert(whatsappLogs).values({
                recipient: to,
                userId: userId || null,
                billId: billId || null,
                message: message,
                type: type,
                status: res.ok ? 'SENT' : 'FAILED',
                waMessageId: result.id || null
            });

            if (!res.ok) throw new Error(result.error || 'Failed to send message');
            return result;
        } catch (e) {
            console.error('WhatsApp Service Error:', e);
            throw e;
        }
    }

    async syncMessageStatuses() {
        try {
            // Find logs that are still in SENT or DELIVERED status and have a waMessageId
            const pendingLogs = await db.query.whatsappLogs.findMany({
                where: sql`${whatsappLogs.status} IN ('SENT', 'DELIVERED') AND ${whatsappLogs.waMessageId} IS NOT NULL`,
                limit: 20, // Process in batches
                orderBy: (logs, { desc }) => [desc(logs.createdAt)]
            });

            if (pendingLogs.length === 0) return { updated: 0 };

            let updatedCount = 0;
            for (const log of pendingLogs) {
                if (!log.waMessageId) continue;

                try {
                    const res = await fetch(`${this.baseUrl}/message/${log.waMessageId}/status`, {
                        headers: this.getHeaders()
                    });
                    if (res.ok) {
                        const { status } = await res.json();
                        // Possible statuses from wa-bot: SENT, DELIVERED, READ, UNKNOWN
                        if (status !== 'UNKNOWN' && status !== log.status) {
                            await db.update(whatsappLogs)
                                .set({ status: status as any })
                                .where(eq(whatsappLogs.id, log.id));
                            updatedCount++;
                        }
                    }
                } catch (err) {
                    console.error(`Status sync failed for msg ${log.waMessageId}:`, err);
                }
            }

            return { updated: updatedCount };
        } catch (e) {
            console.error('WhatsApp Sync Error:', e);
            throw e;
        }
    }
}

export const whatsappService = new WhatsappService();
