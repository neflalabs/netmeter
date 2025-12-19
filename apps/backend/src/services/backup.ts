
import fs from 'node:fs'

export class BackupService {
    private getDbPath(): string {
        const dbUrl = process.env.DATABASE_URL
        if (!dbUrl || !dbUrl.startsWith('file:')) {
            throw new Error('Database URL is not configured for file-based SQLite')
        }
        return dbUrl.replace('file:', '')
    }

    async getBackupBuffer() {
        const dbPath = this.getDbPath()

        if (!fs.existsSync(dbPath)) {
            throw new Error('Database file not found at ' + dbPath)
        }

        const buffer = await fs.promises.readFile(dbPath)
        console.log(`[BackupService] Read database backup, size: ${buffer.length} bytes`)
        return buffer
    }

    async restoreBackup(fileBlob: Blob) {
        const dbPath = this.getDbPath()

        // Safety: Create a .bak copy of current db
        if (fs.existsSync(dbPath)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const backupPath = `${dbPath}.${timestamp}.bak`
            await fs.promises.copyFile(dbPath, backupPath)
            console.log(`[BackupService] Created safety backup at ${backupPath}`)
        }

        // Convert Blob to ArrayBuffer then to Uint8Array for writing
        const arrayBuffer = await fileBlob.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        await fs.promises.writeFile(dbPath, buffer)
        console.log(`[BackupService] Restored database to ${dbPath}`)

        return { success: true }
    }
}

export const backupService = new BackupService()
