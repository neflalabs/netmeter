<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PlusCircle, Receipt, CheckCircle2, Clock, Search, MoreHorizontal, Settings } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardContent from '@/components/ui/CardContent.vue'
import StatsCard from '@/components/StatsCard.vue'
import Button from '@/components/ui/Button.vue'
import Header from '@/components/Header.vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import Footer from '@/components/Footer.vue'
import PaymentDialog from '@/components/ui/PaymentDialog.vue'
import BillSettingsDialog from '@/components/bills/BillSettingsDialog.vue'
import { billsApi } from '@/api'
import { useBillStore } from '@/stores/bill'
import { useSettingsStore } from '@/stores/settings'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import type { UpdateSettingsDTO } from '@/types'

const { formatCurrency, formatDate, getMonthName } = useFormatters()
const { toast } = useToast()
const { confirm } = useConfirm()

const billStore = useBillStore()
const settingsStore = useSettingsStore()

const loading = computed(() => billStore.isFetching)
const isGenerating = ref(false)
const activeBillId = ref<number | null>(null)
const searchQuery = ref('')
const filterStatus = ref<'ALL' | 'UNPAID' | 'PAID' > ('ALL')
const isPaymentDialogOpen = ref(false)
const isSettingsDialogOpen = ref(false)
const settingsLoading = computed(() => settingsStore.isFetching)
const selectedBillId = ref<number | null>(null)

