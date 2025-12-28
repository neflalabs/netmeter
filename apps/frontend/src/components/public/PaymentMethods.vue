<script setup lang="ts">
import { computed, ref } from 'vue'
import { CreditCard, Banknote, Phone, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import { formatPhoneForWhatsapp } from '@/utils/phone'
import { useToast } from '@/composables/useToast'
import { useFormatters } from '@/composables/useFormatters'

interface Props {
  bill: any
  settings: any
}

const props = defineProps<Props>()
const emit = defineEmits(['refresh'])
const { toast } = useToast()
const { formatCurrency } = useFormatters()

const isPaying = ref(false)
const isResetting = ref(false)

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
    if (!props.settings || !props.bill) return;

    isPaying.value = true;
    try {
        await loadSnapScript(props.settings.midtransClientKey, props.settings.midtransEnvironment);
        const res = await fetch(`/api/payment/snap/${props.bill.id}`, { method: 'POST' });
        if (!res.ok) throw new Error('Gagal membuat transaksi');
        const data = await res.json();

        (window as any).snap.pay(data.token, {
            onSuccess: async () => {
                toast({ title: 'Pembayaran Berhasil!', description: 'Terima kasih, pembayaran Anda telah kami terima.', variant: 'success' });
                setTimeout(() => { window.location.reload(); }, 2000);
            },
            onPending: () => {
                toast({ title: 'Menunggu Pembayaran', description: 'Silakan selesaikan pembayaran Anda.', variant: 'default' });
            },
            onError: () => {
                toast({ title: 'Pembayaran Gagal', description: 'Maaf, terjadi kesalahan saat memproses pembayaran.', variant: 'destructive' });
            },
            onClose: () => { isPaying.value = false; }
        });
    } catch (e: any) {
        console.error(e);
        toast({ title: 'Kesalahan', description: e.message || 'Terjadi kesalahan saat memproses pembayaran', variant: 'destructive' });
        isPaying.value = false;
    }
}

const payWithXendit = async () => {
    if (!props.settings || !props.bill) return;

    isPaying.value = true;
    try {
        const res = await fetch(`/api/payment/xendit/invoice/${props.bill.id}`, { method: 'POST' });
        if (!res.ok) throw new Error('Gagal membuat transaksi Xendit');
        const data = await res.json();
        if (data.invoice_url) {
            window.location.href = data.invoice_url;
        } else {
            throw new Error('Link pembayaran tidak ditemukan');
        }
    } catch (e: any) {
        console.error(e);
        toast({ title: 'Kesalahan', description: e.message || 'Terjadi kesalahan saat memproses pembayaran Xendit', variant: 'destructive' });
        isPaying.value = false;
    }
}

const resetTransaction = async () => {
    if (!props.bill || isResetting.value) return;
    if (!confirm('Apakah Anda yakin ingin membatalkan transaksi ini dan mencoba lagi?')) return;

    isResetting.value = true;
    try {
        const res = await fetch(`/api/payment/cancel/${props.bill.id}`, { method: 'POST' });
        if (res.ok) {
            toast({ title: 'Transaksi Dibatalkan', description: 'Silakan pilih metode pembayaran baru.', variant: 'default' });
            emit('refresh');
        } else {
            throw new Error('Gagal membatalkan transaksi');
        }
    } catch (e: any) {
        toast({ title: 'Kesalahan', description: e.message || 'Gagal membatalkan transaksi', variant: 'destructive' });
    } finally {
        isResetting.value = false;
    }
}

const confirmPaymentWaLink = computed(() => {
    if (!props.bill) return '#'
    const phone = props.bill.adminPhone || '08123456789'
    const text = `Halo, saya sudah melakukan pembayaran patungan WiFi atas nama *${props.bill.userName}* sebesar *Rp ${formatCurrency(props.bill.amount)}* via Static QRIS. Mohon diverifikasi.`
    return `https://wa.me/${formatPhoneForWhatsapp(phone)}?text=${encodeURIComponent(text)}`
})

const confirmWaLink = computed(() => {
    if (!props.bill) return '#'
    const phone = props.bill.adminPhone || '08123456789'
    const text = `Posisi? mau bayar wifi...`
    return `https://wa.me/${formatPhoneForWhatsapp(phone)}?text=${encodeURIComponent(text)}`
})
</script>

