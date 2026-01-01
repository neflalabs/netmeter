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
                title: (tooltipItems: any) => `Tanggal ${tooltipItems[0].label}`,
                label: (context: any) => `${context.raw} Transaksi`
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 }, stepSize: 1 }
        },
        x: {
            grid: { display: false },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }
        }
    }
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
  <div class="space-y-6">
    <Alert variant="info" class="border-blue-100 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-900/50">
        <TrendingUp class="w-4 h-4" />
        <AlertTitle>Analisa Tanggal Pembayaran</AlertTitle>
        <AlertDescription>
            Grafik ini menunjukkan tanggal berapa pelanggan paling sering melakukan pembayaran setiap bulannya.
        </AlertDescription>
    </Alert>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card class="lg:col-span-2 border-border/40 shadow-xl shadow-black/5 dark:shadow-none">
            <CardHeader class="pb-6">
                <CardTitle class="text-lg font-bold">Frekuensi Pembayaran per Tanggal</CardTitle>
                <p class="text-xs text-muted-foreground italic">Distribusi transaksi berdasarkan tanggal dalam sebulan (1-31)</p>
            </CardHeader>
            <CardContent class="h-80">
                 <Bar :data="behaviorChartData" :options="chartOptions" />
            </CardContent>
        </Card>

        <div class="space-y-6">
            <h4 class="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 px-1">
                 🚀 Peringkat Terpopuler
            </h4>
            <!-- Top Dates -->
            <div class="grid grid-cols-1 gap-4" v-if="topRankedDays.length > 0">
                <div v-for="(day, idx) in topRankedDays" :key="day.day" 
                     class="group bg-card p-5 rounded-2xl border border-border/60 flex items-center justify-between hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 transform hover:-translate-y-1">
                    <div class="flex items-center gap-4">
                        <div class="relative">
                             <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                                {{ day.day }}
                            </div>
                            <div class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-500 border-2 border-card flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                 v-if="idx === 0">
                                🏆
                            </div>
                        </div>
                        <div>
                            <div class="font-black text-foreground text-sm">Tanggal {{ day.day }}</div>
                            <div class="text-[10px] text-muted-foreground font-bold uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                                <span class="w-1 h-1 rounded-full bg-emerald-500"></span>
                                {{ day.count }} Transaksi Berhasil
                            </div>
                        </div>
                    </div>
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                         <div class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20">
                             TOP #{{ idx + 1 }}
                         </div>
                    </div>
                </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-16 px-4 text-center bg-secondary/10 rounded-3xl border-2 border-dashed border-border/40">
                <div class="w-16 h-16 bg-card rounded-full flex items-center justify-center shadow-sm border border-border mb-4">
                    <TrendingUp class="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h5 class="font-bold text-foreground">Data Masih Kosong</h5>
                <p class="text-xs text-muted-foreground mt-2 max-w-[200px]">Belum ada data pembayaran yang cukup untuk melakukan analisa perilaku.</p>
            </div>
        </div>
    </div>
  </div>
</template>
