
import { Hono } from 'hono';
import { db } from '../db';
import { bills, payments, users } from '@netmeter/db';
import { and, between, eq, sql, desc, gte, lte } from 'drizzle-orm';

const app = new Hono();

// GET /financial - Usage/Payment Summary for a Date Range
app.get('/financial', async (c) => {
    try {
        const startStr = c.req.query('startDate');
        const endStr = c.req.query('endDate');
        const methodFilter = c.req.query('method'); // Optional: 'CASH' | 'TRANSFER' etc.

        // Default to current month if not specified
        const now = new Date();
        const start = startStr ? new Date(startStr) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endStr ? new Date(endStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 1. Get Payments within range (for Income & Charts)
        let paymentQuery = db.select({
            amount: payments.amount,
            paidAt: payments.paidAt,
            method: payments.method,
            user: users.name,
            billMonth: bills.month,
            billYear: bills.year
        })
            .from(payments)
            .innerJoin(bills, eq(payments.billId, bills.id))
            .innerJoin(users, eq(bills.userId, users.id))
            .where(
                and(
                    between(payments.paidAt, start, end),
                    eq(payments.status, 'VERIFIED'),
                    methodFilter ? eq(payments.method, methodFilter) : undefined
                )
            )
            .orderBy(desc(payments.paidAt));

        const paymentData = await paymentQuery;

        const totalIncome = paymentData.reduce((sum, p) => sum + p.amount, 0);
        const transactionCount = paymentData.length;

        // 2. Outstanding Amount (Unpaid Bills in the same period)
        // Note: This is tricky. Do we mean bills generated in this period that are unpaid?
        // Or bills that are currently unpaid regardless of generation date?
        // Usually reporting is period-based. Let's stick to bills generated in this period (approx via month/year).
        // A better approach for "Outstanding" in a dashboard is usually "Current Total Outstanding" regardless of time,
        // but if filtering by date, maybe "Bills from this period still unpaid".
        // Let's use: Bills with month/year corresponding to the filter range.
        // Simplified: Filter bills by `createdAt` in range or `month`/`year` overlap.
        // Let's use `createdAt` for simplicity if available, or just all UNPAID bills if no filter.
        // User asked for "Outstanding" in general contexts before.
        // Let's compute "Outstanding Amount" for bills belonging to the months included in the range.

        // Get months/years in range
        const startMonth = start.getMonth() + 1;
        const startYear = start.getFullYear();
        const endMonth = end.getMonth() + 1;
        const endYear = end.getFullYear();

        // Warning: spanning years logic is complex. Simplified query:
        // Get all UNPAID bills where (year > startY OR (year = startY AND month >= startM)) ...
        // For simplicity, let's just get ALL UNPAID bills for now as "Current Outstanding" is often what's wanted.
        // Use a separate query for "Unpaid in Period" if needed.
        // Let's do: Total Outstanding (All Time).

        const unpaidBills = await db.select({ amount: bills.amount })
            .from(bills)
            .where(eq(bills.status, 'UNPAID'));

        const totalOutstanding = unpaidBills.reduce((sum, b) => sum + (b.amount || 0), 0);

        // 3. Chart Data: Daily Income
        const dailyIncomeMap = new Map<string, number>();
        // Initialize days
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
            dailyIncomeMap.set(dayKey, 0);
        }

        paymentData.forEach(p => {
            if (p.paidAt) {
                const dayKey = new Date(p.paidAt).toISOString().split('T')[0];
                const current = dailyIncomeMap.get(dayKey) || 0;
                dailyIncomeMap.set(dayKey, current + p.amount);
            }
        });

        const dailyChartData = Array.from(dailyIncomeMap.entries()).map(([date, amount]) => ({
            date,
            amount
        })).sort((a, b) => a.date.localeCompare(b.date));


        // 4. Top Payment Method
        const methodCounts: Record<string, number> = {};
        paymentData.forEach(p => {
            const m = p.method || 'Unknown';
            methodCounts[m] = (methodCounts[m] || 0) + 1;
        });

        let topMethod = '-';
        let topMethodCount = 0;

        Object.entries(methodCounts).forEach(([method, count]) => {
            if (count > topMethodCount) {
                topMethod = method;
                topMethodCount = count;
            }
        });

        return c.json({
            summary: {
                totalIncome,
                transactionCount,
                totalOutstanding,
                topMethod,
                topMethodCount
            },
            chart: dailyChartData,
            transactions: paymentData.slice(0, 50) // Limit to 50 recent
        });

    } catch (e: any) {
        console.error('Error in /financial', e);
        return c.json({ error: e.message }, 500);
    }
});


// GET /payment-dates - Distribution of payment dates (Day 1-31)
app.get('/payment-dates', async (c) => {
    try {
        // We want to see on which days of the month people usually pay.
        // SQLite doesn't have `DAY()` function easily in Drizzle without `sql`.

        // Let's fetch all verified payments and aggregate in JS for simplicity/flexibility
        // unless dataset is huge. For <10k records, JS is fine.

        const allPayments = await db.select({
            paidAt: payments.paidAt,
            amount: payments.amount
        })
            .from(payments)
            .where(eq(payments.status, 'VERIFIED'));

        const distribution = new Array(31).fill(0).map((_, i) => ({ day: i + 1, count: 0, totalAmount: 0 }));

        allPayments.forEach(p => {
            if (p.paidAt) {
                const date = new Date(p.paidAt);
                const day = date.getDate(); // 1-31
                if (day >= 1 && day <= 31) {
                    distribution[day - 1].count++;
                    distribution[day - 1].totalAmount += p.amount;
                }
            }
        });

        // Also identify "Top Payment Days"
        const topDays = [...distribution].sort((a, b) => b.count - a.count).slice(0, 5);

        return c.json({
            distribution,
            topDays
        });

    } catch (e: any) {
        console.error('Error in /payment-dates', e);
        return c.json({ error: e.message }, 500);
    }
});

export default app;
