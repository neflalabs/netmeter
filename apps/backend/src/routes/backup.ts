
import { Hono } from 'hono'
import { backupService } from '../services/backup'

const app = new Hono()

app.get('/download', async (c) => {
    try {
        const buffer = await backupService.getBackupBuffer()

        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `netmeter-backup-${timestamp}.db`

        c.header('Content-Type', 'application/x-sqlite3')
        c.header('Content-Disposition', `attachment; filename="${filename}"`)
        c.header('Content-Length', buffer.length.toString())

        return c.body(buffer)
    } catch (e: any) {
        console.error('Download backup error:', e)
        return c.json({ error: e.message }, 500)
    }
})

app.post('/restore', async (c) => {
    try {
        const formData = await c.req.formData()
        const file = formData.get('file')

        if (!file || !(file instanceof File)) {
            return c.json({ error: 'No file uploaded or invalid file' }, 400)
        }

        await backupService.restoreBackup(file)

        return c.json({ message: 'Database restored successfully. Please restart the backend.' })
    } catch (e: any) {
        console.error('Restore backup error:', e)
        return c.json({ error: e.message || 'Server Error' }, 500)
    }
})

export default app
