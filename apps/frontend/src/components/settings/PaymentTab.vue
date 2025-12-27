<template>
  <div class="space-y-6">
    <!-- Manual Payment Section -->
    <div class="space-y-4 border rounded-lg p-4 bg-card">
      <div class="flex items-center justify-between">
        <label class="text-base font-semibold">Cash Payment</label>
        <div class="flex items-center">
            <input
                type="checkbox"
                v-model="form.manualPaymentEnabled"
                class="w-5 h-5 accent-primary"
            />
        </div>
      </div>
      <p class="text-sm text-muted-foreground">Aktifkan opsi pembayaran manual (Cash).</p>

      <div v-if="form.manualPaymentEnabled" class="space-y-2 pt-2">
        <Label>Instruksi Pembayaran / Info Rekening</Label>
        <textarea
          v-model="form.manualPaymentDetails"
          class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
          placeholder="Pembayaran Tunai masih dapat dilakukan dengan mendatangi menghubungi wa kami."
        ></textarea>
      </div>
    </div>

    <!-- QRIS Static Section -->
    <div class="space-y-4 border rounded-lg p-4 bg-card">
       <div class="flex items-center justify-between">
        <label class="text-base font-semibold">QRIS Static</label>
        <div class="flex items-center">
            <input
                type="checkbox"
                v-model="form.qrisPaymentEnabled"
                class="w-5 h-5 accent-primary"
            />
        </div>
      </div>
      <p class="text-sm text-muted-foreground">Tampilkan QRIS Static untuk pembayaran.</p>

      <div v-if="form.qrisPaymentEnabled" class="space-y-4 pt-2">
         <!-- Static Content -->
        <div class="mt-4 p-4 border border-border rounded-lg bg-secondary/10">
            <div class="space-y-2">
                <Label>QRIS Raw String</Label>
                <textarea
                  v-model="form.qrisRawString"
                  class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] font-mono"
                  placeholder="Paste QRIS text content here (00020101...)"
                ></textarea>
                <p class="text-[10px] text-muted-foreground">
                    String ini akan digunakan untuk generate QRIS dengan nominal dinamis sesuai tagihan.
                </p>
            </div>
        </div>
      </div>
    </div>
    <!-- Midtrans Payment Gateway -->
    <div class="space-y-4 border rounded-lg p-4 bg-card">
       <div class="flex items-center justify-between">
        <label class="text-base font-semibold">Midtrans Payment Gateway</label>
        <div class="flex items-center">
            <input
                type="checkbox"
                v-model="form.midtransEnabled"
                class="w-5 h-5 accent-primary"
            />
        </div>
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

    <!-- Xendit Payment Gateway -->
    <div class="space-y-4 border rounded-lg p-4 bg-card">
       <div class="flex items-center justify-between">
        <label class="text-base font-semibold">Xendit Payment Gateway</label>
        <div class="flex items-center">
            <input
                type="checkbox"
                v-model="form.xenditEnabled"
                class="w-5 h-5 accent-primary"
            />
        </div>
      </div>
      <p class="text-sm text-muted-foreground">Aktifkan pembayaran otomatis via Xendit (Payment Links / Invoices).</p>

      <div v-if="form.xenditEnabled" class="space-y-4 pt-2">
        <div class="space-y-2">
            <Label>Environment</Label>
            <select
                v-model="form.xenditEnvironment"
                class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ring-offset-background"
            >
                <option value="sandbox">Sandbox (Test)</option>
                <option value="production">Production (Live)</option>
            </select>
            <p class="text-[10px] text-muted-foreground">Pilih mode pengujian atau live. Mode ini menentukan jenis API Key yang harus dimasukkan.</p>
        </div>

        <div class="space-y-2">
          <Label>Secret Key</Label>
          <Input
            v-model="form.xenditSecretKey"
            placeholder="xnd_development_..."
            type="password"
          />
        </div>

        <div class="space-y-2">
          <Label>Validation Token (Optional)</Label>
          <Input
            v-model="form.xenditVerificationToken"
            placeholder="Webhook Verification Token"
            type="password"
          />
          <p class="text-[10px] text-muted-foreground">Digunakan untuk memvalidasi bahwa webhook benar-benar dari Xendit.</p>
        </div>

        <div class="space-y-2 pt-2 border-t border-border mt-2">
            <Label>Webhook URL</Label>
            <div class="flex items-center gap-2">
                <div class="relative flex-1">
                    <Input
                        :model-value="xenditWebhookUrl"
                        readonly
                        class="bg-secondary/50 font-mono text-xs pr-10"
                    />
                </div>
                 <Button size="icon" variant="outline" @click="copyUrl(xenditWebhookUrl)" title="Copy URL">
                    <Check v-if="copiedUrl === xenditWebhookUrl" class="w-4 h-4 text-green-500" />
                    <Copy v-else class="w-4 h-4" />
                </Button>
            </div>
            <p class="text-[10px] text-muted-foreground">
                Masukkan URL ini ke dashboard Xendit > Settings > Callbacks.
            </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Button from '@/components/ui/Button.vue'
import { Copy, Check } from 'lucide-vue-next'
import { UpdateSettingsDTO } from '@/types'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  form: UpdateSettingsDTO
}>()

const { toast } = useToast()
const copiedUrl = ref('')

const getBaseUrl = () => {
    const baseUrl = props.form.appUrl || window.location.origin
    return baseUrl.replace(/\/$/, '')
}

const midtransWebhookUrl = computed(() => `${getBaseUrl()}/api/payment/midtrans/webhook`)
const xenditWebhookUrl = computed(() => `${getBaseUrl()}/api/payment/xendit/webhook`)

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
</script>
