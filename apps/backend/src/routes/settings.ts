
import { Hono } from 'hono';
import { db } from '../db';
import { settings, bills } from '@netmeter/db';
import { eq } from 'drizzle-orm';

import { zValidator } from '@hono/zod-validator';
import { settingsSchema } from '@netmeter/shared';

const app = new Hono();

import QRCode from 'qrcode';

// Preview QRIS String
app.post('/preview-qris', async (c) => {
    try {
        const { content } = await c.req.json<{ content: string }>();
        if (!content) return c.text('Content required', 400);

        const qrImage = await QRCode.toBuffer(content, {
            type: 'png',
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'M'
        });

        c.header('Content-Type', 'image/png');
        return c.body(qrImage);
    } catch (e) {
        console.error('QR Preview Error:', e);
        return c.text('Failed to generate QR', 500);
    }
});

// Get Settings
app.get('/', async (c) => {
    try {
        const storedSettings = await db.select().from(settings).limit(1);
        if (storedSettings.length === 0) {
            // Auto-seed default settings with singleton pattern
            const newSettings = await db.insert(settings).values({ singleton: 1 }).returning();
            return c.json(newSettings[0]);
        }
        return c.json(storedSettings[0]);
    } catch (e) {
        return c.json({ error: 'Failed to fetch settings' }, 500);
    }
});

// Update Settings
app.put('/', zValidator('json', settingsSchema), async (c) => {
    try {
        const body = c.req.valid('json');
        console.log('[Settings] PUT request body:', JSON.stringify(body, null, 2));

        const storedSettings = await db.select().from(settings).limit(1);

        const values: any = {
            ...body,
            updatedAt: new Date(),
        };

        // Announcement Date Logic
        const prev = storedSettings[0];
        const now = new Date();

        if (body.announcementActive !== undefined) {
            const wasActive = prev?.announcementActive;
            const nowActive = body.announcementActive;
            const typeChanged = body.announcementType && (body.announcementType !== prev?.announcementType);
            const contentChanged = (body.announcementTitle !== undefined && body.announcementTitle !== prev?.announcementTitle) ||
                (body.announcementMessage !== undefined && body.announcementMessage !== prev?.announcementMessage);

            if (nowActive) {
                // If it was OFF and now ON, or if TYPE changed while ON
                if (!wasActive || typeChanged) {
                    values.announcementCreatedAt = now;
                    values.announcementUpdatedAt = null;
                }
                // If it stays ON and CONTENT changed (but type didn't)
                else if (contentChanged) {
                    values.announcementUpdatedAt = now;
                }
            }
            // If nowActive is false, we don't change the dates (preserve history as agreed)
        }

        console.log('[Settings] Values to save:', JSON.stringify(values, null, 2));

        if (storedSettings.length === 0) {
            // Create first record
            const newSettings = await db.insert(settings).values({
                singleton: 1, // Singleton pattern
                ...values,
            }).returning();
            console.log('[Settings] Created new settings:', newSettings[0]);
            return c.json(newSettings[0]);
        } else {
            // Update existing
            const updated = await db.update(settings)
                .set(values)
                .where(eq(settings.singleton, 1)) // Singleton pattern: always update row where singleton = 1
                .returning();

            // Invalidate Snap Tokens if Midtrans config changed
            const configChanged =
                storedSettings[0].midtransEnvironment !== values.midtransEnvironment ||
                storedSettings[0].midtransServerKey !== values.midtransServerKey ||
                storedSettings[0].midtransEnabled !== values.midtransEnabled;

            if (configChanged) {
                console.log('Midtrans config changed, invalidating all snap tokens');
                await db.update(bills).set({
                    snapToken: null,
                    snapTokenExpiry: null
                });
            }

            const xenditConfigChanged =
                storedSettings[0].xenditEnabled !== values.xenditEnabled ||
                storedSettings[0].xenditSecretKey !== values.xenditSecretKey ||
                storedSettings[0].xenditEnvironment !== values.xenditEnvironment;

            if (xenditConfigChanged) {
                console.log('Xendit config changed');
            }

            return c.json(updated[0]);
        }
    } catch (e) {
        console.error('Settings Update Error:', e);
        return c.json({ error: 'Failed to update settings' }, 500);
    }
});

export default app;
