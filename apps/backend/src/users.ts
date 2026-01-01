import { Hono } from 'hono'
import { db } from './db'
import { users, bills, settings } from '@netmeter/db'
import { eq, isNull, and, sql } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { userSchema, idParamSchema, paginationSchema } from '@netmeter/shared'
import { getCurrentDate } from './utils/date'

import { NotificationService } from './services/notification'

const app = new Hono()

app.get('/', zValidator('query', paginationSchema), async (c) => {
    try {
        const { page, limit } = c.req.valid('query')
        const offset = (page - 1) * limit
        const includeDeleted = c.req.query('include_deleted') === 'true'

        // Base where clause
        const whereClause = includeDeleted ? undefined : isNull(users.deletedAt)

        // 1. Get total count
        const [totalCount] = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(whereClause)

        // 2. Get paginated users
        const allUsers = await db.select()
            .from(users)
            .where(whereClause)
            .limit(limit)
            .offset(offset)

        return c.json({
            data: allUsers,
            pagination: {
                page,
                limit,
                total: totalCount.count,
                totalPages: Math.ceil(totalCount.count / limit)
            }
        })
    } catch (e: any) {
        console.error('Failed to fetch users:', e)
        return c.json({ error: e.message }, 500)
    }
})

app.get('/:id', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    try {
        const user = await db.select().from(users).where(eq(users.id, id)).limit(1)
        if (user.length === 0) {
            return c.json({ error: 'User not found' }, 404)
        }
        return c.json(user[0])
    } catch (e: any) {
        console.error(e)
        return c.json({ error: e.message }, 500)
    }
})

app.post('/', zValidator('json', userSchema), async (c) => {
    const body = c.req.valid('json')

    try {
        // 1. Check Monthly Fee Settings first
        const appSettings = await db.select().from(settings).limit(1)
        const monthlyFee = appSettings.length > 0 ? appSettings[0].monthlyFee : 0

        if (monthlyFee <= 0) {
            return c.json({ error: 'Harga langganan belum diatur. Silakan atur harga di menu Settings terlebih dahulu.' }, 400)
        }

        const appDate = getCurrentDate()
        const joinedAt = body.joinedAt ? new Date(body.joinedAt) : appDate.toDate()

        const newUserRows = await db.insert(users).values({
            name: body.name,
            whatsapp: body.whatsapp,
            pppoeUsername: body.pppoeUsername || null,
            address: body.address || null,
            deviceModel: body.deviceModel || null,
            notes: body.notes || null,
            joinedAt,
            firstConnectedAt: body.firstConnectedAt ? new Date(body.firstConnectedAt) : joinedAt,
            dueDay: body.dueDay !== undefined ? parseInt(body.dueDay) : null,
            reminderInterval: body.reminderInterval !== undefined ? parseInt(body.reminderInterval) : null,
            reminderEnabled: body.reminderEnabled !== undefined ? body.reminderEnabled : true,
        }).returning()

        const user = newUserRows[0]

        // Auto-generate bill for current month (Configured Timezone)
        const currentMonth = appDate.month
        const currentYear = appDate.year

        if (monthlyFee > 0) {
            const newBills = await db.insert(bills).values({
                userId: user.id,
                month: currentMonth,
                year: currentYear,
                amount: monthlyFee,
                status: 'UNPAID',
                paymentToken: crypto.randomUUID(),
            }).returning()

            console.log(`[Auto-Bill] Generated bill for new user ${user.name} (${currentMonth}/${currentYear})`)

            // Automatic notifications are now handled by the scheduler's sendAutoBills task
            // at the configured autoBillTime. No need to send them instantly here.
        }

        return c.json(user)
    } catch (e: any) {
        console.error(e)
        return c.json({ error: e.message }, 500)
    }
})

app.put('/:id', zValidator('param', idParamSchema), zValidator('json', userSchema), async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')

    try {
        const updatedUser = await db.update(users)
            .set({
                name: body.name,
                whatsapp: body.whatsapp,
                pppoeUsername: body.pppoeUsername || null,
                address: body.address || null,
                deviceModel: body.deviceModel || null,
                notes: body.notes || null,
                status: body.status || 'ACTIVE',
                // Don't update firstConnectedAt unless explicitly needed, or maybe joinedAt?
                // Let's allow updating joinedAt if provided
                joinedAt: body.joinedAt ? new Date(body.joinedAt) : undefined,
                dueDay: body.dueDay !== undefined ? (body.dueDay === '' ? null : parseInt(body.dueDay)) : undefined,
                reminderInterval: body.reminderInterval !== undefined ? (body.reminderInterval === '' ? null : parseInt(body.reminderInterval)) : undefined,
                reminderEnabled: body.reminderEnabled !== undefined ? body.reminderEnabled : undefined,
            })
            .where(eq(users.id, id))
            .returning()

        if (updatedUser.length === 0) {
            return c.json({ error: 'User not found' }, 404)
        }

        return c.json(updatedUser[0])
    } catch (e: any) {
        console.error(e)
        return c.json({ error: e.message }, 500)
    }
})

// Soft Delete User
app.delete('/:id', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    try {
        const deletedUser = await db.update(users)
            .set({
                deletedAt: new Date(),
                status: 'INACTIVE'
            })
            .where(eq(users.id, id))
            .returning()

        if (deletedUser.length === 0) {
            return c.json({ error: 'User not found' }, 404)
        }

        return c.json({ message: 'User deleted successfully', user: deletedUser[0] })
    } catch (e: any) {
        console.error(e)
        return c.json({ error: e.message }, 500)
    }
})

// Restore Deleted User
app.post('/:id/restore', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')

    try {
        const restoredUser = await db.update(users)
            .set({ deletedAt: null })
            .where(eq(users.id, id))
            .returning()

        if (restoredUser.length === 0) {
            return c.json({ error: 'User not found' }, 404)
        }

        const user = restoredUser[0];

        // Ensure bill generation logic: Check if a bill for the current month exists
        const appDate = getCurrentDate()
        const currentMonth = appDate.month
        const currentYear = appDate.year

        const existingBill = await db.select()
            .from(bills)
            .where(and(
                eq(bills.userId, user.id),
                eq(bills.month, currentMonth),
                eq(bills.year, currentYear)
            ))
            .limit(1);

        if (existingBill.length === 0) {
            const appSettings = await db.select().from(settings).limit(1);
            const monthlyFee = appSettings.length > 0 ? appSettings[0].monthlyFee : 0;

            if (monthlyFee > 0) {
                await db.insert(bills).values({
                    userId: user.id,
                    month: currentMonth,
                    year: currentYear,
                    amount: monthlyFee,
                    status: 'UNPAID',
                    paymentToken: crypto.randomUUID(),
                });
                console.log(`[Restore-AutoBill] Generated missing bill for restored user ${user.name}`);
            }
        }

        return c.json({ message: 'User restored successfully and current month bill checked.', user })
    } catch (e: any) {
        console.error(e)
        return c.json({ error: e.message }, 500)
    }
})

export default app
