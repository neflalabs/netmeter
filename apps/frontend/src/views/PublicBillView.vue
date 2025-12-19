
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { CheckCircle2, AlertCircle, CreditCard, Phone } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import PublicLayout from '@/layouts/PublicLayout.vue'
import { formatPhoneForWhatsapp } from '@/utils/phone'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()
const route = useRoute()
const token = route.params.token as string
const isLoading = ref(true)
const error = ref('')
const bill = ref<any>(null)

const formatDate = (val: string) => {
    return new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val)
}

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatMonth = (m: number, y: number) => {
    return `${months[m-1]} ${y}`;
}



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

const confirmWaLink = computed(() => {
    if (!bill.value) return '#'
    const phone = bill.value.adminPhone || '08123456789'
    const text = `Posisi? mau bayar wifi...`
    return `https://wa.me/${formatPhoneForWhatsapp(phone)}?text=${encodeURIComponent(text)}`
})

const settings = ref<any>(null)

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

// Midtrans Logic
const isPaying = ref(false)

const loadSnapScript = (clientKey: string, env: string) => {
    return new Promise((resolve, reject) => {
        if ((window as any).snap) return resolve(true);

        const script = document.createElement('script');
        const src = env === 'production' 
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        
        script.src = src;
        script.setAttribute('data-client-key', clientKey);
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Snap.js'));
        document.body.appendChild(script);
    });
}

const payWithMidtrans = async () => {
    if (!settings.value || !bill.value) return;

    isPaying.value = true;
    try {
        // 1. Load Script
        await loadSnapScript(settings.value.midtransClientKey, settings.value.midtransEnvironment);

        // 2. Get Token
        const res = await fetch(`/api/payment/snap/${bill.value.id}`, {
            method: 'POST'
        });
        
        if (!res.ok) throw new Error('Gagal membuat transaksi');
        const data = await res.json();

        // 3. Open Snap
        (window as any).snap.pay(data.token, {
            onSuccess: async () => {
                toast({
                    title: 'Pembayaran Berhasil!',
                    description: 'Terima kasih, pembayaran Anda telah kami terima.',
                    variant: 'success'
                });
                // Wait 2 seconds before reload to let user see toast
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            },
            onPending: () => {
                toast({
                    title: 'Menunggu Pembayaran',
                    description: 'Silakan selesaikan pembayaran Anda.',
                    variant: 'default'
                });
            },
            onError: () => {
                toast({
                    title: 'Pembayaran Gagal',
                    description: 'Maaf, terjadi kesalahan saat memproses pembayaran.',
                    variant: 'destructive'
                });
            },
            onClose: () => {
                isPaying.value = false;
            }
        });

    } catch (e: any) {
        console.error(e);
        toast({
            title: 'Kesalahan',
            description: e.message || 'Terjadi kesalahan saat memproses pembayaran',
            variant: 'destructive'
        });
        isPaying.value = false;
    }
}

const isResetting = ref(false);
const resetTransaction = async () => {
    if (!bill.value || isResetting.value) return;

    if (!confirm('Apakah Anda yakin ingin membatalkan transaksi ini dan mencoba lagi?')) return;

    isResetting.value = true;
    try {
        const res = await fetch(`/api/payment/cancel/${bill.value.id}`, {
            method: 'POST'
        });
        
        if (res.ok) {
            toast({
                title: 'Transaksi Dibatalkan',
                description: 'Silakan pilih metode pembayaran baru.',
                variant: 'default'
            });
            await fetchBill();
        } else {
            throw new Error('Gagal membatalkan transaksi');
        }
    } catch (e: any) {
        toast({
            title: 'Kesalahan',
            description: e.message || 'Gagal membatalkan transaksi',
            variant: 'destructive'
        });
    } finally {
        isResetting.value = false;
    }
}
</script>

