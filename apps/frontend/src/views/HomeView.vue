<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import { CheckCircle2, LogIn, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import AnnouncementBanner from '@/components/AnnouncementBanner.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import UserAvatarStack from '@/components/UserAvatarStack.vue'
import AppLogo from '@/components/AppLogo.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isAuthenticated)
const paidBills = ref<any[]>([])
const isLoading = ref(true)
const appSettings = ref<any>({
    listingPerHome: 12 // Default to show all months
})

const fetchSettings = async () => {
    try {
        const res = await fetch('/api/public/settings')
        if (res.ok) {
            const data = await res.json()
            if (data) {
                appSettings.value.title = data.appTitle
                appSettings.value.subtitle = data.appSubtitle
                appSettings.value.listingPerHome = data.listingPerHome
                appSettings.value.announcementTitle = data.announcementTitle
                appSettings.value.announcementMessage = data.announcementMessage
                appSettings.value.announcementType = data.announcementType
                appSettings.value.announcementActive = data.announcementActive
            }
        }
    } catch (e) {
        console.error('Failed to fetch settings', e)
    }
}

const fetchPublicBills = async () => {
    try {
        const res = await fetch('/api/public/bills')
        if (res.ok) {
            paidBills.value = await res.json()
        }
    } catch (e) {
        console.error('Failed to fetch public bills', e)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchSettings()
    fetchPublicBills()
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
    const currentYearMonths = [...months].reverse().map(monthName => {
        const monthIndex = months.indexOf(monthName) + 1
        
        // Filter bills for this month and current year
        const monthlyBills = paidBills.value.filter(b => 
            b.month === monthIndex && b.year === currentYear
        )

        return {
            name: monthName,
            users: monthlyBills.map(b => b.userName)
        }
    })

    return currentYearMonths.slice(0, appSettings.value.listingPerHome)
})

</script>

<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- Navbar / Header -->
    <Header>
        <template #title>
             <AppLogo :title="appSettings.title" :subtitle="appSettings.subtitle" />
        </template>
        <template #actions>
            <Button v-if="isLoggedIn" size="sm" variant="outline" @click="router.push('/dashboard')">
                <LayoutDashboard class="w-4 h-4 mr-2" />
                Dashboard
            </Button>
            <Button v-else size="sm" variant="outline" @click="router.push('/login')">
                <LogIn class="w-4 h-4 mr-2" />
                Login
            </Button>
        </template>
    </Header>

    <section class="container mx-auto px-4 pt-6 max-w-2xl">
        <AnnouncementBanner 
            :active="appSettings.announcementActive"
            :title="appSettings.announcementTitle"
            :message="appSettings.announcementMessage"
            :type="appSettings.announcementType"
        />
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
                             <div v-for="(user, idx) in month.users" :key="user" 
                                  class="flex items-center justify-between text-sm text-foreground bg-secondary/30 p-4 rounded-xl border border-border/50 group hover:border-blue-500/30 hover:bg-secondary transition-all duration-200"
                                  :style="{ animationDelay: `${idx * 50}ms` }"
                             >
                                <span class="font-bold flex items-center gap-3">
                                    <UserAvatar :name="user" size="md" />
                                    {{ user }}
                                </span>
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">LUNAS</span>
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
                         <UserAvatarStack v-if="month.users.length > 0" :users="month.users" :limit="3" />
                         <ChevronDown class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                </div>
            </template>
        </div>
    </main>

    <Footer />
  </div>
</template>
