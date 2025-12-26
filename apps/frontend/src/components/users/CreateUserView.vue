<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Save, BellRing, RefreshCcw, Check, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import type { CreateUserDTO } from '@/types'
import Switch from '@/components/ui/Switch.vue'
import { whatsappApi } from '@/api'


import { useToast } from '@/composables/useToast'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const { toast } = useToast()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const isLoading = ref(false)
const globalSettings = computed(() => settingsStore.settings)

const form = ref<CreateUserDTO>({
    name: '',
    whatsapp: '',
    pppoeUsername: '',
    address: '',
    deviceModel: '',
    notes: '',
    joinedAt: '',
    dueDay: undefined,
    reminderInterval: undefined,
    reminderEnabled: true
})

const isCheckingPhone = ref(false)
const phoneVerified = ref(false)
const phoneExists = ref(false)

const waApi = whatsappApi()

const handleCheckPhone = async () => {
    if (!form.value.whatsapp) return
    
    isCheckingPhone.value = true
    try {
        const res = await waApi.checkPhone(form.value.whatsapp) as any
        phoneExists.value = res.exists
        phoneVerified.value = true
        
        if (res.exists) {
            toast({
                title: 'Nomor Valid',
                description: 'Nomor terdaftar di WhatsApp.',
                variant: 'success'
            })
        } else {
            toast({
                title: 'Nomor Tidak Valid',
                description: 'Nomor TIDAK terdaftar di WhatsApp.',
                variant: 'destructive'
            })
        }
    } catch (err) {
        console.error('Check phone failed', err)
        toast({
            title: 'Gagal Cek',
            description: 'Terjadi kesalahan saat mengecek nomor.',
            variant: 'destructive'
        })
    } finally {
        isCheckingPhone.value = false
    }
}

onMounted(async () => {
    try {
        const settings = await settingsStore.fetchSettings()
        if (settings && settings.monthlyFee <= 0) {
            toast({
                title: 'Perhatian',
                description: 'Harga langganan belum diatur! Anda mungkin tidak bisa membuat user baru.',
                variant: 'destructive',
            })
        }
    } catch (e) {
        console.error('Failed to check settings', e)
    }
})

const handleSubmit = async () => {
    isLoading.value = true
    // Basic validation
    if (!form.value.name || !form.value.whatsapp) {
        toast({
            title: 'Validasi Gagal',
            description: 'Nama dan WhatsApp wajib diisi!',
            variant: 'destructive'
        })
        isLoading.value = false
        return
    }

    try {
        await userStore.createUser(form.value)
        toast({
            title: 'Berhasil',
            description: 'User baru telah dibuat.',
            variant: 'success'
        })
        router.push('/users')
    } catch (e: any) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- Header -->
    <Header 
        title="Tambah User Baru" 
        subtitle="Catat pelanggan WiFi baru"
        :show-back="true"
    />

    <main class="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
            <CardHeader>
                <CardTitle class="text-base">Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="space-y-2">
                    <Label for="name">Nama Lengkap</Label>
                    <Input id="name" v-model="form.name" placeholder="Contoh: Budi Santoso" />
                </div>
                
                <div class="space-y-2">
                    <Label for="wa">Nomor WhatsApp</Label>
                    <div class="relative flex items-center">
                         <span class="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">+62</span>
                        <Input 
                            id="wa" 
                            v-model="form.whatsapp" 
                            class="pl-12 pr-20" 
                            placeholder="8123xxxxxxx" 
                            type="tel" 
                            @input="phoneVerified = false"
                        />
                        <div class="absolute right-1 flex items-center gap-1">
                            <div v-if="phoneVerified" class="mr-1">
                                <Check v-if="phoneExists" class="w-4 h-4 text-emerald-500" />
                                <X v-else class="w-4 h-4 text-destructive" />
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                class="h-8 px-2 text-[10px] font-bold text-primary hover:bg-primary/10"
                                @click="handleCheckPhone"
                                :disabled="isCheckingPhone || !form.whatsapp"
                            >
                                <RefreshCcw v-if="isCheckingPhone" class="w-2.5 h-2.5 mr-1 animate-spin" />
                                CHECK
                            </Button>
                        </div>
                    </div>
                    <p class="text-[10px]" :class="phoneVerified && !phoneExists ? 'text-destructive' : 'text-muted-foreground'">
                        {{ phoneVerified && !phoneExists ? 'Nomor ini tidak terdaftar di WhatsApp!' : 'Nomor ini akan digunakan untuk notifikasi tagihan.' }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label for="pppoe">Username PPPoE</Label>
                    <Input id="pppoe" v-model="form.pppoeUsername" placeholder="Contoh: budi_home" />
                    <p class="text-[10px] text-muted-foreground">Username yang terdaftar di Mikrotik/Router.</p>
                </div>

                <div class="space-y-2">
                    <Label for="address">Alamat Lengkap</Label>
                    <Input id="address" v-model="form.address" placeholder="Contoh: Jl. Mawar No. 12" />
                </div>

                <div class="space-y-2">
                    <Label for="device">Model Perangkat (ONT/Router)</Label>
                    <Input id="device" v-model="form.deviceModel" placeholder="Contoh: Huawei HG8245H5" />
                </div>

                <div class="space-y-2">
                    <Label for="joinedAt">Tanggal Bergabung</Label>
                    <Input id="joinedAt" v-model="form.joinedAt" type="date" />
                    <p class="text-[10px] text-muted-foreground">Tanggal saat pelanggan pertama kali join (opsional).</p>
                </div>

                <div class="space-y-2">
                    <Label for="notes">Catatan Tambahan</Label>
                    <Input id="notes" v-model="form.notes" placeholder="Catatan khusus pelanggan ini..." />
                </div>

                <!-- Notification Settings -->
                <div class="pt-6 mt-6 border-t border-border space-y-4">
                    <h3 class="text-sm font-semibold flex items-center gap-2">
                        <BellRing class="w-4 h-4 text-primary" /> Pengaturan Notifikasi
                    </h3>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label for="dueDay">Jatuh Tempo (Tgl)</Label>
                            <Input id="dueDay" type="number" v-model="form.dueDay" :placeholder="globalSettings?.globalDueDay ? `Global (Tgl ${globalSettings.globalDueDay})` : 'Global'" min="1" max="31" />
                            <p class="text-[10px] text-muted-foreground italic">Kosongkan untuk ikut global</p>
                        </div>
                        <div class="space-y-2">
                            <Label for="reminder">Interval Pengingat</Label>
                            <Input id="reminder" type="number" v-model="form.reminderInterval" :placeholder="globalSettings?.globalReminderInterval ? `Global (${globalSettings.globalReminderInterval} hari)` : 'Global'" min="1" />
                            <p class="text-[10px] text-muted-foreground italic">Interval hari antar pesan</p>
                        </div>
                    </div>

                    <div class="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                        <div class="space-y-0.5">
                            <Label class="text-xs font-medium">Aktifkan Reminder</Label>
                            <p class="text-[10px] text-muted-foreground">Kirim pesan pengingat otomatis</p>
                        </div>
                        <Switch :model-value="!!form.reminderEnabled" @update:model-value="(val: boolean) => form.reminderEnabled = val" />
                    </div>
                </div>

                <div class="pt-4">
                    <Button class="w-full" @click="handleSubmit" :disabled="isLoading">
                        <Save class="w-4 h-4 mr-2" />
                        {{ isLoading ? 'Menyimpan...' : 'Simpan User' }}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </main>
    <Footer />
  </div>
</template>
