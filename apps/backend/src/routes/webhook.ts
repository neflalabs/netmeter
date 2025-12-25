import { Hono } from 'hono';
import { db } from '../db';
import { whatsappLogs, users } from '@netmeter/db';
import { eq, or, like } from 'drizzle-orm';

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
app.post('/wainthego', async (c) => {
    try {
        const payload = await c.req.json();

        // console.log('[Webhook] Received:', JSON.stringify(payload, null, 2));

        // --- Handle Incoming Messages (New Format) ---
        if (payload.Info && payload.Message) {
            const { Info, Message } = payload;

            const sender = Info.MessageSource?.Sender || Info.RemoteJid; // Fallback if RemoteJid exists
            const pushName = Info.PushName || 'Unknown';
            const messageId = Info.ID;
            const text = extractMessageText(Message);
            const isFromMe = Info.MessageSource?.IsFromMe || false;

            console.log(`[Webhook] 📩 Incoming Message from ${pushName} (${sender}): ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);

            // extract phone number (remove @s.whatsapp.net)
            const phoneNumber = sender.replace('@s.whatsapp.net', '');

            // Try to find user
            const user = await db.select()
                .from(users)
                .where(or(
                    eq(users.whatsapp, phoneNumber),
                    eq(users.whatsapp, `0${phoneNumber.substring(2)}`), // Handle 62 vs 0 prefix if needed
                    like(users.whatsapp, `%${phoneNumber.substring(2)}`) // fuzzy match end
                ))
                .limit(1);

            const userId = user.length > 0 ? user[0].id : null;
            const userName = user.length > 0 ? user[0].name : pushName;

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
                    from: sender,
                    id: messageId,
                    type: Info.MediaType
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
