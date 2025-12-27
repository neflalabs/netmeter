<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { 
    CreditCard, 
    TrendingUp, 
    Calendar
} from 'lucide-vue-next'
import { useReportStore } from '@/stores/report'
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
import Header from '@/components/Header.vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import StatsCard from '@/components/StatsCard.vue'
import Footer from '@/components/Footer.vue'

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

const activeTab = ref<'FINANCIAL' | 'BEHAVIOR'>('FINANCIAL')
const reportStore = useReportStore()

const isLoading = computed(() => reportStore.isFetchingFinancial || reportStore.isFetchingBehavior)

// Financial Data State from Store
const financialData = computed(() => reportStore.financialData)

// Payment Behavior Data State from Store
const behaviorData = computed(() => reportStore.behaviorData)

// Date Filters (Default this month)
const now = new Date()
const startDate = ref(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0])

// Determine if dark mode is active (simplified check)
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

const fetchFinancial = async () => {
    await reportStore.fetchFinancial(startDate.value, endDate.value)
}

const fetchBehavior = async () => {
    await reportStore.fetchBehavior()
}

// Watch filters
watch([startDate, endDate], () => {
    if (activeTab.value === 'FINANCIAL') fetchFinancial()
})

watch(activeTab, (val) => {
    if (val === 'FINANCIAL') fetchFinancial()
    else fetchBehavior()
})

onMounted(() => {
    fetchFinancial()
})

const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID').format(val)
const formatDate = (val: string) => new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

// Chart Configs
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: isDark ? '#333' : '#e5e7eb' },
            ticks: { color: isDark ? '#9ca3af' : '#4b5563' }
        },
        x: {
            grid: { display: false },
            ticks: { color: isDark ? '#9ca3af' : '#4b5563' }
        }
    }
}

const financialChartData = computed(() => ({
    labels: financialData.value.chart.map((d: any) => formatDate(d.date)),
    datasets: [{
        label: 'Pemasukan Harian',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        data: financialData.value.chart.map((d: any) => d.amount)
    }]
}))

const behaviorChartData = computed(() => ({
    labels: behaviorData.value.distribution.map((d: any) => d.day),
    datasets: [{
        label: 'Jumlah Pembayaran',
        backgroundColor: '#10b981',
        borderRadius: 4,
        data: behaviorData.value.distribution.map((d: any) => d.count)
    }]
}))

const topRankedDays = computed(() => {
    return behaviorData.value.topDays.filter((d: any) => d.count > 0).slice(0, 3)
})

</script>

