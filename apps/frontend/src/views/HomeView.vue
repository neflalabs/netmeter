<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-vue-next'
import AnnouncementBanner from '@/components/AnnouncementBanner.vue'
import WelcomeHero from '@/components/WelcomeHero.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import UserAvatarStack from '@/components/UserAvatarStack.vue'

import { usePublicStore } from '@/stores/public'

const publicStore = usePublicStore()
const paidBills = computed(() => publicStore.publicBills)
const appSettings = computed(() => publicStore.settings || { listingPerHome: 12 })

onMounted(() => {
    // Polling will be started in App.vue, but we ensure initial fetch if needed
    if (!publicStore.settings) {
        publicStore.fetchSettings()
        publicStore.fetchPublicBills()
    }
})

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Dynamic Current Date
const now = new Date();
const currentYear = now.getFullYear();
const currentMonthIdx = now.getMonth(); // 0-indexed
const currentMonthName = months[currentMonthIdx];

// State for expanded month. Default to current month.
const expandedMonth = ref<string | null>(currentMonthName);

const toggleMonth = (monthName: string) => {
    if (expandedMonth.value === monthName) {
        expandedMonth.value = null; // Collapse if clicked again
    } else {
        expandedMonth.value = monthName;
    }
}

const yearData = computed(() => {
    // Generate structure for current year months
    const currentYearMonths = [...months]
        .map((monthName, idx) => ({ name: monthName, index: idx + 1 }))
        .filter(m => m.index <= (currentMonthIdx + 1)) // Only show up to current month
        .reverse()
        .map(m => {
            // Filter bills for this month and current year
            const monthlyBills = paidBills.value.filter(b => 
                b.month === m.index && b.year === currentYear
            )

            return {
                name: m.name,
                users: monthlyBills.map(b => ({
                    name: b.userName,
                    method: b.paymentMethod,
                    type: b.paymentType,
                    issuer: b.issuer
                }))
            }
        })

    return currentYearMonths.slice(0, appSettings.value.listingPerHome)
})

const getPaymentLabel = (user: any) => {
    if (user.method === 'CASH') return 'Tunai'
    if (user.method === 'MANUAL_TRANSFER') return 'Transfer Manual'
    if (user.method === 'STATIC_QRIS') return 'Qris Statis'
    if (user.method === 'MIDTRANS' || user.method === 'XENDIT') {
        const issuer = user.issuer || user.type || (user.method === 'XENDIT' ? 'Xendit' : 'System')
        return `PG-${issuer.charAt(0).toUpperCase() + issuer.slice(1).toLowerCase()}`
    }
    return 'LUNAS'
}

const getPaymentColorClass = (method: string) => {
    if (method === 'CASH') return 'text-slate-600 dark:text-slate-400 bg-slate-500/10'
    if (method === 'MANUAL_TRANSFER' || method === 'STATIC_QRIS') return 'text-orange-600 dark:text-orange-400 bg-orange-500/10'
    if (method === 'MIDTRANS' || method === 'XENDIT') return 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
    return 'text-green-600 dark:text-green-400 bg-green-500/10'
}

</script>

