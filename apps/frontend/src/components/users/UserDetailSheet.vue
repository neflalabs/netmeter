<template>
    <Transition name="slide-over">
        <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end">
            <!-- Backdrop -->
            <div 
                class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
                @click="close"
            ></div>

            <!-- Panel -->
            <div class="relative w-full max-w-md bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <!-- Header -->
                <div class="p-6 border-b border-border flex items-start justify-between">
                    <div>
                        <h2 class="text-xl font-bold">{{ user?.name }}</h2>
                        <div class="flex items-center gap-2 mt-1">
                             <span 
                                class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                :class="user?.status === 'ACTIVE' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'"
                            >
                                {{ user?.status }}
                            </span>
                             <span v-if="user?.whatsapp" class="text-sm text-muted-foreground">{{ user.whatsapp }}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" @click="close">
                        <X class="w-5 h-5" />
                    </Button>
                </div>

                <!-- Tabs -->
                <div class="border-b border-border px-6">
                    <div class="flex gap-6">
                        <button 
                            v-for="tab in tabs" 
                            :key="tab.id"
                            @click="activeTab = tab.id as 'details' | 'history'"
                            class="py-3 text-sm font-medium border-b-2 transition-colors relative"
                            :class="activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
                        >
                            {{ tab.label }}
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <!-- Details Tab -->
                    <div v-if="activeTab === 'details'" class="space-y-6">
                        <div class="space-y-4">
                            <!-- Info Items -->
                             <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bergabung</label>
                                    <div class="text-sm mt-1">{{ user?.joinedAt ? formatDateOnly(user.joinedAt) : '-' }}</div>
                                </div>
                                 <div>
                                    <label class="text-xs text-muted-foreground font-medium uppercase tracking-wider">PPPoE</label>
                                    <div class="text-sm mt-1 font-mono">{{ user?.pppoeUsername || '-' }}</div>
                                </div>
                             </div>

                             <div>
                                <label class="text-xs text-muted-foreground font-medium uppercase tracking-wider">Alamat</label>
                                <div class="text-sm mt-1">{{ user?.address || '-' }}</div>
                            </div>

                            <div>
                                <label class="text-xs text-muted-foreground font-medium uppercase tracking-wider">Perangkat</label>
                                <div class="text-sm mt-1">{{ user?.deviceModel || '-' }}</div>
                            </div>

                             <div v-if="user?.notes">
                                <label class="text-xs text-muted-foreground font-medium uppercase tracking-wider">Catatan</label>
                                <div class="text-sm mt-1 p-3 bg-secondary/50 rounded-lg">{{ user.notes }}</div>
                            </div>
                        </div>

                        <div class="pt-6 border-t border-border">
                            <Button variant="outline" class="w-full justify-start" @click="$router.push(`/users/${user?.id}/edit`)">
                                <Edit2 class="w-4 h-4 mr-2" />
                                Edit Profil
                            </Button>
                        </div>
                    </div>

                    <!-- History Tab -->
                    <div v-if="activeTab === 'history'" class="space-y-4">
                        <div v-if="loadingBills" class="text-center py-8 text-muted-foreground">
                            Memuat riwayat...
                        </div>
                        <div v-else-if="bills.length === 0" class="text-center py-8 text-muted-foreground">
                            <Clock class="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Belum ada riwayat tagihan
                        </div>
                        <div v-else class="space-y-3">
                            <div 
                                v-for="bill in bills" 
                                :key="bill.id"
                                class="p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                            >
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <div class="font-medium">{{ getMonthName(bill.month) }} {{ bill.year }}</div>
                                        <div class="text-xs text-muted-foreground">{{ formatDateOnly(bill.createdAt) }}</div>
                                    </div>
                                    <span 
                                        class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                        :class="bill.status === 'PAID' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'"
                                    >
                                        {{ bill.status === 'PAID' ? 'LUNAS' : 'PENDING' }}
                                    </span>
                                </div>
                                
                                <div class="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                    <div class="font-medium text-sm">Rp {{ formatCurrency(bill.amount) }}</div>
                                    <div class="flex items-center gap-2">
                                        <div v-if="bill.status === 'PAID'" class="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <CheckCircle2 class="w-3 h-3 text-green-500" />
                                            {{ bill.paidAt ? formatDateOnly(bill.paidAt) : 'Lunas' }}
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            class="h-6 text-[10px] px-2 gap-1 text-primary"
                                            @click="copyPaymentLink(bill.paymentToken)"
                                        >
                                            <LinkIcon class="w-3 h-3" />
                                            Link
                                        </Button>
                                    </div>
                                </div>

                                <!-- Payment Details (Midtrans/Manual) -->
                                <div v-if="bill.status === 'PAID' && bill.paymentMethod" class="mt-2 pt-2 border-t border-dashed border-border/50">
                                    <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                        <div class="text-muted-foreground uppercase">Metode</div>
                                        <div class="text-foreground font-medium text-right uppercase">
                                            {{ bill.paymentMethod }}
                                            <span v-if="bill.paymentType" class="text-muted-foreground font-normal">({{ bill.paymentType }})</span>
                                        </div>
                                        
                                        <template v-if="bill.paymentIssuer">
                                            <div class="text-muted-foreground uppercase">Issuer/Bank</div>
                                            <div class="text-foreground font-medium text-right uppercase">{{ bill.paymentIssuer }}</div>
                                        </template>

                                        <template v-if="bill.transactionId">
                                            <div class="text-muted-foreground uppercase">Ref ID</div>
                                            <div class="text-foreground font-mono text-right truncate pl-4" :title="bill.transactionId">
                                                {{ bill.transactionId.split('-').pop() }}
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Edit2, Clock, CheckCircle2, Link as LinkIcon } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import type { User, Bill } from '@/types'
import { billsApi } from '@/api'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
    isOpen: boolean
    user: User | null
}>()

const emit = defineEmits(['close'])

const { formatDate, formatDateOnly, formatCurrency, getMonthName } = useFormatters()
const { toast } = useToast()

const activeTab = ref<'details' | 'history'>('details')
const bills = ref<Bill[]>([])
const loadingBills = ref(false)

const tabs = [
    { id: 'details', label: 'Detail Profil' },
    { id: 'history', label: 'Riwayat Tagihan' }
]

const close = () => {
    emit('close')
}

const fetchUserBills = async () => {
    if (!props.user) return
    loadingBills.value = true
    try {
        const api = billsApi()
        // Ensure billsApi.getAll supports query params or we filter here? 
        // We updated API to support filtering.
        const res = await api.getAll(props.user.id)
        bills.value = res
    } catch (error) {
        console.error('Failed to fetch user bills', error)
    } finally {
        loadingBills.value = false
    }
}

const copyPaymentLink = (token?: string) => {
    if (!token) return
    const url = `https://net.home.npx.my.id/pay/${token}` // Move base URL to env/constant later
    navigator.clipboard.writeText(url)
    toast({
        title: 'Tersalin',
        description: 'Link pembayaran telah disalin ke clipboard.',
        variant: 'success'
    })
}

watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        activeTab.value = 'details'
        fetchUserBills()
    }
})
</script>

<style scoped>
.slide-over-enter-active,
.slide-over-leave-active {
  transition: opacity 0.3s ease;
}

.slide-over-enter-from,
.slide-over-leave-to {
  opacity: 0;
}
</style>
