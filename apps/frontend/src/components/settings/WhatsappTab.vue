<template>
    <div class="space-y-6">
        <!-- Compact Status Header -->
        <div class="relative overflow-hidden p-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 shadow-sm group">
            <div class="absolute top-0 right-0 -m-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700"></div>
            
            <div class="relative flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-colors border border-primary/10"
                        :class="status === 'CONNECTED' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'">
                        <MessageCircle class="w-5 h-5" />
                    </div>
                    <div>
                        <h4 class="font-bold text-sm tracking-tight leading-none">WhatsApp Status</h4>
                        <div class="flex items-center gap-1.5 mt-1.5">
                            <div class="w-1.5 h-1.5 rounded-full" :class="status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'"></div>
                            <p class="text-[11px] text-muted-foreground font-medium truncate max-w-[180px]">
                                {{ status === 'CONNECTED' ? (phone || 'Terhubung sebagai User') : (status === 'QR_READY' ? 'Menunggu Scan' : 'Disconnected') }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <Button v-if="status === 'DISCONNECTED' || status === 'QR_READY'" variant="outline" size="xs" class="h-8 text-[11px] px-3 rounded-lg" @click="connect" :disabled="loading">
                        {{ loading ? 'Generating...' : 'Hubungkan' }}
                    </Button>

                    <Button v-if="status === 'CONNECTED'" variant="destructive" size="xs" class="h-8 text-[11px] px-3 rounded-lg bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white" @click="disconnect" :disabled="loading">
                        {{ loading ? 'Disconnecting...' : 'Disconnect' }}
                    </Button>
                </div>
            </div>

            <!-- Integrated QR Code -->
            <transition name="expand">
                <div v-if="status === 'QR_READY' && qrCode" class="pt-4 mt-4 border-t border-primary/10">
                    <div class="flex flex-col items-center gap-3">
                        <div class="bg-white p-3 rounded-2xl border border-primary/10 shadow-lg">
                            <img :src="qrCode" alt="Scan QR Code" class="w-40 h-40 object-contain" />
                        </div>
                        <p class="text-[10px] text-muted-foreground text-center max-w-[200px] leading-relaxed">
                            Buka WhatsApp di ponsel Anda > Perangkat Tertaut > Tautkan Perangkat.
                        </p>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Activity History (Tighter List) -->
        <div class="space-y-3">
            <div class="flex items-center justify-between px-1">
                <h3 class="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                    <History class="w-3 h-3 text-primary" /> Riwayat Aktivitas
                </h3>
                <Button variant="ghost" size="xs" class="h-7 text-[10px] text-muted-foreground hover:text-primary" @click="fetchLogs(1)" :disabled="loadingLogs">
                    <RefreshCcw class="w-2.5 h-2.5 mr-1" :class="{ 'animate-spin': loadingLogs }" /> Refresh
                </Button>
            </div>

            <div v-if="loadingLogs && logs.length === 0" class="space-y-2">
                <div v-for="i in 3" :key="i" class="h-12 bg-secondary/20 rounded-xl animate-pulse"></div>
            </div>

            <div v-else-if="logs.length === 0" class="py-10 text-center border-2 border-dashed border-secondary/50 rounded-2xl bg-secondary/[0.02]">
                <Send class="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p class="text-[11px] text-muted-foreground italic">Belum ada aktivitas pesan</p>
            </div>

            <div v-else class="space-y-3">
                <div class="space-y-1.5">
                    <div v-for="log in logs" :key="log.id" class="group relative overflow-hidden p-3 bg-secondary/10 hover:bg-secondary/20 border border-transparent hover:border-primary/10 rounded-xl transition-all duration-300">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-0.5">
                                    <span class="text-[11px] font-bold text-foreground truncate">{{ log.userName || log.recipient }}</span>
                                    <span class="text-[8px] px-1.5 py-0.5 rounded-md font-extrabold tracking-tighter uppercase border" :class="getTypeBadgeClass(log.type)">
                                        {{ log.type }}
                                    </span>
                                </div>
                                <p class="text-[10px] text-muted-foreground line-clamp-1 italic opacity-80 group-hover:opacity-100 transition-opacity">"{{ log.message }}"</p>
                            </div>
                            <div class="flex flex-col items-end gap-1 shrink-0">
                                <div class="text-[9px] font-medium text-muted-foreground/60">{{ formatDate(log.createdAt) }}</div>
                                <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md" 
                                    :class="{
                                        'text-green-500 bg-green-500/5': log.status === 'SENT' || log.status === 'DELIVERED',
                                        'text-blue-500 bg-blue-500/5': log.status === 'READ',
                                        'text-red-500 bg-red-500/5': log.status === 'FAILED'
                                    }">
                                    <Check v-if="log.status === 'SENT'" class="w-2.5 h-2.5" />
                                    <CheckCheck v-else-if="log.status === 'DELIVERED' || log.status === 'READ'" class="w-2.5 h-2.5" />
                                    <XCircle v-else class="w-2.5 h-2.5" />
                                    <span class="text-[8px] font-bold uppercase tracking-tighter">{{ log.status }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Minified Pagination -->
                <div class="pt-2 flex justify-center">
                    <Pagination 
                        :current-page="currentPage"
                        :total-pages="totalPages"
                        :total="totalItems"
                        :limit="limit"
                        @change="handlePageChange"
                        class="scale-90 origin-center"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Button from '@/components/ui/Button.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { 
    MessageCircle, 
    History, 
    Send, 
    RefreshCcw, 
    Check, 
    CheckCheck,
    XCircle 
} from 'lucide-vue-next'
import { whatsappApi } from '@/api'
import type { UpdateSettingsDTO } from '@/types'

