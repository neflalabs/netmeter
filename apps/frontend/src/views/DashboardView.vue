<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, CreditCard, LogOut, Users, MoreHorizontal, Settings, Receipt, CheckCircle2, Clock, MessageCircle, Send, TrendingUp, Megaphone } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import DropdownMenu from '@/components/ui/DropdownMenu.vue'
import DropdownMenuTrigger from '@/components/ui/DropdownMenuTrigger.vue'
import DropdownMenuContent from '@/components/ui/DropdownMenuContent.vue'
import DropdownMenuItem from '@/components/ui/DropdownMenuItem.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import StatsCard from '@/components/StatsCard.vue'
import { billsApi } from '@/api'
import { useBillStore } from '@/stores/bill'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useReportStore } from '@/stores/report'
import { useToast } from '@/composables/useToast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const { toast } = useToast()
const auth = useAuthStore()
const billStore = useBillStore()
const userStore = useUserStore()
const reportStore = useReportStore()
const router = useRouter()

const handleLogout = () => {
    auth.logout()
    localStorage.removeItem('username')
    router.push('/login')
}

const isLoading = computed(() => billStore.isFetching || userStore.isFetching)
const sendingNotif = ref(false)
const lastTransactionId = ref<number | null>(null)

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value)
}

// Current month bills
const currentMonth = new Date().getMonth() + 1
const currentYear = new Date().getFullYear()

const currentMonthBills = computed(() => {
    return billStore.bills.filter(b => b.month === currentMonth && b.year === currentYear)
})

const pendingBills = computed(() => currentMonthBills.value.filter(b => b.status === 'UNPAID'))
const paidBills = computed(() => currentMonthBills.value.filter(b => b.status === 'PAID'))

const estimatedIncome = computed(() => {
    return billStore.bills
        .filter(b => b.status === 'UNPAID')
        .reduce((sum, b) => sum + (b.amount || 0), 0)
})

const handleNotify = async (id: number) => {
    sendingNotif.value = true
    try {
        const api = billsApi()
        await api.notify(id)
        toast({
            title: 'Terkirim',
            description: 'Notifikasi tagihan berhasil dikirim.',
            variant: 'success'
        })
    } catch (e: any) {
        console.error(e)
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
            title: 'Terkirim',
            description: 'Bukti bayar berhasil dikirim.',
            variant: 'success'
        })
    } catch (e: any) {
        console.error(e)
    } finally {
        sendingNotif.value = false
    }
}

let refreshInterval: any = null

onMounted(async () => {
    // Initial fetch
    billStore.fetchBills()
    userStore.fetchUsers()
    
    // Fetch financial stats for current month
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    reportStore.fetchFinancial(start, end)

    reportStore.fetchFinancial(start, end)
    
    // Initial fetch of latest transaction to set baseline (don't notify for past)
    try {
        const res = await reportStore.fetchLatestTransaction()
        if (res && res.transaction) {
            lastTransactionId.value = res.transaction.id
        }
    } catch (e) {
        console.error('Failed to fetch initial transaction', e)
    }

    // Polling interval (15s)
    refreshInterval = setInterval(async () => {
        // 1. Refresh bills list in background
        billStore.fetchBills(true)

        // 2. Poll for new payments
        try {
            const res = await reportStore.fetchLatestTransaction()
            if (res && res.transaction) {
                const tx = res.transaction
                // Check if we have a NEW transaction
                if (lastTransactionId.value !== null && tx.id !== lastTransactionId.value) {
                    // Update baseline
                    lastTransactionId.value = tx.id
                    
                    // Trigger Notification
                    toast({
                        title: 'Pembayaran Baru!',
                        description: `Rp ${formatCurrency(tx.amount)} dari ${tx.user} (${tx.method})`,
                        variant: 'success',
                        duration: 5000
                    })

                    // Refresh Dashboard Stats
                    reportStore.fetchFinancial(start, end)
                } else if (lastTransactionId.value === null) {
                    // Just set the value if it was null (app just loaded/first poll)
                    lastTransactionId.value = tx.id
                }
            }
        } catch (e) {
            console.error('Polling error', e)
        }
    }, 15000)
})

// Chart Logic
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: isDark ? '#333' : '#e5e7eb' },
            ticks: { color: isDark ? '#9ca3af' : '#4b5563', font: { size: 10 } }
        },
        x: {
            grid: { display: false },
            ticks: { color: isDark ? '#9ca3af' : '#4b5563', font: { size: 10 } }
        }
    }
}