const filteredBills = computed(() => {
    let result = billStore.bills
    
    // Filter by status
    if (filterStatus.value !== 'ALL') {
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

const pendingCount = computed(() => billStore.bills.filter(b => b.status === 'UNPAID').length)
const paidCount = computed(() => billStore.bills.filter(b => b.status === 'PAID').length)
const pendingAmount = computed(() => billStore.bills.filter(b => b.status === 'UNPAID').reduce((sum, b) => sum + (b.amount || 0), 0))

const tabs = computed(() => [
    { id: 'ALL' as const, label: 'Semua', icon: Receipt },
    { id: 'UNPAID' as const, label: 'Pending', icon: Clock, count: pendingCount.value },
    { id: 'PAID' as const, label: 'Lunas', icon: CheckCircle2, count: paidCount.value }
])

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
    activeBillId.value = null // Close dropdown
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

const handleResetPayment = async (id: number) => {
    const confirmed = await confirm({
        title: 'Reset Transaksi',
        message: 'Apakah Anda yakin ingin membatalkan transaksi Midtrans yang sedang berjalan? Ini akan memungkinkan pengguna untuk memilih metode pembayaran baru.',
        confirmText: 'Ya, Reset'
    })

    if (!confirmed) return

    try {
        const api = billsApi()
        await api.cancelPayment(id)
        toast({
            title: 'Berhasil',
            description: 'Transaksi Midtrans berhasil di-reset.',
            variant: 'success'
        })
        billStore.fetchBills(true)
    } catch (error: any) {
        console.error(error)
    } finally {
        activeBillId.value = null
    }
}

const openSettings = async () => {
    isSettingsDialogOpen.value = true
    // Fetch fresh settings in background or from store
    await settingsStore.fetchSettings(true)
}

const handleSettingsSave = async (updates: Partial<UpdateSettingsDTO>) => {
    try {
        // Fetch current settings first to merge safely (store handles this in updateSettings if we wanted, but we pass full DTO)
        const current = await settingsStore.fetchSettings()
        const merged = { ...current, ...updates } as UpdateSettingsDTO
        
        await settingsStore.updateSettings(merged)
        
        toast({
            title: 'Berhasil',
            description: 'Pengaturan tagihan berhasil disimpan.',
            variant: 'success'
        })
        isSettingsDialogOpen.value = false
    } catch (error: any) {
        console.error(error)
    }
}


onMounted(() => {
    billStore.fetchBills()
})
</script>

<template>
  <div class="min-h-screen bg-background pb-20 md:pb-6 flex">
    <!-- Desktop Sidebar -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-w-0 overflow-x-hidden">
        <Header 
            title="Tagihan" 
            subtitle="Kelola tagihan pelanggan"
            :show-back="true"
        >
            <template #actions>
                <Button size="sm" @click="generateBills" :disabled="isGenerating">
                    <PlusCircle class="w-4 h-4 mr-1" />
                    {{ isGenerating ? 'Memproses...' : 'Generate' }}
                </Button>
                <Button variant="outline" size="icon" @click="openSettings">
                    <Settings class="w-4 h-4" />
                </Button>
            </template>
        </Header>

        <main class="container mx-auto px-4 py-6 md:max-w-4xl space-y-4 w-full">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatsCard
                    title="Pending"
                    :value="pendingCount"
                    :description="`Rp ${formatCurrency(pendingAmount)}`"
                    variant="warning"
                    :icon="Clock"
                />
                <StatsCard
                    title="Lunas"
                    :value="paidCount"
                    description="Tagihan sudah dibayar"
                    variant="success"
                    :icon="CheckCircle2"
                />
            </div>

            <!-- Bills List with Tabs -->
            <Card>
                <!-- Tabs -->
                <div class="border-b border-border">
                    <div class="flex overflow-x-auto scrollbar-hide">
                        <button 
                            v-for="tab in tabs" 
                            :key="tab.id"
                            @click="filterStatus = tab.id"
                            class="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2"
                            :class="filterStatus === tab.id ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'"
                        >
                            <component :is="tab.icon" class="w-4 h-4" />
                            {{ tab.label }}
                            <span v-if="tab.count !== undefined" class="text-xs px-1.5 py-0.5 rounded-full" :class="filterStatus === tab.id ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'">
                                {{ tab.count }}
                            </span>
                        </button>
                    </div>
                </div>

                <CardHeader class="pb-3 px-4 pt-4 border-b border-border">
                    <div class="flex items-center gap-2">
                        <Search class="w-4 h-4 text-muted-foreground" />
                        <input 
                            v-model="searchQuery"
                            type="text" 
                            placeholder="Cari tagihan..." 
                            class="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
                        />
                    </div>
                </CardHeader>
                <CardContent class="p-0">
                    <div v-if="loading" class="p-8 text-center text-muted-foreground">
                        <div class="animate-pulse">Memuat data...</div>
                    </div>
                    
                    <div v-else-if="filteredBills.length === 0" class="p-8 text-center text-muted-foreground">
                        <Receipt class="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                        <p class="font-medium">Belum ada tagihan</p>
                        <p class="text-xs mt-1">Klik "Generate" untuk membuat tagihan bulan ini</p>
                    </div>

                    <div v-else class="divide-y divide-border">
                        <div v-for="bill in filteredBills" :key="bill.id" class="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                            <div class="flex items-center gap-3">
                                <div 
                                    class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                    :class="bill.status === 'PAID' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-yellow-500 to-orange-500'"
                                >
                                    <CheckCircle2 v-if="bill.status === 'PAID'" class="w-5 h-5" />
                                    <Clock v-else class="w-5 h-5" />
                                </div>
                                <div>
                                    <div class="font-medium text-foreground">{{ bill.userName }}</div>
                                    <div class="text-xs text-muted-foreground mb-0.5">{{ getMonthName(bill.month) }} {{ bill.year }} • Rp {{ formatCurrency(bill.amount) }}</div>
                                    <div v-if="bill.createdAt" class="text-[10px] text-muted-foreground">
                                        Dibuat: {{ formatDate(bill.createdAt) }}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span 
                                    class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                    :class="bill.status === 'PAID' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'"
                                >
                                    {{ bill.status === 'PAID' ? 'LUNAS' : 'PENDING' }}
                                </span>
                                <div class="relative">
                                    <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground" @click="activeBillId = activeBillId === bill.id ? null : bill.id">
                                        <MoreHorizontal class="w-4 h-4" />
                                    </Button>
                                    <!-- Action Menu Dropdown -->
                                    <div 
                                        v-if="activeBillId === bill.id" 
                                        class="absolute right-0 top-full mt-1 w-48 bg-card rounded-lg shadow-lg border border-border z-10 py-1"
                                    >
                                        <button 
                                            v-if="bill.status === 'UNPAID'"
                                            @click="openPaymentDialog(bill.id)"
                                            class="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 flex items-center gap-2"
                                        >
                                            <CheckCircle2 class="w-4 h-4 text-green-600" />
                                            Tandai Lunas
                                        </button>
                                        <button 
                                            v-if="bill.status === 'UNPAID'"
                                            @click="handleResetPayment(bill.id)"
                                            class="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-secondary/50 flex items-center gap-2"
                                        >
                                            <Clock class="w-4 h-4" />
                                            Reset Midtrans
                                        </button>
                                         <button 
                                            class="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 flex items-center gap-2"
                                            @click="activeBillId = null"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </div>
                                <!-- Backdrop for closing menu -->
                                <div v-if="activeBillId === bill.id" class="fixed inset-0 z-0" @click="activeBillId = null"></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>

        <Footer />
    </div>

    <PaymentDialog 
        :is-open="isPaymentDialogOpen" 
        @close="isPaymentDialogOpen = false"
        @confirm="handlePaymentConfirm"
    />
    <BillSettingsDialog
        :is-open="isSettingsDialogOpen"
        :initial-settings="settingsStore.settings || {}"
        :loading="settingsLoading"
        @close="isSettingsDialogOpen = false"
        @save="handleSettingsSave"
    />
  </div>
</template>