<template>
  <div class="space-y-4">
    <section class="container mx-auto px-4 pt-2 max-w-2xl">
        <AnnouncementBanner 
            v-if="appSettings && 'announcementActive' in appSettings && appSettings.announcementActive"
            :active="true"
            :title="appSettings.announcementTitle"
            :message="appSettings.announcementMessage"
            :type="appSettings.announcementType as any"
            :created-at="appSettings.announcementCreatedAt"
            :updated-at="appSettings.announcementUpdatedAt"
        />
        <WelcomeHero v-else />
    </section>

    <!-- Main Content (Timeline) -->
    <main class="container mx-auto px-4 py-6 max-w-2xl">
        <div class="flex flex-col gap-3">
            <template v-for="(month, idx) in yearData" :key="idx">
                <!-- Expanded Card (Hero / Selected Month) -->
                <div 
                    v-if="expandedMonth === month.name"
                    class="rounded-2xl border-2 border-blue-500/20 bg-card shadow-lg ring-4 ring-blue-500/5 transition-all duration-300 dark:border-blue-500/30 overflow-hidden"
                >
                    <div 
                        class="p-6 pb-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/5"
                        @click="toggleMonth(month.name)"
                    >
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-blue-500 rounded-xl shadow-blue-500/20 shadow-lg text-white">
                                <span class="font-bold text-lg leading-none">{{ month.name.substring(0, 3) }}</span>
                            </div>
                            <div>
                                <h3 class="text-xl font-extrabold text-foreground tracking-tight">{{ month.name }} {{ currentYear }}</h3>
                                <div class="flex items-center gap-2 mt-0.5">
                                     <span v-if="month.name === currentMonthName" class="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                     <span class="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                                         {{ month.name === currentMonthName ? 'Bulan Ini' : 'Arsip' }}
                                     </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <span v-if="month.users.length > 0" class="text-xs font-bold px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg">
                                {{ month.users.length }} Lunas
                            </span>
                             <ChevronUp class="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>
                    
                    <div class="p-6 pt-2 animate-in slide-in-from-top-4 duration-300">
                        <div v-if="month.users.length > 0" class="flex flex-col gap-3">
                             <div v-for="(user, idx) in month.users" :key="user.name" 
                                  class="flex items-center justify-between text-sm text-foreground bg-secondary/30 p-4 rounded-xl border border-border/50 group hover:border-blue-500/30 hover:bg-secondary transition-all duration-200"
                                  :style="{ animationDelay: `${idx * 50}ms` }"
                             >
                                <span class="font-bold flex items-center gap-3">
                                    <UserAvatar :name="user.name" size="md" />
                                    {{ user.name }}
                                </span>
                                <div class="flex items-center gap-2">
                                    <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', getPaymentColorClass(user.method)]">
                                        {{ getPaymentLabel(user) }}
                                    </span>
                                    <CheckCircle2 class="w-5 h-5 text-green-500" />
                                </div>
                            </div>
                        </div>
                        
                        <!-- Premium Empty State -->
                        <div v-else class="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-2xl bg-muted/5">
                            <div class="relative mb-4">
                                <div class="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full"></div>
                                <div class="relative w-20 h-20 bg-card rounded-3xl border border-border flex items-center justify-center shadow-sm">
                                    <CheckCircle2 class="w-10 h-10 text-muted-foreground/20" />
                                </div>
                            </div>
                            <h4 class="text-base font-bold text-foreground">Hening Sekali...</h4>
                            <p class="text-xs text-muted-foreground mt-2 max-w-[240px] leading-relaxed">
                                Belum ada kontribusi untuk bulan ini. Jadilah pahlawan WiFi pertama hari ini! 🚀
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Collapsed Row (Grouped) -->
                <div 
                    v-else
                    class="group flex items-center justify-between p-5 rounded-2xl border border-border bg-card hover:bg-secondary/30 cursor-pointer transition-all duration-200 hover:border-blue-500/30 hover:shadow-sm"
                    @click="toggleMonth(month.name)"
                >
                    <div class="flex items-center gap-4">
                        <div class="w-1.5 h-10 rounded-full bg-secondary group-hover:bg-blue-500 transition-colors"></div>
                        <div>
                            <h3 class="font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {{ month.name }} {{ currentYear }}
                            </h3>
                            <p class="text-xs text-muted-foreground mt-0.5">
                                {{ month.users.length > 0 ? `${month.users.length} kontribusi berhasil` : 'Belum ada kontribusi' }}
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-4">
                         <UserAvatarStack v-if="month.users.length > 0" :users="month.users.map(u => u.name)" :limit="3" />
                         <ChevronDown class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                </div>
            </template>
        </div>
    </main>
  </div>
</template>