<template>
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

        <div class="mt-4 text-xs text-left bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-200 flex gap-2">
            <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" />
            <p>
                <strong>Otomatis:</strong> Pembayaran ini akan <b>diverifikasi otomatis</b> oleh sistem. Anda tidak perlu mengirim bukti transfer.
            </p>
        </div>
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

    <!-- Xendit Pay Button -->
     <div v-if="settings.xenditEnabled" class="mb-8">
        <Button 
            class="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" 
            size="lg" 
            @click="payWithXendit" 
            :disabled="isPaying"
        >
            <span v-if="isPaying" class="animate-spin mr-2">⏳</span>
            {{ isPaying ? 'Memproses...' : 'Bayar via Xendit (Otomatis)' }}
        </Button>
         <p class="text-xs text-center text-muted-foreground mt-2">
            Mendukung QRIS, GoPay, ShopeePay, Dana, OVO, dan Virtual Account Bank.
        </p>

        <div class="mt-4 text-xs text-left bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-200 flex gap-2">
            <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" />
            <p>
                <strong>Otomatis:</strong> Pembayaran ini akan <b>diverifikasi otomatis</b> oleh sistem. Anda tidak perlu mengirim bukti transfer.
            </p>
        </div>
    </div>

    <!-- Separator 1: Auto PG vs Others -->
    <div v-if="(settings.midtransEnabled || settings.xenditEnabled) && (settings.qrisPaymentEnabled || settings.manualPaymentEnabled)" class="relative my-8">
        <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t border-border"></span>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-2 text-muted-foreground">Atau</span>
        </div>
    </div>
    
    <div class="space-y-8">
        <!-- QRIS -->
        <div v-if="settings.qrisPaymentEnabled" class="flex flex-col items-center space-y-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border inline-block relative mt-4">
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    STATIC QRIS
                </div>
                <img 
                    :src="`/api/public/qris?amount=${bill.amount}`" 
                    alt="QRIS Code" 
                    class="max-w-[240px] h-auto rounded-lg" 
                />
            </div>
            <div class="text-center space-y-3 max-w-xs">
                <p class="text-xs text-muted-foreground font-medium bg-secondary/50 px-3 py-1 rounded-full inline-block">
                    Scan via GoPay / Dana / LinkAja atau Aplikasi Bank
                </p>
                
                 <div class="text-xs text-left bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200 flex gap-2">
                    <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                        <strong>Penting:</strong> Setelah melakukan pembayaran, mohon <b>konfirmasi ke admin</b> via WhatsApp agar tagihan segera diverifikasi.
                    </p>
                </div>
                
                <Button class="w-full bg-green-600 hover:bg-green-700 text-white" size="sm" as="a" :href="confirmPaymentWaLink" target="_blank">
                    <Phone class="w-4 h-4 mr-2" /> Konfirmasi Pembayaran
                </Button>
            </div>
        </div>
        
        <!-- Separator 2: QRIS vs Manual -->
        <div v-if="settings.qrisPaymentEnabled && settings.manualPaymentEnabled" class="relative">
            <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t border-border"></span>
            </div>
            <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-card px-2 text-muted-foreground">Atau</span>
            </div>
        </div>

        <!-- Manual Transfer -->
        <div v-if="settings.manualPaymentEnabled" class="text-center">
            <div class="border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-6 rounded-xl space-y-4">
                <div class="flex justify-center">
                    <div class="bg-background p-3 rounded-full shadow-sm">
                        <Banknote class="w-6 h-6 text-primary" />
                    </div>
                </div>
                <div>
                    <h4 class="font-semibold text-sm mb-1">Pembayaran Tunai</h4>
                    <p class="text-xs text-muted-foreground mb-4">
                        Tidak ingin menggunakan pembayaran otomatis? Silakan lakukan pembayaran tunai dengan menghubungi admin.
                    </p>
                    <div class="bg-background/80 p-3 rounded-lg border text-sm font-medium">
                        {{ settings.manualPaymentDetails }}
                    </div>
                </div>
                 <Button class="w-full" variant="secondary" as="a" :href="confirmWaLink" target="_blank">
                    <Phone class="w-4 h-4 mr-2" />Hubungi Admin
                </Button>
            </div>
        </div>
    </div>
  </div>
</template>
