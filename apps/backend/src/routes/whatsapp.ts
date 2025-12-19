import { Hono } from 'hono'
import { whatsappService } from '../services/whatsapp'
import { db } from '../db'
import { whatsappLogs, users } from '@netmeter/db'
import { desc, eq, sql } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { paginationSchema, whatsappSendSchema } from '@netmeter/shared'

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

app.post('/send', zValidator('json', whatsappSendSchema), async (c) => {
    const { phone, message, type, userId } = c.req.valid('json')
    const res = await whatsappService.sendMessage(phone, message, type || 'OTHER', userId)
    return c.json(res)
})

app.post('/sync', async (c) => {
    const res = await whatsappService.syncMessageStatuses()
    return c.json(res)
})

app.get('/logs', zValidator('query', paginationSchema), async (c) => {
    try {
        const { page, limit } = c.req.valid('query')
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
