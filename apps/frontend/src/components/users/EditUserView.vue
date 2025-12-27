<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Save, BellRing } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import type { UpdateUserDTO } from '@/types'
import Switch from '@/components/ui/Switch.vue'

import { useToast } from '@/composables/useToast'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const route = useRoute()
const { toast } = useToast()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const isLoading = ref(false)
const isFetching = ref(true)
const userId = parseInt(route.params.id as string)
const globalSettings = computed(() => settingsStore.settings)

const form = ref<UpdateUserDTO>({
    name: '',
    whatsapp: '',
    pppoeUsername: '',
    address: '',
    deviceModel: '',
    notes: '',
    joinedAt: '',
    status: 'ACTIVE' as const,
    dueDay: undefined,
    reminderInterval: undefined,
    reminderEnabled: true
})

const fetchUser = async () => {
    isFetching.value = true
    try {
        // Find user from store or fetch if needed
        let user = userStore.users.find(u => u.id === userId)
        if (!user) {
            await userStore.fetchUsers()
            user = userStore.users.find(u => u.id === userId)
        }
        
        if (!user) {
            router.push('/users')
            return
        }

        // Also fetch global settings for placeholders
        await settingsStore.fetchSettings()

        form.value = {
            name: user.name,
            whatsapp: user.whatsapp,
            pppoeUsername: user.pppoeUsername || '',
            address: user.address || '',
            deviceModel: user.deviceModel || '',
            notes: user.notes || '',
            joinedAt: user.joinedAt ? new Date(user.joinedAt).toISOString().split('T')[0] : '',
            status: user.status,
            dueDay: user.dueDay || undefined,
            reminderInterval: user.reminderInterval || undefined,
            reminderEnabled: user.reminderEnabled ?? true
        }
    } catch (e) {
        console.error('Failed to fetch user', e)
        router.push('/users')
    } finally {
        isFetching.value = false
    }
}

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
        await userStore.updateUser(userId, form.value)
        toast({
            title: 'Berhasil',
            description: 'Data user berhasil diperbarui.',
            variant: 'success'
        })
        router.push('/users')
    } catch (e: any) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchUser()
})
</script>

<template>
  <div class="min-h-screen bg-background pb-20 md:pb-6 flex">
    <!-- Desktop Sidebar -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-w-0 overflow-x-hidden">
        <!-- Header -->
        <Header 
            title="Edit User" 
            subtitle="Ubah informasi pelanggan"
            :show-back="true"
            back-to="/users"
        />

        <main class="container mx-auto px-4 py-6 md:max-w-4xl w-full">
            <div v-if="isFetching" class="p-8 text-center text-muted-foreground animate-pulse">
                Memuat data...
            </div>

            <Card v-else>
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
                        <div class="relative">
                             <span class="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">+62</span>
                            <Input id="wa" v-model="form.whatsapp" class="pl-12" placeholder="8123xxxxxxx" type="tel" />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label for="pppoe">Username PPPoE</Label>
                        <Input id="pppoe" v-model="form.pppoeUsername" placeholder="Contoh: budi_home" />
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
                        <Label for="status">Status</Label>
                        <select 
                            id="status" 
                            v-model="form.status"
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                    </div>

                    <div class="space-y-2">
                        <Label for="joinedAt">Tanggal Bergabung</Label>
                        <Input id="joinedAt" v-model="form.joinedAt" type="date" />
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
                            {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
  </div>
</template>
