import { Hono } from 'hono'
import { whatsappService } from '../services/whatsapp'
import { db } from '../db'
import { whatsappLogs, users } from '@netmeter/db'
import { desc, eq, sql } from 'drizzle-orm'

const app = new Hono()

app.get('/status', async (c) => {
    const status = await whatsappService.getStatus()
    return c.json(status)
})

app.get('/qr', async (c) => {
    // Some implementations might overload login to return QR
    const res = await whatsappService.login()
    return c.json(res)
})

app.post('/login', async (c) => {
    const res = await whatsappService.login()
    return c.json(res)
})

app.post('/logout', async (c) => {
    const res = await whatsappService.logout()
    return c.json(res)
})

app.post('/send', async (c) => {
    const body = await c.req.json()
    if (!body.phone || !body.message) {
        return c.json({ error: 'Phone and message are required' }, 400)
    }
    const res = await whatsappService.sendMessage(body.phone, body.message, body.type || 'OTHER', body.userId)
    return c.json(res)
})

app.post('/sync', async (c) => {
    const res = await whatsappService.syncMessageStatuses()
    return c.json(res)
})

app.get('/logs', async (c) => {
    try {
        const page = parseInt(c.req.query('page') || '1')
        const limit = parseInt(c.req.query('limit') || '5')
        const offset = (page - 1) * limit

        // 1. Get total logs count for pagination
        const [totalCount] = await db.select({ count: sql<number>`count(*)` })
            .from(whatsappLogs)

        // 2. Get paginated logs
        const logs = await db.select({
            id: whatsappLogs.id,
            recipient: whatsappLogs.recipient,
            message: whatsappLogs.message,
            type: whatsappLogs.type,
            status: whatsappLogs.status,
            createdAt: whatsappLogs.createdAt,
            userName: users.name,
        })
            .from(whatsappLogs)
            .leftJoin(users, eq(whatsappLogs.userId, users.id))
            .orderBy(desc(whatsappLogs.createdAt))
            .limit(limit)
            .offset(offset)

        return c.json({
            data: logs,
            pagination: {
                page,
                limit,
                total: totalCount.count,
                totalPages: Math.ceil(totalCount.count / limit)
            }
        })
    } catch (e: any) {
        console.error('Failed to fetch logs:', e)
        return c.json({ error: e.message }, 500)
    }
})

export default app
