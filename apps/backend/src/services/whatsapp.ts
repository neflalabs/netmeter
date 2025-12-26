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

    async checkPhone(phone: string) {
        try {
            const { baseUrl, apiKey, instanceId } = await this.getConfig();

            // Sanitize number
            let sanitizedPhone = phone.replace(/\D/g, '');
            // Case 08... -> 628...
            if (sanitizedPhone.startsWith('08')) sanitizedPhone = '62' + sanitizedPhone.substring(1);
            // Case 6208... -> 628...
            else if (sanitizedPhone.startsWith('6208')) sanitizedPhone = '62' + sanitizedPhone.substring(3);
            // Case 8... (no prefix) -> 628...
            else if (sanitizedPhone.startsWith('8')) sanitizedPhone = '62' + sanitizedPhone;
            // Case 62... (already correct)
            else if (!sanitizedPhone.startsWith('62')) sanitizedPhone = '62' + sanitizedPhone;

            console.log(`[WhatsApp] Checking number: ${phone} -> ${sanitizedPhone}`);

            const res = await fetch(`${baseUrl}/instances/${instanceId}/actions/check-phone`, {
                method: 'POST',
                headers: this.getHeaders(apiKey),
                body: JSON.stringify({ phones: [sanitizedPhone] })
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error(`[WhatsApp] ❌ API Error: ${res.status} - ${errText}`);
                throw new Error(`API Error: ${res.status}`);
            }
            const data = await res.json();
            console.log(`[WhatsApp] Check result for ${sanitizedPhone}:`, JSON.stringify(data));

            // Wainthego results format (based on actual response): { results: [{ Query, JID, IsIn }] }
            // Some versions might use: { results: [{ phone, exists, jid }] }
            const result = data.results?.find((r: any) => {
                const phoneVal = (r.phone || r.Query || r.JID || '').toString();
                return phoneVal.includes(sanitizedPhone) || sanitizedPhone.includes(phoneVal);
            }) || data.results?.[0];

            return {
                exists: result?.exists ?? result?.IsIn ?? false,
                jid: result?.jid || result?.JID || null,
                phone: sanitizedPhone
            };
        } catch (e) {
            console.error('[WhatsApp] Check Phone Error:', e);
            throw e;
        }
    }

    async sendMessage(to: string, message: string, type: 'BILL' | 'RECEIPT' | 'REMINDER' | 'OTHER' = 'OTHER', userId?: number, billId?: number) {
        try {
            const { baseUrl, apiKey, instanceId } = await this.getConfig();

            console.log(`[WhatsApp] Sending message to ${to}`);

            // 1. Sanitize & Validate Phone
            const check = await this.checkPhone(to);
            if (!check.exists) {
                console.warn(`[WhatsApp] ❌ Number ${to} (${check.phone}) is NOT on WhatsApp. Aborting.`);

                // Record failure in database
                await db.insert(whatsappLogs).values({
                    recipient: to,
                    userId: userId || null,
                    billId: billId || null,
                    message: message,
                    type: type,
                    status: 'FAILED',
                    waMessageId: null
                });

                throw new Error(`Nomor ${to} tidak terdaftar di WhatsApp.`);
            }

            const phone = check.phone;
            console.log(`[WhatsApp] Sanitized & Verified phone: ${phone}`);

            const payload = {
                phone,
                message,
                type: 'text'
            };

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