const financialChartData = computed(() => ({
    labels: reportStore.financialData.chart.map((d: any) => new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
    datasets: [{
        label: 'Pemasukan Harian',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        data: reportStore.financialData.chart.map((d: any) => d.amount)
    }]
}))

// Cleanup interval on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="min-h-screen bg-background pb-20 md:pb-6 flex">
    <!-- Desktop Sidebar -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-w-0 overflow-x-hidden">
        <Header 
            title="Admin Dashboard" 
            subtitle="Kelola Netmeter"
            :show-back="true"
            back-to="/"
        >
            <template #actions>
                 <Button size="icon" variant="ghost" class="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 md:hidden" @click="handleLogout" title="Logout">
                    <LogOut class="w-5 h-5" />
                </Button>
            </template>
        </Header>

        <main class="container mx-auto px-4 py-6 md:max-w-6xl space-y-6 w-full">
            <!-- Quick Stats -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard 
                    title="User Aktif" 
                    :value="userStore.users.length" 
                    :icon="Users" 
                    variant="primary"
                />
                <StatsCard 
                    title="Estimated" 
                    :value="`Rp ${formatCurrency(estimatedIncome)}`"
                    :icon="CreditCard" 
                    variant="secondary"
                />
                <StatsCard 
                    title="Pemasukan" 
                    :value="`Rp ${formatCurrency(reportStore.financialData.summary.totalIncome)}`"
                    :icon="TrendingUp" 
                    variant="success"
                />
                <StatsCard 
                    title="Metode Top" 
                    :value="reportStore.financialData.summary.topMethod || '-'" 
                    :icon="CreditCard" 
                    variant="warning"
                />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Chart Section -->
                <Card class="lg:col-span-2">
                    <CardHeader class="pb-2">
                        <CardTitle class="text-sm font-bold flex items-center gap-2">
                            <TrendingUp class="w-4 h-4 text-primary" />
                            Tren Pemasukan (Bulan Ini)
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="h-64">
                         <Bar :data="financialChartData" :options="chartOptions" />
                    </CardContent>
                </Card>

                <!-- Summary/Quick Actions Section -->
                <div class="space-y-6">
                    <Card>
                        <CardHeader class="pb-2">
                            <CardTitle class="text-sm font-bold">Ringkasan Invoice</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-muted-foreground">Sudah Lunas</span>
                                <span class="font-bold text-green-500">{{ paidBills.length }} User</span>
                            </div>
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-muted-foreground">Belum Lunas</span>
                                <span class="font-bold text-yellow-500">{{ pendingBills.length }} User</span>
                            </div>
                            <div class="pt-2 border-t border-border flex items-center justify-between">
                                <span class="text-sm font-medium">Progress Iuran</span>
                                <span class="text-xs font-bold text-primary">{{ Math.round((paidBills.length / (userStore.users.length || 1)) * 100) }}%</span>
                            </div>
                            <div class="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div class="bg-primary h-full transition-all duration-500" :style="{ width: `${(paidBills.length / (userStore.users.length || 1)) * 100}%` }"></div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Latest System Messages/Announcements if any? Or just some quick tips -->
                </div>
            </div>

            <!-- Action Bar (Mobile Only) -->
            <div class="flex gap-2 overflow-x-auto pb-2 md:hidden">
                <Button size="sm" class="pl-2" @click="$router.push('/bills')">
                    <Plus class="w-4 h-4 mr-1" />Tagihan
                </Button>
                <Button size="sm" variant="outline" class="pl-2" @click="$router.push('/users')">
                    <Users class="w-4 h-4 mr-1" /> Pengguna
                </Button>

                <Button size="sm" variant="outline" class="pl-2" @click="$router.push('/stats')">
                    <TrendingUp class="w-4 h-4 mr-1" /> Stats
                </Button>

                <Button size="sm" variant="outline" class="pl-2" @click="$router.push('/announcement')">
                    <Megaphone class="w-4 h-4 mr-1" /> Pengumuman
                </Button>

                <Button size="sm" variant="outline" class="pl-2" @click="$router.push('/settings')">
                    <Settings class="w-4 h-4 mr-1" /> Settings
                </Button>
            </div>

            <!-- Bills List -->
            <Card class="md:max-w-3xl">
            <CardHeader class="pb-3 px-4 pt-4 border-b border-border">
                <div class="flex items-center justify-between">
                    <CardTitle class="text-base flex items-center gap-2">
                        <Receipt class="w-4 h-4" />
                        Tagihan Bulan Ini
                    </CardTitle>
                    <div class="flex items-center gap-2">
                        <Badge variant="outline" class="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50">
                            {{ pendingBills.length }} Pending
                        </Badge>
                        <Badge variant="outline" class="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50">
                            {{ paidBills.length }} Lunas
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent class="p-0">
                <div v-if="isLoading" class="p-8 text-center text-muted-foreground">
                    <div class="animate-pulse">Memuat data...</div>
                </div>
                <div v-else-if="currentMonthBills.length === 0" class="p-8 text-center text-muted-foreground">
                    <Receipt class="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                    <p class="font-medium">Belum ada tagihan bulan ini</p>
                    <p class="text-xs mt-1">Klik "Buat Tagihan" untuk generate tagihan</p>
                </div>
                <div v-else class="divide-y divide-border">
                    <div v-for="bill in currentMonthBills" :key="bill.id" class="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
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
                                <div class="text-xs text-muted-foreground">Rp {{ formatCurrency(bill.amount) }}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <Badge 
                                variant="outline"
                                :class="bill.status === 'PAID' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'"
                            >
                                {{ bill.status === 'PAID' ? 'LUNAS' : 'PENDING' }}
                            </Badge>
                            
                             <DropdownMenu>
                                <DropdownMenuTrigger as-child>
                                    <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full text-muted-foreground">
                                        <MoreHorizontal class="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" class="w-56">
                                    <DropdownMenuItem 
                                        v-if="bill.status === 'UNPAID'"
                                        @click="handleNotify(bill.id)"
                                        :disabled="sendingNotif"
                                        class="gap-2"
                                    >
                                        <MessageCircle class="w-4 h-4 text-blue-500" />
                                        Kirim Notifikasi Tagihan
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        v-if="bill.status === 'PAID'"
                                        @click="handlePaymentNotify(bill.id)"
                                        :disabled="sendingNotif"
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
    </main>

        <Footer />
    </div>
  </div>
</template>
