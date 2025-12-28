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
</script>

<template>
  <div class="space-y-6">
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
                        <p class="text-[10px] text-muted-foreground">Periote {{ startDate }} s/d {{ endDate }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <Input type="date" v-model="startDate" class="w-32 h-8 text-[10px]" />
                        <Input type="date" v-model="endDate" class="w-32 h-8 text-[10px]" />
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
