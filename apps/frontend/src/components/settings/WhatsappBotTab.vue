<template>
    <div class="space-y-6">
        <!-- Enable/Disable WhatsApp Integration -->
        <div class="relative overflow-hidden p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 shadow-sm group">
            <div class="absolute top-0 right-0 -m-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700"></div>
            
            <div class="relative flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                        <MessageCircle class="w-7 h-7" />
                    </div>
                    <div>
                        <h4 class="font-bold text-base tracking-tight">WhatsApp Integration</h4>
                        <p class="text-xs text-muted-foreground mt-0.5">Enable WhatsApp messaging via Wainthego API</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <Button 
                        v-if="form.waEnabled" 
                        variant="ghost" 
                        size="icon" 
                        class="h-9 w-9 rounded-xl hover:bg-primary/10" 
                        @click="checkStatus" 
                        :disabled="checkingStatus"
                    >
                        <RefreshCcw class="w-4 h-4" :class="{ 'animate-spin': checkingStatus }" />
                    </Button>
                    <Switch 
                        :checked="!!form.waEnabled" 
                        @update:checked="(val) => form.waEnabled = val" 
                        class="scale-110" 
                    />
                </div>
            </div>
        </div>

        <!-- Configuration (only show when enabled) -->
        <transition name="fade-slide">
            <div v-if="!!form.waEnabled" class="space-y-6">
                <!-- Wainthego Configuration -->
                <section class="space-y-4">
                    <div class="flex items-center gap-2 px-1">
                        <div class="w-1.5 h-4 bg-primary rounded-full"></div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Wainthego Configuration</h3>
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
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div class="space-y-1.5">
                                    <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">API Key (Master)</label>
                                    <input 
                                        v-model="form.waApiKey" 
                                        type="password" 
                                        placeholder="Wainthego API Key"
                                        class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary transition-all" 
                                    />
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Webhook Secret (Verification)</label>
                                    <input 
                                        v-model="form.waWebhookSecret" 
                                        type="password" 
                                        placeholder="Webhook Secret (Optional)"
                                        class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary transition-all" 
                                    />
                                </div>
                            </div>
                            
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Webhook URL (Copy to Wainthego)</label>
                                <div class="relative">
                                    <input 
                                        :value="webhookUrl" 
                                        type="text" 
                                        readOnly
                                        class="w-full bg-secondary/30 border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary transition-all font-mono" 
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        class="absolute right-1 top-1 h-8 px-2 text-[10px] font-bold text-primary hover:bg-primary/10"
                                        @click="copyWebhook"
                                    >
                                        {{ copied ? 'COPIED!' : 'COPY' }}
                                    </Button>
                                </div>
                            </div>
                            
                            <div class="flex items-center gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 text-[10px] text-blue-600 dark:text-blue-400">
                                <Info class="w-3.5 h-3.5 shrink-0" />
                                <p>Configure these settings, then click <b>Save Changes</b> at the bottom. Scan QR code in the Wainthego dashboard.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <!-- WhatsApp Message Logs -->
                <section class="space-y-4">
                    <div class="flex items-center justify-between px-1">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-4 bg-primary rounded-full"></div>
                            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">WhatsApp Message Logs</h3>
                        </div>
                        <div class="flex items-center gap-2">
                             <div class="flex items-center bg-secondary/20 p-0.5 rounded-lg border border-border/50">
                                <button 
                                    v-for="filter in logFilters" 
                                    :key="filter.value"
                                    @click="activeFilter = filter.value"
                                    class="px-2.5 py-1 text-[9px] font-bold rounded-md transition-all"
                                    :class="activeFilter === filter.value ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'"
                                >
                                    {{ filter.label }}
                                </button>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                class="h-7 text-[10px] gap-1.5 text-muted-foreground hover:text-primary"
                                @click="fetchLogs"
                                :disabled="loadingLogs"
                            >
                                <RefreshCcw class="w-3 h-3" :class="{ 'animate-spin': loadingLogs }" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <Card class="border-none bg-secondary/10 shadow-none overflow-hidden">
                        <div v-if="filteredLogs.length > 0" class="divide-y divide-border/50">
                            <div v-for="log in filteredLogs" :key="log.id" class="p-4 hover:bg-secondary/20 transition-colors">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="space-y-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span 
                                                class="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                                                :class="log.type === 'INCOMING' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'"
                                            >
                                                {{ log.type === 'INCOMING' ? 'IN' : 'OUT' }}
                                            </span>
                                            <span class="font-bold text-xs truncate">{{ log.userName || log.recipient }}</span>
                                            <span class="text-[10px] text-muted-foreground">{{ formatDate(log.createdAt) }}</span>
                                        </div>
                                        <p class="text-xs text-muted-foreground leading-relaxed break-words">{{ log.message }}</p>
                                    </div>
                                    <div class="shrink-0 flex flex-col items-end gap-1">
                                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">{{ log.recipient }}</span>
                                        <span class="text-[8px] uppercase font-bold text-muted-foreground/60">{{ log.type }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="p-12 text-center space-y-3">
                            <div class="inline-flex w-12 h-12 bg-secondary/50 rounded-full items-center justify-center text-muted-foreground/30">
                                <MessageCircle class="w-6 h-6" />
                            </div>
                            <p class="text-xs text-muted-foreground">No messages recorded for this filter.</p>
                        </div>
                    </Card>
                </section>
            </div>
        </transition>


        <!-- Disabled State -->
        <div v-if="!form.waEnabled" class="p-12 text-center space-y-4">
            <div class="inline-flex w-16 h-16 bg-muted rounded-full items-center justify-center text-muted-foreground/30">
                <MessageCircle class="w-8 h-8" />
            </div>
            <div class="max-w-[280px] mx-auto">
                <p class="text-sm font-medium text-muted-foreground">Enable WhatsApp Integration to configure Wainthego settings and view connection status.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { MessageCircle, Info, RefreshCcw } from 'lucide-vue-next'

import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Switch from '@/components/ui/Switch.vue'
import Button from '@/components/ui/Button.vue'
import type { UpdateSettingsDTO } from '@/types'
import { whatsappApi } from '@/api'

import { useToast } from '@/composables/useToast'

const props = defineProps<{
    form: UpdateSettingsDTO
}>()

const { toast } = useToast()
const api = whatsappApi()

const connectionStatus = ref<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED')
const connectedUser = ref('')
const checkingStatus = ref(false)
const copied = ref(false)
const messageLogs = ref<any[]>([])
const loadingLogs = ref(false)
const activeFilter = ref<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL')

const logFilters = [
    { label: 'ALL', value: 'ALL' },
    { label: 'IN', value: 'INCOMING' },
    { label: 'OUT', value: 'OUTGOING' }
] as const

const filteredLogs = computed(() => {
    if (activeFilter.value === 'ALL') return messageLogs.value
    if (activeFilter.value === 'INCOMING') return messageLogs.value.filter(l => l.type === 'INCOMING')
    if (activeFilter.value === 'OUTGOING') return messageLogs.value.filter(l => l.type !== 'INCOMING')
    return messageLogs.value
})

const webhookUrl = computed(() => {
    const origin = window.location.origin
    return `${origin}/api/webhook`
})

const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date))
}

const copyWebhook = async () => {
    try {
        await navigator.clipboard.writeText(webhookUrl.value)
        copied.value = true
        toast({
            title: 'Copied',
            description: 'Webhook URL copied to clipboard',
            variant: 'success'
        })
        setTimeout(() => { copied.value = false }, 2000)
    } catch (err) {
        console.error('Failed to copy', err)
    }
}

const fetchLogs = async () => {
    loadingLogs.value = true
    try {
        const res = await api.getLogs(1, 30) as any
        messageLogs.value = res.data || []
    } catch (err) {
        console.error('Failed to fetch logs', err)
    } finally {
        loadingLogs.value = false
    }
}

const checkStatus = async () => {
    checkingStatus.value = true
    try {
        const res = await api.getStatus() as any
        connectionStatus.value = res.status || 'DISCONNECTED'
        if (res.status === 'CONNECTED' && res.user) {
            connectedUser.value = res.user.name || res.user.id || 'Connected'
        }
    } catch (e) {
        console.error('Failed to check status', e)
        connectionStatus.value = 'DISCONNECTED'
    } finally {
        checkingStatus.value = false
    }
}

onMounted(() => {
    if (props.form.waEnabled) {
        checkStatus()
        fetchLogs()
    }
})
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
