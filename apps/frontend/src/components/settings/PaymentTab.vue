<template>
  <div class="space-y-6">
    <!-- Manual Payment Section -->
    <div class="space-y-4 border rounded-lg p-4 bg-card">
      <div class="flex items-center justify-between">
        <Label class="text-base font-semibold">Cash Payment</Label>
        <Switch
            :checked="form.manualPaymentEnabled"
            @update:checked="val => form.manualPaymentEnabled = val"
        />
      </div>
      <p class="text-sm text-muted-foreground">Aktifkan opsi pembayaran manual (Cash).</p>

      <div v-if="form.manualPaymentEnabled" class="space-y-2 pt-2">
        <Label>Instruksi Pembayaran / Info Rekening</Label>
        <Textarea
          v-model="form.manualPaymentDetails"
          class="min-h-[100px]"
          placeholder="Pembayaran Tunai masih dapat dilakukan dengan mendatangi menghubungi wa kami."
        />
      </div>
    </div>

    <!-- QRIS Static Section -->
    <div class="space-y-4 border rounded-lg p-4 bg-card">
       <div class="flex items-center justify-between">
        <Label class="text-base font-semibold">QRIS Static</Label>
        <Switch
            :checked="form.qrisPaymentEnabled"
            @update:checked="val => form.qrisPaymentEnabled = val"
        />
      </div>
      <p class="text-sm text-muted-foreground">Tampilkan QRIS Static untuk pembayaran.</p>

      <div v-if="form.qrisPaymentEnabled" class="pt-2">
         <!-- Static Content -->
        <div class="flex flex-col md:flex-row gap-6">
            <!-- Left: Input -->
            <div class="space-y-2 flex-1">
                <Textarea
                  v-model="form.qrisRawString"
                  class="font-mono min-h-[160px]"
                  placeholder="Paste QRIS text content here (00020101...)"
                />
                <p class="text-[10px] text-muted-foreground">
                    String QRIS ini didapat dengan menscan gambar QR dengan QR Scanner.
                </p>
                
                <div v-if="form.qrisRawString" class="flex gap-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle class="w-4 h-4 shrink-0" />
                    <p class="leading-relaxed">
                        <strong>Verifikasi:</strong> Coba scan QR code di samping ini menggunakan aplikasi pembayaran untuk memastikan string valid.
                    </p>
                </div>
            </div>

            <!-- Right: Preview -->
            <div v-if="form.qrisRawString" class="shrink-0">
                <div class="bg-white p-2 rounded-lg border shadow-sm w-[160px] h-[160px] flex items-center justify-center">
                    <div v-if="isGeneratingQr" class="animate-pulse flex flex-col items-center gap-2">
                        <QrCode class="w-8 h-8 text-muted-foreground/50" />
                        <span class="text-[10px] text-muted-foreground">Generating...</span>
                    </div>
                    <img 
                        v-else-if="previewQrUrl" 
                        :src="previewQrUrl" 
                        alt="QR Preview" 
                        class="w-full h-full object-contain"
                    />
                    <div v-else class="text-center p-2">
                        <span class="text-[10px] text-muted-foreground">Invalid String</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    <!-- Midtrans Payment Gateway -->
    <div class="space-y-4 border rounded-lg p-4 bg-card">
       <div class="flex items-center justify-between">
        <Label class="text-base font-semibold">Midtrans Payment Gateway</Label>
        <Switch
            :checked="form.midtransEnabled"
            @update:checked="val => form.midtransEnabled = val"
        />
      </div>
      <p class="text-sm text-muted-foreground">Aktifkan pembayaran otomatis via Midtrans (QRIS, VA, E-Wallet).</p>

      <div v-if="form.midtransEnabled" class="space-y-4 pt-2">
        <div class="space-y-2">
            <Label>Environment</Label>
            <select
                v-model="form.midtransEnvironment"
                class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ring-offset-background"
            >
                <option value="sandbox">Sandbox (Test)</option>
                <option value="production">Production (Live)</option>
            </select>
        </div>

        <div class="space-y-2">
          <Label>Server Key</Label>
          <Input
            v-model="form.midtransServerKey"
            placeholder="SB-Mid-server-..."
            type="password"
          />
        </div>

        <div class="space-y-2">
          <Label>Client Key</Label>
          <Input
            v-model="form.midtransClientKey"
            placeholder="SB-Mid-client-..."
          />
        </div>

        <div class="space-y-2 pt-2 border-t border-border mt-2">
            <Label>Notification URL (Webhook)</Label>
            <div class="flex items-center gap-2">
                <div class="relative flex-1">
                    <Input
                        :model-value="midtransWebhookUrl"
                        readonly
                        class="bg-secondary/50 font-mono text-xs pr-10"
                    />
                </div>
                 <Button size="icon" variant="outline" @click="copyUrl(midtransWebhookUrl)" title="Copy URL">
                    <Check v-if="copiedUrl === midtransWebhookUrl" class="w-4 h-4 text-green-500" />
                    <Copy v-else class="w-4 h-4" />
                </Button>
            </div>
            <p class="text-[10px] text-muted-foreground">
                Copy URL ini dan masukkan ke dashboard Midtrans > Settings > Configuration > Notification URL.
            </p>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Label from '@/components/ui/Label.vue'
import Button from '@/components/ui/Button.vue'
import { Copy, Check, QrCode, AlertCircle } from 'lucide-vue-next'
import Switch from '@/components/ui/Switch.vue'
import type { UpdateSettingsDTO } from '@/types'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{
  form: UpdateSettingsDTO
}>()

const { toast } = useToast()
const authStore = useAuthStore()
const copiedUrl = ref('')

const getBaseUrl = () => {
    const baseUrl = props.form.appUrl || window.location.origin
    return baseUrl.replace(/\/$/, '')
}

const midtransWebhookUrl = computed(() => `${getBaseUrl()}/api/payment/midtrans/webhook`)


const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    copiedUrl.value = url
    toast({
        title: 'Berhasil',
        description: 'URL berhasil disalin!',
        variant: 'success'
    })
    setTimeout(() => {
        copiedUrl.value = ''
    }, 2000)
}

// QR Preview Logic
const previewQrUrl = ref('')
const isGeneratingQr = ref(false)

const updateQrPreview = useDebounceFn(async (content: string) => {
    if (!content) {
        previewQrUrl.value = ''
        return
    }

    isGeneratingQr.value = true
    try {
        const res = await fetch('/api/settings/preview-qris', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.token}`
            },
            body: JSON.stringify({ content })
        })

        if (!res.ok) throw new Error('Failed to generate preview')
        
        const blob = await res.blob()
        if (previewQrUrl.value) URL.revokeObjectURL(previewQrUrl.value)
        previewQrUrl.value = URL.createObjectURL(blob)
    } catch (e) {
        console.error(e)
    } finally {
        isGeneratingQr.value = false
    }
}, 800)

// Watch for changes in qrisRawString
watch(() => props.form.qrisRawString, (newVal) => {
    updateQrPreview(newVal || '')
}, { immediate: true })

</script>
