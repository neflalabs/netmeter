import { db } from '../db';
import { whatsappLogs, settings } from '@netmeter/db';
import { eq, sql } from 'drizzle-orm';

export class WhatsappService {
    private async getConfig() {
        const stored = await db.select().from(settings).limit(1);
        const config = stored[0] || {} as any;

        return {
            baseUrl: config.waServiceUrl || Bun.env.WA_SERVICE_URL || 'http://localhost:3030/api/v1',
            apiKey: config.waApiKey || Bun.env.WA_API_KEY || '',
            instanceId: config.waInstanceId || 'main'
        };
    }

    private getHeaders(apiKey: string) {
        return {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
        };
    }

    async getStatus() {
        try {
            const { baseUrl, apiKey, instanceId } = await this.getConfig();
            const res = await fetch(`${baseUrl}/instances/${instanceId}/status`, {
                headers: this.getHeaders(apiKey)
            });
            if (!res.ok) throw new Error('Failed to fetch status');
            const data = await res.json();

            // Map Wainthego status to internal status
            // Wainthego can return uppercase or lowercase
            const status = data.status?.toLowerCase();

            let internalStatus = 'DISCONNECTED';
            if (status === 'connected') {
                internalStatus = 'CONNECTED';
            } else if (status === 'scanning') {
                internalStatus = 'SCANNING';
            } else if (status === 'initializing') {
                internalStatus = 'DISCONNECTED'; // Treat as disconnected
            }

            return {
                status: internalStatus,
                user: data.user || null
            };
        } catch (e) {
            console.error('WhatsApp Service Error:', e);
            return { status: 'DISCONNECTED', error: 'Service unreachable' };
        }
    }

    async login() {
        try {
            const { baseUrl, apiKey, instanceId } = await this.getConfig();
            const res = await fetch(`${baseUrl}/instances/${instanceId}/link`, {
                method: 'POST',
                headers: this.getHeaders(apiKey)
            });
            if (!res.ok) throw new Error('Failed to login (link)');
            const data = await res.json();

            // Wainthego returns { status: "SCANNING" (uppercase in spec), qr: "data:image/png;base64,..." }
            // Map status to internal format
            return {
                status: data.status === 'SCANNING' ? 'SCANNING' : 'CONNECTED',
                qr: data.qr || null
            };
        } catch (e) {
            console.error('WhatsApp Service Error:', e);
            throw e;
        }
    }

    async logout() {
        try {
            const { baseUrl, apiKey, instanceId } = await this.getConfig();
            const res = await fetch(`${baseUrl}/instances/${instanceId}/unlink`, {
                method: 'POST',
                headers: this.getHeaders(apiKey)
            });
            if (!res.ok) throw new Error('Failed to logout (unlink)');
            return await res.json();
        } catch (e) {
            console.error('WhatsApp Service Error:', e);
            throw e;
        }
    }

    async sendMessage(to: string, message: string, type: 'BILL' | 'RECEIPT' | 'REMINDER' | 'OTHER' = 'OTHER', userId?: number, billId?: number) {
        try {
            const { baseUrl, apiKey, instanceId } = await this.getConfig();

            console.log(`[WhatsApp] Sending message to ${to}`);
            console.log(`[WhatsApp] Config - URL: ${baseUrl}, Instance: ${instanceId}, API Key: ${apiKey ? 'SET' : 'MISSING'}`);

            // Sanitize number for Wainthego
            let phone = to.replace(/\D/g, '');
            if (phone.startsWith('08')) phone = '628' + phone.substring(2);
            if (!phone.startsWith('62')) phone = '62' + phone;

            console.log(`[WhatsApp] Sanitized phone: ${phone}`);

            const payload = {
                phone,
                message,
                type: 'text'
            };

            console.log(`[WhatsApp] Calling ${baseUrl}/instances/${instanceId}/messages`);

            const res = await fetch(`${baseUrl}/instances/${instanceId}/messages`, {
                method: 'POST',
                headers: this.getHeaders(apiKey),
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            console.log(`[WhatsApp] Response status: ${res.status}, body:`, result);

            // Wainthego returns { status: "success", id: "message_id" }
            const messageId = result.id || null;
            const success = res.ok && result.status === 'success';

            // Record log in database
            await db.insert(whatsappLogs).values({
                recipient: to,
                userId: userId || null,
                billId: billId || null,
                message: message,
                type: type,
                status: success ? 'SENT' : 'FAILED',
                waMessageId: messageId
            });

            console.log(`[WhatsApp] Message logged to database with status: ${success ? 'SENT' : 'FAILED'}`);

            if (!success) {
                throw new Error(result.message || 'Failed to send message');
            }
            return result;
        } catch (e) {
            console.error('[WhatsApp] Service Error:', e);
            throw e;
        }
    }

    async syncMessageStatuses() {
        try {
            const { baseUrl, apiKey, instanceId } = await this.getConfig();

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
                    const res = await fetch(`${baseUrl}/instances/${instanceId}/messages/${log.waMessageId}`, {
                        headers: this.getHeaders(apiKey)
                    });
                    if (res.ok) {
                        const { status } = await res.json();
                        // Wainthego: sent, delivered, read, failed
                        const newStatus = status.toUpperCase();

                        if (newStatus !== 'UNKNOWN' && newStatus !== log.status) {
                            await db.update(whatsappLogs)
                                .set({ status: newStatus as any })
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
