<template>
    <div class="space-y-8" v-if="form">
        <!-- Main Status: Glassmorphism Action Header -->
        <div class="relative overflow-hidden p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 shadow-sm group">
            <div class="absolute top-0 right-0 -m-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700"></div>
            
            <div class="relative flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                        <BellRing class="w-7 h-7" />
                    </div>
                    <div>
                        <h4 class="font-bold text-base tracking-tight">Status Notifikasi Global</h4>
                        <p class="text-xs text-muted-foreground mt-0.5">Kontrol pengiriman pesan WhatsApp otomatis ke pelanggan.</p>
                    </div>
                </div>
                <Switch v-model="form.waEnabled" class="scale-110" />
            </div>
        </div>

        <transition name="fade-slide">
            <div v-if="form.waEnabled" class="space-y-8">
                <!-- Group 1: Automated Messaging -->
                <section class="space-y-4">
                    <div class="flex items-center gap-2 px-1">
                        <div class="w-1.5 h-4 bg-primary rounded-full"></div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Automated Messaging</h3>
                    </div>

                    <div class="grid gap-4">
                        <!-- New Bill Card -->
                        <Card class="group overflow-hidden border-none bg-secondary/30 hover:bg-secondary/50 transition-colors shadow-none border-l-4 border-l-blue-500/50">
                            <CardContent class="p-5 space-y-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                            <Receipt class="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span class="text-sm font-semibold">Notifikasi Tagihan Baru</span>
                                            <div v-if="form.autoNotifyNewBill" class="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                                <Clock class="w-3 h-3" /> Dikirim pukul {{ form.autoBillTime }}
                                            </div>
                                        </div>
                                    </div>
                                    <Switch v-model="form.autoNotifyNewBill" />
                                </div>

                                <transition name="expand">
                                    <div v-if="form.autoNotifyNewBill" class="space-y-4 pt-1">
                                        <div class="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
                                            <label class="text-[11px] font-medium whitespace-nowrap">Waktu Pengiriman</label>
                                            <input type="time" v-model="form.autoBillTime" class="ml-auto bg-background border border-border rounded-lg text-xs p-1.5 focus:ring-1 focus:ring-primary outline-none transition-all" />
                                        </div>

                                        <div class="space-y-2">
                                            <div class="flex items-center justify-between px-0.5">
                                                <p class="text-[11px] font-medium text-muted-foreground">Template Pesan</p>
                                                <span class="text-[10px] text-muted-foreground italic">Shift+Enter untuk baris baru</span>
                                            </div>
                                            <textarea 
                                                v-model="form.billTemplate"
                                                class="flex min-h-[80px] w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
                                                placeholder="Tulis template pesan di sini..."
                                            ></textarea>
                                            <div class="flex flex-wrap gap-1.5">
                                                <code v-for="v in variables" :key="v" 
                                                    class="text-[9px] px-2 py-1 bg-secondary hover:bg-primary/10 hover:text-primary rounded-lg border border-border/50 cursor-pointer transition-colors" 
                                                    @click="copyVar(v)">{{ v }}</code>
                                            </div>
                                        </div>
                                    </div>
                                </transition>
                            </CardContent>
                        </Card>

                        <!-- Payment Success Card -->
                        <Card class="group overflow-hidden border-none bg-secondary/30 hover:bg-secondary/50 transition-colors shadow-none border-l-4 border-l-green-500/50">
                            <CardContent class="p-5 space-y-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 bg-green-500/10 rounded-lg text-green-500">
                                            <CheckCircle2 class="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span class="text-sm font-semibold">Resi Digital Otomatis</span>
                                            <p class="text-[10px] text-muted-foreground mt-0.5">Konfirmasi saat pembayaran lunas.</p>
                                        </div>
                                    </div>
                                    <Switch v-model="form.autoNotifyPaymentSuccess" />
                                </div>

                                <transition name="expand">
                                    <div v-if="form.autoNotifyPaymentSuccess" class="space-y-2 pt-1">
                                        <div class="flex items-center justify-between px-0.5">
                                            <p class="text-[11px] font-medium text-muted-foreground">Template Pesan</p>
                                        </div>
                                        <textarea 
                                            v-model="form.paymentTemplate"
                                            class="flex min-h-[80px] w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                                        ></textarea>
                                        <div class="flex flex-wrap gap-1.5">
                                            <code v-for="v in variables" :key="v" class="text-[9px] px-2 py-1 bg-secondary hover:bg-primary/10 hover:text-primary rounded-lg border border-border/50 cursor-pointer transition-colors" @click="copyVar(v)">{{ v }}</code>
                                        </div>
                                    </div>
                                </transition>
                            </CardContent>
                        </Card>

                        <!-- Reminder Card -->
                        <Card class="group overflow-hidden border-none bg-secondary/30 hover:bg-secondary/50 transition-colors shadow-none border-l-4 border-l-yellow-500/50">
                            <CardContent class="p-5 space-y-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                                            <Clock class="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span class="text-sm font-semibold">Pengingat Otomatis (Reminder)</span>
                                            <div v-if="form.autoReminderEnabled" class="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                                Setiap {{ form.globalReminderInterval }} hari sekali pukul {{ form.reminderTime }}
                                            </div>
                                        </div>
                                    </div>
                                    <Switch v-model="form.autoReminderEnabled" />
                                </div>

                                <transition name="expand">
                                    <div v-if="form.autoReminderEnabled" class="space-y-4 pt-1">
                                        <div class="grid grid-cols-3 gap-3">
                                            <div class="space-y-1.5">
                                                <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Frekuensi</label>
                                                <div class="relative">
                                                    <input type="number" v-model="form.globalReminderInterval" class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary" />
                                                </div>
                                            </div>
                                            <div class="space-y-1.5">
                                                <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Waktu</label>
                                                <input type="time" v-model="form.reminderTime" class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary" />
                                            </div>
                                            <div class="space-y-1.5">
                                                <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Jatuh Tempo</label>
                                                <div class="relative">
                                                    <input type="number" v-model="form.globalDueDay" min="1" max="31" class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary" />
                                                </div>
                                            </div>
                                        </div>

                                        <div class="space-y-2">
                                            <p class="text-[11px] font-medium text-muted-foreground px-0.5">Template Pengingat</p>
                                            <textarea 
                                                v-model="form.reminderTemplate"
                                                class="flex min-h-[80px] w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                                            ></textarea>
                                            <div class="flex flex-wrap gap-1.5">
                                                <code v-for="v in variables" :key="v" class="text-[9px] px-2 py-1 bg-secondary hover:bg-primary/10 hover:text-primary rounded-lg border border-border/50 cursor-pointer transition-colors" @click="copyVar(v)">{{ v }}</code>
                                            </div>
                                        </div>
                                    </div>
                                </transition>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <!-- Group 2: Delivery Restrictions -->
                <section class="space-y-4">
                    <div class="flex items-center gap-2 px-1">
                        <div class="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Global Restrictions</h3>
                    </div>

                    <Card class="border-none bg-gradient-to-br from-purple-500/[0.03] to-transparent shadow-none">
                        <CardContent class="p-6 space-y-6">
                            <div class="flex items-start gap-4">
                                <div class="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 shrink-0">
                                    <Moon class="w-5 h-5" />
                                </div>
                                <div class="space-y-1">
                                    <h4 class="text-sm font-semibold">Quiet Hours (Jam Istirahat)</h4>
                                    <p class="text-[11px] text-muted-foreground leading-relaxed">Pesan otomatis yang dipicu pada rentang waktu ini akan <b>ditahan</b> dan dikirim otomatis saat jam kerja dimulai kembali.</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="p-3 bg-secondary/40 rounded-xl border border-border/40 space-y-1.5">
                                    <label class="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Clock class="w-3 h-3" /> Mulai
                                    </label>
                                    <input type="time" v-model="form.quietHoursStart" class="w-full bg-transparent border-none text-sm font-medium p-0 focus:ring-0 outline-none" />
                                </div>
                                <div class="p-3 bg-secondary/40 rounded-xl border border-border/40 space-y-1.5">
                                    <label class="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Clock class="w-3 h-3" /> Selesai
                                    </label>
                                    <input type="time" v-model="form.quietHoursEnd" class="w-full bg-transparent border-none text-sm font-medium p-0 focus:ring-0 outline-none" />
                                </div>
                            </div>

                            <div class="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/30 hover:bg-secondary/40 transition-colors cursor-pointer" @click="form.quietHoursWeekend = !form.quietHoursWeekend">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full bg-purple-400"></div>
                                    <span class="text-xs font-medium">Aktifkan Quiet Mode Sepanjang Akhir Pekan</span>
                                </div>
                                <Switch v-model="form.quietHoursWeekend" @click.stop />
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </transition>

        <div v-if="!form.waEnabled" class="p-12 text-center space-y-4 animate-in fade-in duration-700">
            <div class="inline-flex w-16 h-16 bg-muted rounded-full items-center justify-center text-muted-foreground/30">
                <BellRing class="w-8 h-8" />
            </div>
            <div class="max-w-[240px] mx-auto">
                <p class="text-sm font-medium text-muted-foreground">Aktifkan Notifikasi Global untuk mengatur otomatisasi pesan.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { 
    BellRing, 
    Receipt, 
    CheckCircle2, 
    Clock, 
    Moon, 
    Settings2
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Switch from '@/components/ui/Switch.vue'
import type { UpdateSettingsDTO } from '@/types'

defineProps<{
    form?: UpdateSettingsDTO
}>()

const variables = ['{name}', '{month}', '{year}', '{amount}', '{method}', '{date}', '{day}', '{link}', '{br}']

const copyVar = (v: string) => {
    navigator.clipboard.writeText(v)
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 500px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: scaleY(0.95);
  transform-origin: top;
}
</style>
