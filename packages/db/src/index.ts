import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

// Export schema for use in other packages
export * from './schema';

export function createDbClient(url: string) {
    const filename = url.replace('file:', '');
    const sqlite = new Database(filename);
    return drizzle(sqlite, { schema });
}
