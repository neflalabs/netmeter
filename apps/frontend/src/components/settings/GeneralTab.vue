<template>
    <div class="space-y-4">
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <Label for="appTitle">Nama Aplikasi</Label>
                    <Input id="appTitle" v-model="form.appTitle" placeholder="NetMeter" />
                </div>
                <div class="space-y-2">
                    <Label for="appSubtitle">Subtitle Home</Label>
                    <Input id="appSubtitle" v-model="form.appSubtitle" placeholder="Patungan WiFi..." />
                </div>
            </div>

            <div class="space-y-2">
                <Label for="appUrl">App URL / Public Domain</Label>
                <Input id="appUrl" v-model="form.appUrl" placeholder="https://net.home.npx.my.id" />
                <p class="text-[10px] text-muted-foreground">
                    URL publik aplikasi ini. Digunakan untuk generate link WhatsApp dan Webhook.
                </p>
            </div>

            <div class="space-y-2">
                <Label for="adminPhone">Nomor WhatsApp Admin</Label>
                <Input id="adminPhone" v-model="form.adminPhoneNumber" placeholder="628..." />
                <p class="text-[10px] text-muted-foreground">
                    Nomor ini akan menerima notifikasi sistem dan konfirmasi pembayaran manual.
                </p>
            </div>

            <div class="space-y-2">
                <Label for="listingLimit">Jumlah Listing di Homepage</Label>
                <Input id="listingLimit" type="number" v-model="form.listingPerHome" placeholder="10" />
                <p class="text-[10px] text-muted-foreground">
                    Menentukan berapa banyak data (tagihan/user) yang ditampilkan di halaman utama.
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import type { UpdateSettingsDTO } from '@/types'

defineProps<{
    form: UpdateSettingsDTO
}>()
</script>
