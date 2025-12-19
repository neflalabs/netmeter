
<template>
    <div class="space-y-6">
        <!-- Download Backup -->
        <div class="p-6 bg-secondary/20 rounded-lg border border-border">
            <h4 class="font-medium text-foreground mb-2">Download Backup</h4>
            <div class="flex items-center justify-between">
                <p class="text-sm text-muted-foreground">
                    Unduh file database (.db) untuk menyimpan salinan data sistem.
                </p>
                <Button @click="downloadBackup">
                    <DownloadCloud class="w-4 h-4 mr-2" />
                    Download
                </Button>
            </div>
        </div>

        <!-- Restore Backup -->
        <div class="p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/50">
            <h4 class="font-medium text-red-900 dark:text-red-400 mb-2">Restore Database</h4>
            <p class="text-sm text-red-600 dark:text-red-300 mb-4">
                <strong>Perhatian:</strong> Restore akan menimpa seluruh data saat ini dengan data dari file backup. 
                Data user, tagihan, dan pengaturan saat ini akan hilang.
            </p>

            <div class="space-y-4">
                <div class="flex items-center gap-4">
                    <input 
                        ref="fileInput" 
                        type="file" 
                        accept=".db,.sqlite" 
                        class="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                        @change="handleFileChange"
                    />
                </div>

                <div v-if="selectedFile" class="flex items-center space-x-2 bg-white/50 p-3 rounded border border-red-100">
                    <input 
                        id="confirm-restore" 
                        v-model="confirmationChecked"
                        type="checkbox" 
                        class="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                    <label for="confirm-restore" class="text-sm text-red-800 cursor-pointer select-none">
                        Saya mengerti bahwa tindakan ini akan <strong>menghapus seluruh data saat ini</strong> dan tidak dapat dibatalkan.
                    </label>
                </div>
                
                <Button 
                    v-if="selectedFile" 
                    variant="destructive" 
                    class="w-full" 
                    :disabled="isRestoring || !confirmationChecked"
                    @click="restoreBackup"
                >
                    <UploadCloud class="w-4 h-4 mr-2" />
                    {{ isRestoring ? 'Memproses Restore...' : 'Restore Database Sekarang' }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/ui/Button.vue'
import { DownloadCloud, UploadCloud } from 'lucide-vue-next'
import { backupApi } from '@/api'
import { useToast } from '@/composables/useToast'

const selectedFile = ref<File | null>(null)
const isRestoring = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const confirmationChecked = ref(false)

const { toast } = useToast()

const downloadBackup = () => {
    const api = backupApi()
    
    // We need to fetch with auth token to get the blob, then trigger download
    // Or if GET /download is protected, we must use fetch
    
    const token = localStorage.getItem('token')
    
    fetch(api.downloadUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(async res => {
        if (!res.ok) {
            const text = await res.text()
            throw new Error(`Download failed: ${res.status} ${res.statusText} - ${text}`)
        }
        return res.blob()
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `netmeter-backup-${new Date().toISOString().split('T')[0]}.db`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
        toast({
            title: 'Download Berhasil',
            description: 'File backup telah diunduh.',
            variant: 'success'
        })
    })
    .catch(err => {
        console.error(err)
        toast({
            title: 'Download Gagal',
            description: 'Gagal mengunduh file backup.',
            variant: 'destructive'
        })
    })
}

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        selectedFile.value = target.files[0]
        confirmationChecked.value = false // Reset confirmation when file changes
    }
}

const restoreBackup = async () => {
    if (!selectedFile.value) return
    
    // Checkbox is handled by :disabled binding, but double check here
    if (!confirmationChecked.value) {
        toast({
            title: 'Konfirmasi Diperlukan',
            description: 'Mohon centang kotak konfirmasi terlebih dahulu.',
            variant: 'destructive'
        })
        return
    }
    
    isRestoring.value = true
    try {
        const api = backupApi()
        await api.restore(selectedFile.value)
        toast({
            title: 'Restore Berhasil',
            description: 'Silakan refresh halaman atau restart aplikasi untuk melihat perubahan.',
            variant: 'success',
            duration: 5000
        })
        
        // Reset
        selectedFile.value = null
        if (fileInput.value) fileInput.value.value = ''
        confirmationChecked.value = false
        
    } catch (e: any) {
        console.error(e)
        toast({
            title: 'Restore Gagal',
            description: e.message || 'Terjadi kesalahan saat restore database.',
            variant: 'destructive'
        })
    } finally {
        isRestoring.value = false
    }
}
</script>
