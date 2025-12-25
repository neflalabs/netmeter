import { Hono } from 'hono';
import { db } from '../db';
import { settings } from '@netmeter/db';
import { qrisService } from '../services/qris.service';
import QRCode from 'qrcode';

const app = new Hono();

app.get('/', async (c) => {
    try {
        const amountStr = c.req.query('amount');
        if (!amountStr) {
            return c.text('Amount is required', 400);
        }

        const amount = parseInt(amountStr);
        if (isNaN(amount) || amount <= 0) {
            return c.text('Invalid amount', 400);
        }

        // Fetch settings for QRIS string
        const storedSettings = await db.select().from(settings).limit(1);
        if (storedSettings.length === 0 || !storedSettings[0].qrisRawString) {
            return c.text('QRIS Static string not configured in settings', 500);
        }

        const rawQris = storedSettings[0].qrisRawString;

        // Use service to inject amount
        const fixQris = qrisService.convert(rawQris, amount.toString());

        // Generate QR Code Image
        const qrImage = await QRCode.toBuffer(fixQris, {
            type: 'png',
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'M'
        });

        c.header('Content-Type', 'image/png');
        return c.body(qrImage);

    } catch (e) {
        console.error('QRIS Generation Error:', e);
        return c.text('Internal Server Error', 500);
    }
});

export default app;
