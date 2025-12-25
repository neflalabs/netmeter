<template>
    <div class="space-y-6">
        <!-- Configuration Section -->
        <section class="space-y-4">
            <div class="flex items-center gap-2 px-1">
                <div class="w-1.5 h-4 bg-primary rounded-full"></div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Wainthego Connection</h3>
            </div>

            <Card class="border-none bg-secondary/20 shadow-none">
                <CardContent class="p-5 space-y-4">
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Service URL</label>
                            <input 
                                v-model="form.waServiceUrl" 
                                type="text" 
                                placeholder="http://localhost:3030/api/v1"
                                class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary transition-all" 
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Instance ID</label>
                            <input 
                                v-model="form.waInstanceId" 
                                type="text" 
                                placeholder="main"
                                class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary transition-all" 
                            />
                        </div>
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">API Key (Master)</label>
                        <input 
                            v-model="form.waApiKey" 
                            type="password" 
                            placeholder="Enter your Wainthego API Key"
                            class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary transition-all" 
                        />
                    </div>
                    
                    <div class="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20 text-[10px] text-primary/80">
                        <Info class="w-3.5 h-3.5 shrink-0" />
                        <p>Pastikan Anda sudah menekan tombol <b>Simpan Perubahan</b> di bawah sebelum mencoba <b>Hubungkan</b>, agar konfigurasi tersimpan ke server.</p>
                    </div>
                </CardContent>
            </Card>
        </section>

        <!-- Webhook URL Section -->
        <section class="space-y-4">
            <div class="flex items-center gap-2 px-1">
                <div class="w-1.5 h-4 bg-primary rounded-full"></div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Webhook URL</h3>
            </div>

            <Card class="border-none bg-secondary/20 shadow-none">
                <CardContent class="p-5 space-y-3">
                    <div class="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20 text-[10px] text-primary/80">
                        <Info class="w-3.5 h-3.5 shrink-0" />
                        <p>Salin URL ini dan paste ke <b>Webhook URL</b> di dashboard Wainthego untuk menerima update status pesan secara real-time.</p>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <input 
                            :value="webhookUrl" 
                            readonly
                            class="flex-1 bg-background border border-border rounded-xl text-xs p-2.5 font-mono text-muted-foreground" 
                        />
                        <Button variant="outline" size="sm" class="h-9 px-3 rounded-lg" @click="copyWebhookUrl">
                            <Copy class="w-3.5 h-3.5 mr-1.5" />
                            {{ copied ? 'Copied!' : 'Copy' }}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </section>

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
                                {{ status === 'CONNECTED' ? (phone || 'Terhubung') : 'Disconnected' }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm" class="h-8 w-8 p-0 rounded-lg" @click="fetchStatus" :disabled="loading">
                        <RefreshCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
                    </Button>

                    <Button v-if="status === 'CONNECTED'" variant="destructive" size="sm" class="h-8 text-[11px] px-3 rounded-lg bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white" @click="disconnect" :disabled="loading">
                        Putus Koneksi
                    </Button>

                    <a v-else href="https://wa.home.npx.my.id" target="_blank" class="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm">
                        Buka Dashboard <ExternalLink class="w-3 h-3" />
                    </a>
                </div>
            </div>
        </div>

        <!-- Activity History (Tighter List) -->
        <div class="space-y-3">
            <div class="flex items-center justify-between px-1">
                <h3 class="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                    <History class="w-3 h-3 text-primary" /> Riwayat Aktivitas
                </h3>
                <Button variant="ghost" size="sm" class="h-7 text-[10px] text-muted-foreground hover:text-primary" @click="fetchLogs(1)" :disabled="loadingLogs">
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
                                
                                <!-- Outcome Status (Only for outgoing) -->
                                <div v-if="log.type !== 'INCOMING'" class="flex items-center gap-1 px-1.5 py-0.5 rounded-md" 
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
                                <!-- Incoming Indicator -->
                                <div v-else class="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-violet-500 bg-violet-500/5">
                                    <ArrowDownLeft class="w-2.5 h-2.5" />
                                    <span class="text-[8px] font-bold uppercase tracking-tighter">RECEIVED</span>
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
import { ref, onMounted } from 'vue'
import Button from '@/components/ui/Button.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { 
    MessageCircle, 
    History, 
    Send, 
    RefreshCcw, 
    Check, 
    CheckCheck,
    XCircle,
    Info,
    ExternalLink,
    Copy,
    ArrowDownLeft
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import { whatsappApi } from '@/api'
import type { UpdateSettingsDTO } from '@/types'

import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps<{
    form: UpdateSettingsDTO
}>()

const status = ref<'DISCONNECTED' | 'CONNECTED' | 'SCANNING'>('DISCONNECTED')
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

// Webhook URL (construct from current location or env)
const webhookUrl = ref('')
const copied = ref(false)

const copyWebhookUrl = async () => {
    try {
        await navigator.clipboard.writeText(webhookUrl.value)
        copied.value = true
        setTimeout(() => {
            copied.value = false
        }, 2000)
        toast({
            title: 'Copied!',
            description: 'Webhook URL copied to clipboard',
            variant: 'success'
        })
    } catch (e) {
        toast({
            title: 'Failed',
            description: 'Could not copy to clipboard',
            variant: 'destructive'
        })
    }
}

const fetchStatus = async () => {
    loading.value = true
    try {
        const res = await api.getStatus() as any
        status.value = res.status
        
        if (res.status === 'CONNECTED') {
             phone.value = res.user?.name || res.user?.id || 'Terhubung'
        }
    } catch (e) {
        console.error('Failed to fetch status', e)
        status.value = 'DISCONNECTED'
    } finally {
        loading.value = false
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

// Status refresh is handled by fetchStatus
const connect = undefined

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
        case 'INCOMING': return 'bg-violet-500/10 text-violet-500 border-violet-500/20'
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
    // Construct webhook URL from current location
    const protocol = window.location.protocol
    const host = window.location.host
    // Remove /settings or any path, just use base
    const baseUrl = `${protocol}//${host}`
    webhookUrl.value = `${baseUrl}/api/webhook/wainthego`
    
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