<template>
    <PublicLayout>
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
                <p class="text-sm opacity-90">Terima kasih telah melakukan pembayaran tepat waktu.</p>
            </div>

            <div v-else-if="bill.paymentStatus === 'PENDING'" class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 p-6 rounded-lg flex flex-col items-center text-center">
                <div class="animate-pulse bg-yellow-400 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <CreditCard class="w-6 h-6 text-yellow-900" />
                </div>
                <h1 class="text-xl font-bold mb-1 uppercase">Menunggu Verifikasi</h1>
                <p class="text-sm opacity-90">Sistem mendeteksi transaksi sedang diproses. Jika sudah bayar, silakan tunggu atau refresh halaman.</p>
                <Button variant="outline" size="sm" class="mt-4 border-yellow-500 text-yellow-700 hover:bg-yellow-50" @click="fetchBill">Cek Status Terbaru</Button>
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
                            <p class="text-sm text-muted-foreground mb-1">Total Tagihan</p>
                            <div class="text-3xl font-bold text-primary">Rp {{ formatCurrency(bill.amount) }}</div>
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
                            <p class="font-medium">{{ formatMonth(bill.month, bill.year) }}</p>
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
                            <div v-if="bill.paymentMethod !== 'CASH'" class="flex justify-between">
                                <span class="text-muted-foreground">Metode</span>
                                <span class="font-medium uppercase">{{ bill.paymentType?.replace('_', ' ') || bill.paymentMethod }}</span>
                            </div>
                            <div v-if="bill.issuer" class="flex justify-between">
                                <span class="text-muted-foreground">Penyedia</span>
                                <span class="font-medium uppercase">{{ bill.issuer }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Info (Only if UNPAID) -->
                    <div v-if="bill.status === 'UNPAID' && settings" class="mt-8 pt-8 border-t border-border">
                        <div class="text-center mb-6">
                            <h3 class="font-semibold text-lg flex items-center justify-center gap-2 mb-1">
                                <CreditCard class="w-5 h-5" /> Info Pembayaran
                            </h3>
                        </div>

                        <!-- Midtrans Pay Button -->
                         <div v-if="settings.midtransEnabled" class="mb-8">
                            <Button 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" 
                                size="lg" 
                                @click="payWithMidtrans" 
                                :disabled="isPaying || bill.paymentStatus === 'PENDING'"
                            >
                                <span v-if="isPaying" class="animate-spin mr-2">⏳</span>
                                {{ bill.paymentStatus === 'PENDING' ? 'Ada Transaksi Berjalan' : (isPaying ? 'Memproses...' : 'Bayar Sekarang (Otomatis)') }}
                            </Button>
                             <p class="text-xs text-center text-muted-foreground mt-2">
                                Mendukung QRIS, GoPay, ShopeePay, Dana, OVO, dan lainnya.
                            </p>
                            <div v-if="bill.paymentStatus === 'PENDING'" class="text-center mt-4">
                                <button 
                                    @click="resetTransaction" 
                                    class="text-xs text-destructive hover:underline font-medium"
                                    :disabled="isResetting"
                                >
                                    {{ isResetting ? 'Membatalkan...' : 'Ganti Metode / Bayar Ulang?' }}
                                </button>
                            </div>
                        </div>
                        
                        <div class="space-y-8">
                            <!-- QRIS -->
                            <div v-if="settings.qrisPaymentEnabled && settings.qrisStaticImage" class="flex flex-col items-center">
                                <div class="bg-white p-4 rounded-xl shadow-sm border inline-block">
                                    <img :src="settings.qrisStaticImage" alt="QRIS Code" class="max-w-[240px] h-auto rounded-lg" />
                                </div>
                                <p class="text-xs text-muted-foreground mt-3 font-medium bg-secondary/50 px-3 py-1 rounded-full">
                                    Scan via GoPay / OVO / Dana / LinkAja
                                </p>
                            </div>

                            <!-- Manual Transfer -->
                            <div v-if="settings.manualPaymentEnabled" class="text-center">
                                <p class="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider text-[10px]">Bayar Tunai?</p>
                                <div class="bg-secondary/30 p-4 rounded-xl inline-block min-w-[200px]">
                                    <p class="font-medium text-lg">{{ settings.manualPaymentDetails }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6">
                            <Button class="w-full" size="lg" as="a" :href="confirmWaLink" target="_blank">
                                 <Phone class="w-4 h-4 mr-2" />Cari atmin
                            </Button>
                            <p class="text-xs text-center text-muted-foreground mt-2">
info posisi admin...
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </PublicLayout>
</template>
