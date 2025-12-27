import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { authSchema } from '@netmeter/shared'

const app = new Hono()

// Simple in-memory rate limiter for login
const loginAttempts = new Map<string, { count: number, resetAt: number }>();

const rateLimiter = async (c: any, next: any) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowMs = 20 * 60 * 1000; // 20 minutes
    const maxAttempts = 5;

    const attempt = loginAttempts.get(ip);

    if (attempt && attempt.resetAt > now && attempt.count >= maxAttempts) {
        return c.json({ error: 'Too many login attempts. Please try again in 20 minutes.' }, 429);
    }

    await next();

    // Only count failed attempts (401)
    if (c.res.status === 401) {
        const currentAttempt = loginAttempts.get(ip);
        if (currentAttempt && currentAttempt.resetAt > now) {
            currentAttempt.count++;
        } else {
            loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
        }
    } else if (c.res.status === 200) {
        // Reset counter on successful login for this IP
        loginAttempts.delete(ip);
    }
};

app.post('/login', rateLimiter, zValidator('json', authSchema), async (c) => {
    const { username, password } = c.req.valid('json')

    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        const payload = {
            role: 'admin',
            username: username,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
        }
        const secret = process.env.JWT_SECRET!;
        const token = await sign(payload, secret)
        return c.json({ token })
    }

    return c.json({ error: 'Invalid credentials' }, 401)
})

export default app
