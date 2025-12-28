<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, MoreVertical, Send, ExternalLink, Receipt, Clock, CheckCircle2, RefreshCcw, Wallet } from 'lucide-vue-next'
import { useBillStore } from '@/stores/bill'
import { billsApi } from '@/api'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useFormatters } from '@/composables/useFormatters'
// Constants removed to fix lint

// UI Components
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import DropdownMenu from '@/components/ui/DropdownMenu.vue'
import DropdownMenuTrigger from '@/components/ui/DropdownMenuTrigger.vue'
import DropdownMenuContent from '@/components/ui/DropdownMenuContent.vue'
import DropdownMenuItem from '@/components/ui/DropdownMenuItem.vue'
import PaymentDialog from '@/components/ui/PaymentDialog.vue'
import BillSettingsDialog from '@/components/bills/BillSettingsDialog.vue'

const { formatCurrency, getMonthName } = useFormatters()
const { toast } = useToast()
const { confirm } = useConfirm()
const router = useRouter()

const billStore = useBillStore()
const settingsStore = useSettingsStore()
const isGenerating = ref(false)
const searchQuery = ref('')
const filterStatus = ref('all')
const isPaymentDialogOpen = ref(false)
const isBillSettingsOpen = ref(false)
const selectedBillId = ref<number | null>(null)

const filteredBills = computed(() => {
    let result = billStore.bills
    
    // Filter by status
    if (filterStatus.value !== 'all') {
        result = result.filter(b => b.status === filterStatus.value)
    }
    
    // Search
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(b => 
            b.userName?.toLowerCase().includes(q) ||
            b.whatsapp?.toLowerCase().includes(q)
        )
    }
    
    return result
})

const generateBills = async () => {
    const confirmed = await confirm({
        title: 'Konfirmasi Generate Tagihan',
        message: 'Apakah Anda yakin ingin membuat tagihan untuk bulan ini? Tagihan hanya akan dibuat untuk user yang belum memiliki tagihan bulan ini.',
        confirmText: 'Ya, Buat Tagihan'
    })

    if (!confirmed) return

    isGenerating.value = true
    try {
        const api = billsApi()
        const data = await api.generate()
        toast({
            title: 'Berhasil',
            description: `${data.generatedCount} tagihan baru berhasil dibuat.`,
            variant: 'success'
        })
        billStore.fetchBills(true)
    } catch (error: any) {
        console.error(error)
    } finally {
        isGenerating.value = false
    }
}

const openPaymentDialog = (billId: number) => {
    selectedBillId.value = billId
    isPaymentDialogOpen.value = true
}

const handlePaymentConfirm = async ({ date, method }: { date: Date, method: 'CASH' | 'MANUAL_TRANSFER' }) => {
    if (!selectedBillId.value) return
    
    isPaymentDialogOpen.value = false
    
    try {
        await billStore.markAsPaid(selectedBillId.value, date, method)
        toast({
            title: 'Berhasil',
            description: 'Status tagihan diperbarui menjadi LUNAS.',
            variant: 'success'
        })
    } catch (error) {
        console.error(error)
    } finally {
        selectedBillId.value = null
    }
}

const sendingNotif = ref(false)

const handleNotify = async (id: number) => {
    sendingNotif.value = true
    try {
        const api = billsApi()
        await api.notify(id)
        toast({
            title: 'Berhasil',
            description: 'Notifikasi tagihan berhasil dikirim.',
            variant: 'success'
        })
    } catch (error: any) {
        console.error(error)
    } finally {
        sendingNotif.value = false
    }
}

const handlePaymentNotify = async (id: number) => {
    sendingNotif.value = true
    try {
        const api = billsApi()
        await api.notifyPayment(id)
        toast({
            title: 'Berhasil',
            description: 'Bukti bayar berhasil dikirim.',
            variant: 'success'
        })
    } catch (error: any) {
        console.error(error)
    } finally {
        sendingNotif.value = false
    }
}

const handleSaveSettings = async (newSettings: any) => {
    try {
        await settingsStore.updateSettings(newSettings)
        toast({
            title: 'Berhasil',
            description: 'Pengaturan harga berhasil diperbarui.',
            variant: 'success'
        })
        isBillSettingsOpen.value = false
    } catch (error) {
        console.error(error)
    }
}

// handleDelete removed as backend lacks delete bill endpoint

