import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { secureHeaders } from 'hono/secure-headers'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set. Application cannot start in secure mode.');
}

import auth from './auth'
import usersRoute from './users'
// Ensure db is initialized
import './db'
// Start scheduler for automatic bill generation
import { startScheduler } from './scheduler'

const app = new Hono()

app.use('*', logger())
app.use('*', secureHeaders())

// Global Error Handler
app.onError((err, c) => {
    console.error(`[Global Error] ${err.message}`, err);

    // Default to 500
    let status = 500;
    let message = 'Internal Server Error';

    if (err instanceof Error && err.name === 'ZodError') {
        status = 400;
        message = 'Invalid request data';
        return c.json({ error: message, details: (err as any).errors }, status as any);
    }

    // In production, we don't want to leak internal error details
    const isProd = process.env.NODE_ENV === 'production';

    return c.json({
        error: isProd ? message : err.message,
        ...(isProd ? {} : { stack: err.stack })
    }, status as any);
});

// CORS - Restricted to specific origin in production
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*';

app.use('/*', cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}))

// Routes
app.route('/api/auth', auth)

app.use('/api/users*', jwt({
    secret: JWT_SECRET
}))
app.route('/api/users', usersRoute)

import settingsRoute from './routes/settings'
app.use('/api/settings*', jwt({
    secret: JWT_SECRET
}))
app.route('/api/settings', settingsRoute)

import billsRoute from './routes/bills'
app.use('/api/bills*', jwt({
    secret: JWT_SECRET
}))
app.route('/api/bills', billsRoute)

import publicRoute from './routes/public'
app.route('/api/public', publicRoute)

import paymentRoute from './routes/payment'
app.route('/api/payment', paymentRoute)

import qrisRoute from './routes/qris'
app.route('/api/public/qris', qrisRoute)



import whatsappRoute from './routes/whatsapp'
app.use('/api/whatsapp*', jwt({
    secret: JWT_SECRET
}))
app.route('/api/whatsapp', whatsappRoute)

import backupRoute from './routes/backup'
app.use('/api/backup*', jwt({
    secret: JWT_SECRET
}))
app.route('/api/backup', backupRoute)

import reportsRoute from './routes/reports'
app.use('/api/reports*', jwt({
    secret: JWT_SECRET
}))
app.route('/api/reports', reportsRoute)

import webhookRoute from './routes/webhook'
// Webhook is public - no JWT middleware
app.route('/api/webhook', webhookRoute)



import { serveStatic } from 'hono/bun'

app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date() })
})

// Serve static files from public directory (Frontend)
app.use('/*', serveStatic({ root: './public' }))

// SPA Fallback - verify file exists or just serve index.html
app.get('*', serveStatic({ path: './public/index.html' }))


const port = parseInt(process.env.PORT || '3000')
console.log(`Server is running on port ${port}`)

// Start automatic bill generation scheduler
startScheduler()

export default {
    port,
    fetch: app.fetch,
}
