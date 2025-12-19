import { Database } from 'bun:sqlite';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

const envDbUrl = process.env.DATABASE_URL;

if (!envDbUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Migration requires a target database.');
}

let dbPath = envDbUrl.replace('file:', '');

// Find migration files
const drizzleDir = join(__dirname, 'drizzle');
// Read migration files from directory, sorting them by name to ensure order
const migrationFiles = readdirSync(drizzleDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

console.log(`🗄️  Database path: ${dbPath}`);
console.log(`📁 Migrations dir: ${drizzleDir}`);

const db = new Database(dbPath, { create: true });

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Run each migration
for (const file of migrationFiles) {
    const sqlPath = join(drizzleDir, file);

    if (!existsSync(sqlPath)) {
        console.error(`❌ Migration file not found: ${sqlPath}`);
        process.exit(1);
    }

    console.log(`\n📜 Running migration: ${file}`);
    const sql = readFileSync(sqlPath, 'utf8');

    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

    db.transaction(() => {
        for (const stmt of statements) {
            if (stmt) {
                try {
                    db.run(stmt);
                    console.log(`   ✓ Executed statement`);
                } catch (err: any) {
                    // Ignore "already exists" and "duplicate column" errors
                    if (!err.message.includes('already exists') &&
                        !err.message.includes('duplicate column')) {
                        console.error(`❌ Failed statement: ${stmt}`);
                        console.error(`❌ Error: ${err.message}`);
                        throw err;
                    }
                    console.log(`   ⏭️  Skipped (already exists)`);
                }
            }
        }
    })();
}

console.log('\n✅ Migration completed successfully!');
db.close();
