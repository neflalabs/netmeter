<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { TrendingUp, CreditCard, Calendar } from 'lucide-vue-next'
import { Bar } from 'vue-chartjs'
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
import StatsCard from '@/components/StatsCard.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import { useFormatters } from '@/composables/useFormatters'
import { useReportStore } from '@/stores/report'

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

const { formatCurrency, formatDate } = useFormatters()
const reportStore = useReportStore()

const financialData = computed(() => reportStore.financialData)
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

const now = new Date()
const startDate = ref(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0])

const fetchFinancial = async () => {
    await reportStore.fetchFinancial(startDate.value, endDate.value)
}

watch([startDate, endDate], fetchFinancial)

onMounted(fetchFinancial)

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#1e293b',
            bodyColor: isDark ? '#f8fafc' : '#1e293b',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
                label: (context: any) => `Rp ${formatCurrency(context.raw)}`
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: { 
                color: isDark ? '#94a3b8' : '#64748b',
                font: { size: 10 },
                callback: (value: any) => value >= 1000000 ? (value/1000000) + 'jt' : value >= 1000 ? (value/1000) + 'rb' : value
            }
        },
        x: {
            grid: { display: false },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }
        }
    }
}))

const financialChartData = computed(() => ({
    labels: financialData.value.chart.map((d: any) => formatDate(d.date)),
    datasets: [{
        label: 'Pemasukan Harian',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        data: financialData.value.chart.map((d: any) => d.amount)
    }]
}))
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
            title="Total Pemasukan"
            :icon="TrendingUp"
            variant="success"
            class="relative overflow-hidden group"
        >
            <template #default>
                <div class="flex flex-col">
                    <span class="text-2xl font-black text-foreground">Rp {{ formatCurrency(financialData.summary.totalIncome) }}</span>
                    <span class="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                         PERIODE INI
                    </span>
                </div>
            </template>
        </StatsCard>
         <StatsCard
            title="Sisa Tagihan"
            :icon="CreditCard"
            variant="secondary"
            class="relative overflow-hidden group"
        >
             <template #default>
                <div class="flex flex-col">
                    <span class="text-2xl font-black text-foreground">Rp {{ formatCurrency(financialData.summary.totalOutstanding) }}</span>
                    <span class="text-[10px] text-purple-500 font-bold flex items-center gap-1 mt-1 uppercase">
                         Belum Terbayar
                    </span>
                </div>
            </template>
        </StatsCard>
         <StatsCard
            title="Transaksi"
            :icon="Calendar"
            variant="primary"
        >
             <template #default>
                 <div class="flex flex-col">
                    <span class="text-2xl font-black text-foreground">{{ financialData.summary.transactionCount }}</span>
                    <span class="text-[10px] text-blue-500 font-bold flex items-center gap-1 mt-1 uppercase">
                         Invoice Terbayar
                    </span>
                </div>
            </template>
        </StatsCard>
         <StatsCard
            title="Metode Top"
            :icon="CreditCard"
            variant="warning"
        >
               <template #default>
                 <div class="flex flex-col">
                    <span class="text-xl font-black text-foreground truncate">{{ financialData.summary.topMethod || '-' }}</span>
                    <span class="text-[10px] text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-1 mt-1 uppercase">
                         {{ financialData.summary.topMethodCount }} Kali Digunakan
                    </span>
                </div>
            </template>
        </StatsCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            <!-- Daily Chart -->
            <Card class="border-border/40 shadow-xl shadow-black/5 dark:shadow-none">
                <CardHeader class="flex flex-row items-center justify-between pb-6 gap-4">
                    <div class="space-y-1">
                        <CardTitle class="text-lg font-bold">Grafik Pemasukan Harian</CardTitle>
                        <div class="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar class="w-3 h-3" />
                             {{ startDate }} ~ {{ endDate }}
                        </div>
                    </div>
                    <div class="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-xl border border-border/50">
                        <input type="date" v-model="startDate" class="bg-transparent border-none focus:ring-0 text-[11px] font-bold text-foreground w-28 uppercase cursor-pointer" />
                        <span class="text-muted-foreground font-bold">~</span>
                        <input type="date" v-model="endDate" class="bg-transparent border-none focus:ring-0 text-[11px] font-bold text-foreground w-28 uppercase cursor-pointer" />
                    </div>
                </CardHeader>
                <CardContent class="h-80">
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

        <!-- Sidebar Info -->
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
</template>
