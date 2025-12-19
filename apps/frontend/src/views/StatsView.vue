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
    <div class="min-h-screen bg-background pb-20">
        <Header title="Laporan & Statistik" :show-back="true" back-to="/dashboard" />

        <main class="container mx-auto px-4 py-6 max-w-2xl space-y-6">
            
            <!-- Tabs -->
            <div class="flex p-1 bg-secondary/50 rounded-lg">
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
            <div v-else-if="activeTab === 'FINANCIAL'" class="space-y-6">
                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-4">
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
                        :value="`${financialData.summary.topMethod} (${financialData.summary.topMethodCount})`"
                        :icon="CreditCard"
                        variant="warning"
                    />
                </div>

                <!-- Filters -->
                <div class="flex justify-center gap-2 items-center text-sm">
                    <input type="date" v-model="startDate" class="bg-background border border-input rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary h-9" />
                    <span class="text-muted-foreground text-lg">/</span>
                    <input type="date" v-model="endDate" class="bg-background border border-input rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary h-9" />
                </div>

                <!-- Daily Chart -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-base">Grafik Pemasukan Harian</CardTitle>
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
                            <div v-for="tx in financialData.transactions" :key="tx.paidAt" class="flex items-center justify-between p-4 text-sm">
                                <div>
                                    <div class="font-medium">{{ tx.user }}</div>
                                    <div class="text-xs text-muted-foreground">{{ formatDate(tx.paidAt) }} • {{ tx.method }}</div>
                                </div>
                                <div class="font-medium text-green-600 dark:text-green-400">
                                    +Rp {{ formatCurrency(tx.amount) }}
                                </div>
                            </div>
                            <div v-if="financialData.transactions.length === 0" class="p-4 text-center text-muted-foreground text-sm">
                                Tidak ada transaksi pada periode ini.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- PAYMENT BEHAVIOR -->
            <div v-else class="space-y-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50">
                    <h4 class="font-medium mb-1">Analisa Tanggal Pembayaran</h4>
                    <p>Grafik ini menunjukkan tanggal berapa pelanggan paling sering melakukan pembayaran setiap bulannya.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle class="text-base">Frekuensi Pembayaran per Tanggal (1-31)</CardTitle>
                    </CardHeader>
                    <CardContent class="h-64">
                         <Bar :data="behaviorChartData" :options="chartOptions" />
                    </CardContent>
                </Card>

                 <!-- Top Dates -->
                 <div class="grid grid-cols-3 gap-2" v-if="topRankedDays.length > 0">
                    <div v-for="(day, idx) in topRankedDays" :key="day.day" class="bg-card p-3 rounded-lg border border-border text-center">
                        <div class="text-xs text-muted-foreground mb-1">Rank {{ idx + 1 }}</div>
                        <div class="text-xl font-bold text-primary">Tgl {{ day.day }}</div>
                        <div class="text-xs text-muted-foreground">{{ day.count }} Transaksi</div>
                    </div>
                </div>
                <div v-else class="text-center py-4 bg-secondary/20 rounded-lg border border-dashed border-border">
                    <p class="text-xs text-muted-foreground italic">Belum ada data transaksi untuk dihitung peringkatnya.</p>
                </div>
            </div>

        </main>
        <Footer />
    </div>
</template>
