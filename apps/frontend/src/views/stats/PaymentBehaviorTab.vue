<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { TrendingUp } from 'lucide-vue-next'
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
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Alert from '@/components/ui/Alert.vue'
import AlertTitle from '@/components/ui/AlertTitle.vue'
import AlertDescription from '@/components/ui/AlertDescription.vue'
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

const reportStore = useReportStore()
const behaviorData = computed(() => reportStore.behaviorData)
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

const fetchBehavior = async () => {
    await reportStore.fetchBehavior()
}

onMounted(fetchBehavior)

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
  <div class="space-y-6">
    <Alert variant="info" class="border-blue-100 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-900/50">
        <TrendingUp class="w-4 h-4" />
        <AlertTitle>Analisa Tanggal Pembayaran</AlertTitle>
        <AlertDescription>
            Grafik ini menunjukkan tanggal berapa pelanggan paling sering melakukan pembayaran setiap bulannya.
        </AlertDescription>
    </Alert>

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
</template>