onMounted(() => {
    billStore.fetchBills()
    settingsStore.fetchSettings()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header/Filter Area -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-sm">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
                v-model="searchQuery" 
                placeholder="Cari user atau bulan..." 
                class="pl-10"
            />
        </div>
        
        <div class="flex items-center gap-2">
             <Button @click="isBillSettingsOpen = true" variant="ghost" size="icon" class="text-muted-foreground">
                <Wallet class="w-4 h-4" />
            </Button>
             <Button @click="generateBills" variant="outline" class="gap-2" :disabled="isGenerating">
                <Plus class="w-4 h-4" />
                Buat Tagihan
            </Button>
            <Button @click="billStore.fetchBills(true)" variant="secondary" size="icon" :disabled="billStore.isFetching">
                <RefreshCcw class="w-4 h-4" :class="{ 'animate-spin': billStore.isFetching }" />
            </Button>
        </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
            <CardHeader class="pb-2">
                <CardTitle class="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                    <Clock class="w-3.5 h-3.5" />
                    Pending
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-yellow-500">{{ billStore.bills.filter(b => b.status === 'UNPAID').length }}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader class="pb-2">
                <CardTitle class="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    Lunas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-green-500">{{ billStore.bills.filter(b => b.status === 'PAID').length }}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader class="pb-2">
                <CardTitle class="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                    <Receipt class="w-3.5 h-3.5" />
                    Total Piutang
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">Rp {{ formatCurrency(billStore.bills.filter(b => b.status === 'UNPAID').reduce((sum, b) => sum + b.amount, 0)) }}</div>
            </CardContent>
        </Card>
    </div>

    <!-- Bills Table -->
    <Card>
        <CardContent class="p-0">
            <div v-if="billStore.isFetching && billStore.bills.length === 0" class="p-8 text-center text-muted-foreground">
                <div class="animate-pulse">Memuat data tagihan...</div>
            </div>
            <div v-else-if="filteredBills.length === 0" class="p-8 text-center text-muted-foreground">
                <Receipt class="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Tidak ada data tagihan ditemukan</p>
            </div>
            <div v-else class="divide-y divide-border">
                <div v-for="bill in filteredBills" :key="bill.id" class="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-secondary/50 transition-colors gap-3">
                    <div class="flex items-center gap-4">
                        <div 
                            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                            :class="bill.status === 'PAID' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-yellow-500 to-orange-500'"
                        >
                            {{ (bill.userName || 'U').charAt(0).toUpperCase() }}
                        </div>
                        <div>
                            <div class="font-bold text-foreground">{{ bill.userName || 'Pelanggan' }}</div>
                            <div class="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{{ getMonthName(bill.month) }} {{ bill.year }}</span>
                                <span class="w-1 h-1 rounded-full bg-border"></span>
                                <span class="font-medium text-foreground">Rp {{ formatCurrency(bill.amount) }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between sm:justify-end gap-3 px-2 sm:px-0">
                        <Badge 
                            variant="outline"
                            :class="bill.status === 'PAID' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'"
                        >
                            {{ bill.status === 'PAID' ? 'Lunas' : 'Pending' }}
                        </Badge>

                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full text-muted-foreground">
                                    <MoreVertical class="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" class="w-56">
                                <DropdownMenuItem @click="router.push(`/pay/${bill.paymentToken}`)" class="gap-2">
                                    <ExternalLink class="w-4 h-4" />
                                    Buka Halaman Bayar
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="handleNotify(bill.id)" :disabled="sendingNotif" class="gap-2">
                                    <Send class="w-4 h-4 text-blue-500" />
                                    Kirim Notif WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    v-if="bill.status === 'UNPAID'"
                                    @click="openPaymentDialog(bill.id)"
                                    class="gap-2"
                                >
                                    <CheckCircle2 class="w-4 h-4 text-green-500" />
                                    Tandai Lunas (Cash)
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    v-if="bill.status === 'PAID'"
                                    @click="handlePaymentNotify(bill.id)"
                                    class="gap-2"
                                >
                                    <Send class="w-4 h-4 text-green-500" />
                                    Kirim Bukti Bayar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>

    <PaymentDialog 
        :is-open="isPaymentDialogOpen" 
        @close="isPaymentDialogOpen = false"
        @confirm="handlePaymentConfirm"
    />

    <BillSettingsDialog
        :is-open="isBillSettingsOpen"
        :loading="settingsStore.isFetching"
        :initial-settings="settingsStore.settings || {}"
        @close="isBillSettingsOpen = false"
        @save="handleSaveSettings"
    />
  </div>
</template>
