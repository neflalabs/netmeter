import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const envDbUrl = process.env.DATABASE_URL;

if (!envDbUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Cannot wipe unknown database.');
}

// Basic handling for "file:" protocol
let dbPath = envDbUrl.replace('file:', '');

console.log(`🗑️  Wiping database at: ${dbPath}`);

try {
    if (existsSync(dbPath)) {
        unlinkSync(dbPath);
        console.log('✅ Main database file deleted.');
    } else {
        console.log('⚠️  Main database file not found.');
    }

    // Clean up WAL/SHM files if they exist
    const shmPath = `${dbPath}-shm`;
    const walPath = `${dbPath}-wal`;

    if (existsSync(shmPath)) {
        unlinkSync(shmPath);
        console.log('✅ SHM file deleted.');
    }

    if (existsSync(walPath)) {
        unlinkSync(walPath);
        console.log('✅ WAL file deleted.');
    }

    console.log('\n✨ Wipe complete!');

} catch (error) {
    console.error('❌ Failed to wipe database:', error);
    process.exit(1);
}
