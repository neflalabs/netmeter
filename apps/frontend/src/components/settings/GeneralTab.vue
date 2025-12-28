<template>
    <div class="space-y-4">
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <Label for="appTitle">Application Name</Label>
                    <Input id="appTitle" v-model="form.appTitle" placeholder="NetMeter" />
                </div>
                <div class="space-y-2">
                    <Label for="appSubtitle">Subtitle Home</Label>
                    <Input id="appSubtitle" v-model="form.appSubtitle" placeholder="Patungan WiFi..." />
                </div>
            </div>

            <div class="space-y-2">
                <Label for="appUrl">App URL / Public Domain</Label>
                <Input id="appUrl" v-model="form.appUrl" placeholder="https://your.url.com" />
                <p class="text-[10px] text-muted-foreground">
                    Public URL. For generate link WhatsApp and Webhook.
                </p>
            </div>

            <div class="space-y-2">
                <Label for="adminPhone">Admin WhatsApp Number</Label>
                <Input id="adminPhone" v-model="form.adminPhoneNumber" placeholder="628..." />
                <p class="text-[10px] text-muted-foreground">
                    Nomor ini akan menerima notifikasi sistem dan konfirmasi pembayaran manual.
                </p>
            </div>

            <div class="space-y-2">
                <Label for="listingLimit">Homepage listing</Label>
                <Input id="listingLimit" type="number" v-model="form.listingPerHome" placeholder="10" />
                <p class="text-[10px] text-muted-foreground">
                    To determine how many (tagihan/user)displayed on main page.
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
