
import { Hono } from 'hono';
import { db } from '../db';
import { settings, bills } from '@netmeter/db';
import { eq } from 'drizzle-orm';

import { zValidator } from '@hono/zod-validator';
import { settingsSchema } from '../schemas';

const app = new Hono();

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
        const storedSettings = await db.select().from(settings).limit(1);

        const values = {
            ...body,
            updatedAt: new Date(),
        };

        if (storedSettings.length === 0) {
            // Create first record
            const newSettings = await db.insert(settings).values({
                singleton: 1, // Singleton pattern
                ...values,
            }).returning();
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

            return c.json(updated[0]);
        }
    } catch (e) {
        console.error('Settings Update Error:', e);
        return c.json({ error: 'Failed to update settings' }, 500);
    }
});

export default app;