import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

defineProps<{
    form?: UpdateSettingsDTO
}>()

const status = ref<'DISCONNECTED' | 'CONNECTED' | 'QR_READY'>('DISCONNECTED')
const qrCode = ref<string>('')
const loading = ref(false)
const phone = ref('')
const { toast } = useToast()
const { confirm } = useConfirm()

// Pagination State
const logs = ref<any[]>([])
const loadingLogs = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = ref(5)

const api = whatsappApi()

const fetchStatus = async () => {
    try {
        const res = await api.getStatus() as any
        if (res.status === 'CONNECTED') {
            status.value = 'CONNECTED'
             phone.value = res.phone || ''
        } else {
             status.value = 'DISCONNECTED'
        }
    } catch (e) {
        console.error('Failed to fetch status', e)
        status.value = 'DISCONNECTED'
    }
}

const fetchLogs = async (page = 1) => {
    loadingLogs.value = true
    try {
        // Trigger status sync in background
        api.syncLogs().catch(err => console.error('Sync failed', err))
        
        const res = await api.getLogs(page, limit.value) as any
        logs.value = res.data
        currentPage.value = res.pagination.page
        totalPages.value = res.pagination.totalPages
        totalItems.value = res.pagination.total
    } catch (e) {
        console.error('Failed to fetch logs', e)
    } finally {
        loadingLogs.value = false
    }
}

const handlePageChange = (page: number) => {
    fetchLogs(page)
}

const connect = async () => {
    loading.value = true
    try {
        const res = await api.getQR() as any
        if (res.qr) {
            status.value = 'QR_READY'
            qrCode.value = res.qr
        } else if (res.status === 'CONNECTED') {
             status.value = 'CONNECTED'
             phone.value = res.phone
             toast({
                title: 'Terhubung',
                description: 'WhatsApp berhasil terhubung.',
                variant: 'success'
             })
             fetchLogs()
        }
    } catch (e) {
        console.error('Failed to get QR', e)
        toast({
            title: 'Gagal',
            description: 'Gagal mendapatkan QR Code. Pastikan container WhatsApp berjalan.',
            variant: 'destructive'
        })
    } finally {
        loading.value = false
    }
}

const disconnect = async () => {
    const confirmed = await confirm({
        title: 'Putus Koneksi',
        message: 'Yakin ingin memutus koneksi WhatsApp?',
        confirmText: 'Ya, Putus',
        variant: 'destructive'
    })

    if (!confirmed) return
    
    loading.value = true
    try {
        await api.logout()
        status.value = 'DISCONNECTED'
        qrCode.value = ''
        phone.value = ''
        toast({
            title: 'Disconnected',
            description: 'WhatsApp berhasil diputus.',
            variant: 'default'
        })
    } catch (e) {
        console.error('Failed to logout', e)
        toast({
            title: 'Gagal',
            description: 'Gagal memutus koneksi.',
            variant: 'destructive'
        })
    } finally {
        loading.value = false
    }
}

const getTypeBadgeClass = (type: string) => {
    switch (type) {
        case 'BILL': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        case 'RECEIPT': return 'bg-green-500/10 text-green-500 border-green-500/20'
        case 'REMINDER': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
    }).format(date)
}

onMounted(() => {
    fetchStatus()
    fetchLogs()
})
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 400px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(-10px);
}
</style>
