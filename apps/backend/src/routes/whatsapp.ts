import { Hono } from 'hono'
import { whatsappService } from '../services/whatsapp'
import { db } from '../db'
import { whatsappLogs, users } from '@netmeter/db'
import { desc, eq, sql, and } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { paginationSchema, whatsappSendSchema } from '@netmeter/shared'

const app = new Hono()

const logsQuerySchema = paginationSchema.extend({
    type: z.enum(['BILL', 'RECEIPT', 'REMINDER', 'INCOMING', 'OTHER']).optional(),
})

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

app.get('/check-phone', zValidator('query', z.object({ phone: z.string() })), async (c) => {
    try {
        const { phone } = c.req.valid('query')
        const res = await whatsappService.checkPhone(phone)
        return c.json(res)
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.get('/logs', zValidator('query', logsQuerySchema), async (c) => {
    try {
        const { page, limit, type } = c.req.valid('query')
        const offset = (page - 1) * limit

        // Build where clause
        const whereClause = type ? eq(whatsappLogs.type, type) : undefined

        // 1. Get total logs count for pagination
        const [totalCount] = await db.select({ count: sql<number>`count(*)` })
            .from(whatsappLogs)
            .where(whereClause)

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
            .where(whereClause)
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
