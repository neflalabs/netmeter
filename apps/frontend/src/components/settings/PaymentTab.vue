<template>
  <div class="space-y-6">
    <!-- Manual Payment Section -->
    <div class="space-y-4 border rounded-lg p-4 bg-card">
      <div class="flex items-center justify-between">
        <label class="text-base font-semibold">Transfer Manual / Tunai</label>
        <div class="flex items-center">
            <input 
                type="checkbox" 
                v-model="form.manualPaymentEnabled"
                class="w-5 h-5 accent-primary" 
            />
        </div>
      </div>
      <p class="text-sm text-muted-foreground">Aktifkan opsi pembayaran manual (Transfer Bank / Cash).</p>

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
        <div class="mt-4 p-4 border-2 border-dashed border-border rounded-lg text-center bg-secondary/20">
            <div v-if="form.qrisStaticImage" class="mb-4 relative inline-block group">
                <img :src="form.qrisStaticImage" alt="QRIS" class="max-h-48 rounded shadow-sm" />
                <button 
                    @click="form.qrisStaticImage = ''"
                    class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <X class="w-4 h-4" />
                </button>
            </div>
            
            <div v-else>
                <p class="text-sm text-muted-foreground mb-4">Upload gambar QRIS (Max 500KB)</p>
            </div>

            <div class="flex justify-center">
                <input 
                    type="file" 
                    ref="fileInput" 
                    class="hidden" 
                    accept="image/*"
                    @change="handleUpload"
                />
                <Button size="sm" variant="outline" @click="triggerFileInput">
                    <Upload class="w-4 h-4 mr-2" />
                    {{ form.qrisStaticImage ? 'Ganti Gambar' : 'Pilih Gambar' }}
                </Button>
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
                        :model-value="notificationUrl" 
                        readonly 
                        class="bg-secondary/50 font-mono text-xs pr-10"
                    />
                </div>
                 <Button size="icon" variant="outline" @click="copyNotificationUrl" title="Copy URL">
                    <Check v-if="isCopied" class="w-4 h-4 text-green-500" />
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
import { ref, computed } from 'vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Button from '@/components/ui/Button.vue'
import { Upload, X, Copy, Check } from 'lucide-vue-next'
import { UpdateSettingsDTO } from '@/types'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  form: UpdateSettingsDTO
}>()

const { toast } = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const isCopied = ref(false)

const notificationUrl = computed(() => {
    // Prefer App URL from settings, fallback to current origin
    const baseUrl = props.form.appUrl || window.location.origin
    // Remove trailing slash if present
    const cleanUrl = baseUrl.replace(/\/$/, '')
    return `${cleanUrl}/api/payment/notification`
})

const copyNotificationUrl = () => {
    navigator.clipboard.writeText(notificationUrl.value)
    isCopied.value = true
    toast({
        title: 'Berhasil',
        description: 'URL Notifikasi berhasil disalin!',
        variant: 'success'
    })
    setTimeout(() => {
        isCopied.value = false
    }, 2000)
}

const triggerFileInput = () => {
    fileInput.value?.click()
}

const handleUpload = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) return

    const file = target.files[0]
    
    // Validate file size (max 500KB for Base64 safety in SQLite)
    if (file.size > 500 * 1024) {
        alert('Ukuran gambar terlalu besar. Maksimal 500KB.')
        if (target) target.value = ''
        return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        if (e.target?.result) {
            props.form.qrisStaticImage = e.target.result as string
        }
    }
    reader.readAsDataURL(file)
    
    // Reset input
    if (target) target.value = ''
}
</script>
