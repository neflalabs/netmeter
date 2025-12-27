import { Hono } from 'hono';
import { db } from '../db';
import { whatsappLogs, users, settings } from '@netmeter/db';
import { eq, or, like } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'node:crypto';

const app = new Hono();

// Helper to extract text from message payload
function extractMessageText(message: any): string {
    if (!message) return '';
    if (typeof message === 'string') return message;

    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;

    return '';
}

/**
 * Wainthego Webhook Endpoint
 * Receives real-time updates:
 * 1. Status updates (sent/read/delivered) - 'event' based format
 * 2. Incoming messages - 'Info'/'Message' object format
 */
app.post('/', async (c) => {
    try {
        const signature = c.req.header('X-Wainthego-Signature');
        const rawBody = await c.req.text();

        const payload = JSON.parse(rawBody);

        // --- Verify Signature if Secret is configured ---
        const [appSettings] = await db.select().from(settings).limit(1);
        if (appSettings?.waWebhookSecret) {
            if (!signature) {
                console.error('[Webhook] ❌ Missing signature header but secret is configured');
                return c.json({ error: 'Missing signature' }, 401);
            }

            const hmac = createHmac('sha256', appSettings.waWebhookSecret);
            hmac.update(rawBody);
            const expectedSignature = hmac.digest('hex');

            const signatureBuffer = Buffer.from(signature);
            const expectedBuffer = Buffer.from(expectedSignature);

            if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
                console.error('[Webhook] ❌ Invalid signature');
                console.log(`[Webhook] Expected: ${expectedSignature}`);
                console.log(`[Webhook] Received: ${signature}`);
                return c.json({ error: 'Invalid signature' }, 401);
            }
        }

        // console.log('[Webhook] Received:', JSON.stringify(payload, null, 2));

        // --- Extract Message Data (Support both direct and wrapped formats) ---
        const msgInfo = payload.Info || payload.data?.Info;
        const msgMessage = payload.Message || payload.data?.Message;

        // --- Handle Incoming Messages ---
        if (msgInfo && msgMessage) {
            // Prefer SenderAlt or Sender from MessageSource if available (often contains standard JID)
            const rawSender = msgInfo.SenderAlt || msgInfo.MessageSource?.Sender || msgInfo.RemoteJid || '';
            const pushName = msgInfo.PushName || 'Unknown';
            const messageId = msgInfo.ID;
            const text = extractMessageText(msgMessage);
            const isFromMe = msgInfo.MessageSource?.IsFromMe || false;

            // If it's from me, it's an outgoing message echo, usually we skip it 
            if (isFromMe) {
                return c.json({ success: true, message: 'Echo ignored' });
            }

            // Extract digits only for the phone number part (handle :xx device IDs and @s.whatsapp.net)
            const phoneNumber = rawSender.split('@')[0].split(':')[0];

            console.log(`[Webhook] 📩 Incoming Message from ${pushName} (${phoneNumber}): ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);

            // Try to find user with robust matching (handle 62, 0, or just suffix)
            const cleanPhone = phoneNumber.startsWith('62') ? phoneNumber.substring(2) : (phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber);

            const user = await db.select()
                .from(users)
                .where(or(
                    eq(users.whatsapp, phoneNumber),
                    eq(users.whatsapp, `0${cleanPhone}`),
                    eq(users.whatsapp, `62${cleanPhone}`),
                    like(users.whatsapp, `%${cleanPhone}`)
                ))
                .limit(1);

            const userId = user.length > 0 ? user[0].id : null;

            // Save to DB
            await db.insert(whatsappLogs).values({
                recipient: phoneNumber,
                userId: userId,
                message: text,
                type: 'INCOMING',
                status: 'DELIVERED', // We received it
                waMessageId: messageId,
                createdAt: new Date()
            });

            return c.json({
                success: true,
                message: 'Message received and saved',
                details: {
                    from: rawSender,
                    phone: phoneNumber,
                    id: messageId
                }
            });
        }

        // --- Handle Status Updates (Original Format) ---
        // Validate basic structure for status events
        if (payload.event) {
            // Handle message status updates
            if (payload.event === 'message.status' || payload.event === 'message_status') {
                const { message_id, status } = payload;

                if (!message_id || !status) {
                    return c.json({ error: 'Missing message_id or status' }, 400);
                }

                // Find the log entry
                const logs = await db.select()
                    .from(whatsappLogs)
                    .where(eq(whatsappLogs.waMessageId, message_id))
                    .limit(1);

                if (logs.length === 0) {
                    console.warn(`[Webhook] ⚠️ Status update for unknown message ${message_id}`);
                    return c.json({ message: 'Message not found, ignoring' }, 200);
                }

                // Map status to internal format
                const statusMap: Record<string, string> = {
                    'sent': 'SENT',
                    'delivered': 'DELIVERED',
                    'read': 'READ',
                    'failed': 'FAILED'
                };

                const newStatus = statusMap[status.toLowerCase()] || status.toUpperCase();

                // Update status
                await db.update(whatsappLogs)
                    .set({ status: newStatus as any })
                    .where(eq(whatsappLogs.waMessageId, message_id));

                console.log(`[Webhook] ✅ Updated message ${message_id} status to ${newStatus}`);

                return c.json({
                    success: true,
                    message: 'Status updated',
                    message_id,
                    new_status: newStatus
                });
            }

            // Unknown event type
            console.warn('[Webhook] Unknown event type:', payload.event);
            return c.json({ success: true, message: 'Event received but not processed' });
        }

        // --- Unknown Format ---
        console.warn('[Webhook] Unknown payload format:', Object.keys(payload));
        return c.json({ error: 'Unknown payload format' }, 400);

    } catch (e: any) {
        console.error('[Webhook] Error processing webhook:', e);
        return c.json({ error: 'Internal server error', details: e.message }, 500);
    }
});

export default app;
