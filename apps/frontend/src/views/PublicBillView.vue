
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { CheckCircle2, AlertCircle } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import PaymentMethods from '@/components/public/PaymentMethods.vue'
import { useFormatters } from '@/composables/useFormatters'

const { formatCurrency, formatDate, formatMonth } = useFormatters()
const route = useRoute()
const token = route.params.token as string
const isLoading = ref(true)
const error = ref('')
const bill = ref<any>(null)
const settings = ref<any>(null)

const fetchBill = async () => {
    isLoading.value = true
    try {
        const res = await fetch(`/api/public/bills/${token}`)
        if (res.ok) {
            bill.value = await res.json()
        } else {
            error.value = 'Tagihan tidak ditemukan atau link salah.'
        }
    } catch (e) {
        error.value = 'Gagal memuat tagihan.'
    } finally {
        isLoading.value = false
    }
}

const fetchSettings = async () => {
    try {
        const res = await fetch('/api/public/settings')
        if (res.ok) {
            settings.value = await res.json()
        }
    } catch (e) {
        console.error('Failed to load settings', e)
    }
}

onMounted(() => {
    fetchBill()
    fetchSettings()
})
</script>

<template>
        <div v-if="isLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div v-else-if="error" class="text-center py-12 text-destructive">
            <AlertCircle class="w-12 h-12 mx-auto mb-4" />
            <h2 class="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
            <p>{{ error }}</p>
        </div>

        <div v-else class="space-y-6">
            <!-- Status Banner -->
            <div v-if="bill.status === 'PAID'" class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 p-6 rounded-lg flex flex-col items-center text-center">
                <CheckCircle2 class="w-16 h-16 mb-4 text-green-600 dark:text-green-500" />
                <h1 class="text-2xl font-bold mb-1">PEMBAYARAN LUNAS</h1>
                <p class="text-sm opacity-90">Terima kasih telah melakukan pembayaran bulan ini.</p>
            </div>

            <div v-else-if="bill.paymentStatus === 'PENDING'" class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 p-6 rounded-lg flex flex-col items-center text-center">
                <h1 class="text-xl font-bold mb-1 uppercase">Menunggu Verifikasi</h1>
                <p class="text-sm opacity-90">Sistem mendeteksi transaksi sedang diproses. Jika sudah bayar, silakan tunggu atau refresh halaman.</p>
                <button class="mt-4 text-sm font-medium text-yellow-700 hover:underline" @click="fetchBill">Cek Status Terbaru</button>
            </div>

            <div v-else class="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 p-6 rounded-lg text-center">
                <h1 class="text-xl font-bold mb-1">Tagihan Bulan Ini</h1>
                <p class="text-sm opacity-90">Silakan lakukan pembayaran bulan ini.</p>
            </div>

            <!-- Bill Details -->
            <Card>
                <CardHeader class="border-b bg-muted/20 pb-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm text-muted-foreground mb-1">
                                {{ bill.accumulatedBills?.length > 1 ? 'Total Tagihan (Akumulasi)' : 'Total Tagihan' }}
                            </p>
                            <div class="text-3xl font-bold text-primary">
                                Rp {{ formatCurrency(bill.status === 'UNPAID' ? (bill.totalUnpaidAmount || bill.amount) : bill.amount) }}
                            </div>
                            <p v-if="bill.accumulatedBills?.length > 1" class="text-xs text-muted-foreground mt-1">
                                Termasuk {{ bill.accumulatedBills.length }} bulan tagihan belum lunas.
                            </p>
                        </div>
                        <Badge :variant="bill.status === 'PAID' ? 'secondary' : 'default'">
                            {{ bill.status === 'PAID' ? 'LUNAS' : 'BELUM BAYAR' }}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent class="pt-6 space-y-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-muted-foreground">Pengguna</p>
                            <p class="font-medium truncate">{{ bill.userName }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-muted-foreground">Periode</p>
                            <p v-if="bill.accumulatedBills?.length > 1" class="font-medium">
                                {{ bill.accumulatedBills.map((b: any) => formatMonth(b.month, b.year)).join(', ') }}
                            </p>
                            <p v-else class="font-medium">{{ formatMonth(bill.month, bill.year) }}</p>
                        </div>
                    </div>

                    <!-- Receipt Details (Only if PAID) -->
                    <div v-if="bill.status === 'PAID'" class="pt-6 mt-2 border-t border-dashed">
                        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle2 class="w-4 h-4 text-green-600" /> Rincian Transaksi
                        </h3>
                        <div class="space-y-3 text-sm">
                             <div class="flex justify-between">
                                <span class="text-muted-foreground">Waktu Pembayaran</span>
                                <span class="font-medium">{{ bill.paidAt ? formatDate(bill.paidAt) : '-' }}</span>
                            </div>
                            <div v-if="bill.transactionId" class="flex justify-between">
                                <span class="text-muted-foreground">Ref ID</span>
                                <span class="font-medium font-mono text-xs">{{ bill.transactionId }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">Metode</span>
                                <span class="font-medium uppercase">
                                    {{ 
                                        bill.paymentMethod === 'MANUAL_TRANSFER' 
                                            ? 'Static Qris' 
                                            : bill.paymentMethod === 'CASH'
                                                ? 'Tunai'
                                                : (bill.paymentMethod === 'MIDTRANS' || bill.paymentMethod === 'XENDIT')
                                                    ? 'Payment Gateway'
                                                    : (bill.paymentType?.replace('_', ' ') || bill.paymentMethod) 
                                    }}
                                </span>
                            </div>
                            <div v-if="bill.issuer" class="flex justify-between">
                                <span class="text-muted-foreground">Penyedia</span>
                                <span class="font-medium uppercase">{{ bill.issuer }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Methods Component -->
                    <PaymentMethods 
                        v-if="bill.status === 'UNPAID' && settings" 
                        :bill="bill" 
                        :settings="settings" 
                        @refresh="fetchBill"
                    />
                </CardContent>
            </Card>
        </div>
</template>