<template>
    <div class="min-h-screen bg-background pb-20 md:pb-6 flex">
        <!-- Desktop Sidebar -->
        <AdminSidebar />

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-w-0 overflow-x-hidden">
            <Header title="Laporan & Statistik" :show-back="true" />

            <main class="container mx-auto px-4 py-6 md:max-w-6xl space-y-6">
                <!-- Tabs -->
                <div class="flex p-1 bg-secondary/50 rounded-lg max-w-md mx-auto">
                    <button 
                        class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
                        :class="activeTab === 'FINANCIAL' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'"
                        @click="activeTab = 'FINANCIAL'"
                    >
                        Laporan Keuangan
                    </button>
                    <button 
                        class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
                        :class="activeTab === 'BEHAVIOR' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'"
                        @click="activeTab = 'BEHAVIOR'"
                    >
                        Estimasi Pembayaran
                    </button>
                </div>

                <div v-if="isLoading" class="py-12 flex justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>

                <!-- FINANCIAL REPORT -->
                <div v-else-if="activeTab === 'FINANCIAL'" class="space-y-6 w-full">
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard 
                            title="Total Pemasukan" 
                            :value="`Rp ${formatCurrency(financialData.summary.totalIncome)}`"
                            :icon="TrendingUp"
                            variant="success"
                        />
                         <StatsCard 
                            title="Outstanding (Unpaid)" 
                            :value="`Rp ${formatCurrency(financialData.summary.totalOutstanding)}`"
                            :icon="CreditCard"
                            variant="secondary"
                        />
                         <StatsCard 
                            title="Total Transaksi" 
                            :value="financialData.summary.transactionCount"
                            :icon="Calendar"
                            variant="primary"
                        />
                         <StatsCard 
                            title="Metode Terpopuler" 
                            :value="financialData.summary.topMethod || '-'"
                            :icon="CreditCard"
                            variant="warning"
                        />
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-2 space-y-6">
                            <!-- Daily Chart -->
                            <Card>
                                <CardHeader class="flex flex-row items-center justify-between pb-2">
                                    <div class="space-y-0.5">
                                        <CardTitle class="text-base">Grafik Pemasukan Harian</CardTitle>
                                        <p class="text-[10px] text-muted-foreground">Periode {{ startDate }} s/d {{ endDate }}</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <input type="date" v-model="startDate" class="bg-background border border-input rounded px-2 py-1 text-[10px] outline-none h-7" />
                                        <input type="date" v-model="endDate" class="bg-background border border-input rounded px-2 py-1 text-[10px] outline-none h-7" />
                                    </div>
                                </CardHeader>
                                <CardContent class="h-64">
                                     <Bar :data="financialChartData" :options="chartOptions" />
                                </CardContent>
                            </Card>

                            <!-- Transactions Table -->
                            <Card>
                                <CardHeader>
                                    <CardTitle class="text-base">Riwayat Transaksi Terakhir</CardTitle>
                                </CardHeader>
                                <CardContent class="p-0">
                                    <div class="divide-y divide-border">
                                        <div v-for="tx in financialData.transactions" :key="tx.paidAt" class="flex items-center justify-between p-4 text-sm hover:bg-secondary/20 transition-colors">
                                            <div>
                                                <div class="font-medium">{{ tx.user }}</div>
                                                <div class="text-xs text-muted-foreground">{{ formatDate(tx.paidAt) }} • {{ tx.method }}</div>
                                            </div>
                                            <div class="font-medium text-green-600 dark:text-green-400">
                                                +Rp {{ formatCurrency(tx.amount) }}
                                            </div>
                                        </div>
                                        <div v-if="financialData.transactions.length === 0" class="p-12 text-center text-muted-foreground">
                                            <Calendar class="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p class="text-sm">Tidak ada transaksi pada periode ini.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <!-- Sidebar Info on Deskop -->
                        <div class="space-y-6">
                             <Card>
                                <CardHeader>
                                    <CardTitle class="text-sm font-bold">Ringkasan Metode</CardTitle>
                                </CardHeader>
                                <CardContent class="space-y-4">
                                    <div class="flex items-center justify-between text-sm">
                                        <span class="text-muted-foreground">Populer</span>
                                        <span class="font-bold text-primary">{{ financialData.summary.topMethod || '-' }}</span>
                                    </div>
                                    <div class="flex items-center justify-between text-sm">
                                        <span class="text-muted-foreground">Total Transaksi</span>
                                        <span class="font-bold text-foreground">{{ financialData.summary.topMethodCount || 0 }}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <!-- PAYMENT BEHAVIOR -->
                <div v-else class="space-y-6">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50">
                        <h4 class="font-medium mb-1">Analisa Tanggal Pembayaran</h4>
                        <p>Grafik ini menunjukkan tanggal berapa pelanggan paling sering melakukan pembayaran setiap bulannya.</p>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card class="lg:col-span-2">
                            <CardHeader>
                                <CardTitle class="text-base">Frekuensi Pembayaran per Tanggal (1-31)</CardTitle>
                            </CardHeader>
                            <CardContent class="h-64">
                                 <Bar :data="behaviorChartData" :options="chartOptions" />
                            </CardContent>
                        </Card>

                        <div class="space-y-4">
                            <h4 class="text-sm font-bold px-1">Peringkat Tanggal Terbayar</h4>
                            <!-- Top Dates -->
                            <div class="grid grid-cols-1 gap-3" v-if="topRankedDays.length > 0">
                                <div v-for="(day, idx) in topRankedDays" :key="day.day" class="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                            {{ Number(idx) + 1 }}
                                        </div>
                                        <div>
                                            <div class="font-bold text-foreground">Tanggal {{ day.day }}</div>
                                            <div class="text-[10px] text-muted-foreground">{{ day.count }} Transaksi</div>
                                        </div>
                                    </div>
                                    <div class="text-xs font-medium text-emerald-500">Terpopuler</div>
                                </div>
                            </div>
                            <div v-else class="text-center py-8 bg-secondary/20 rounded-lg border border-dashed border-border">
                                <p class="text-xs text-muted-foreground italic">Belum ada data transaksi.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    </div>
</template>
