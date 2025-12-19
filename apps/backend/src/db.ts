import { createDbClient } from '@netmeter/db'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please configure it to point to your SQLite database.');
}

const dbUrl = process.env.DATABASE_URL;
export const db = createDbClient(dbUrl);
