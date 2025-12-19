<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import { CheckCircle2, LogIn, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import StatsCard from '@/components/StatsCard.vue'
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
             <h1 class="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {{ appSettings.title }}
            </h1>
        </template>
        <template #subtitle>
            {{ appSettings.subtitle }}
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
        <div class="grid grid-cols-2 gap-3">
             <!-- Data Usage Card -->
             <StatsCard title="Data Usage">
                <template #icon>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/></svg>
                </template>
                <div class="flex items-baseline">
                    <span class="text-2xl font-bold text-foreground">450.5</span>
                    <span class="text-sm text-muted-foreground ml-1">GB</span>
                </div>
                <template #footer>
                     <div class="w-full bg-secondary rounded-full h-1.5 mt-1">
                        <div class="bg-blue-600 h-1.5 rounded-full" style="width: 45%"></div>
                    </div>
                </template>
            </StatsCard>

            <!-- Network Status Card -->
            <StatsCard title="Network" variant="success">
                <template #icon>
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </template>
                <div class="flex items-center gap-1.5">
                     <span class="relative flex h-2.5 w-2.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span class="text-sm font-medium text-green-600">Online</span>
                </div>
                
                <template #footer>
                     <div class="flex justify-between items-end mt-1">
                         <div class="text-xs text-muted-foreground">Uptime: 14d 2h</div>
                         <div>
                            <span class="text-lg font-bold text-foreground">12</span>
                            <span class="text-[10px] text-muted-foreground ml-0.5">ms</span>
                         </div>
                     </div>
                </template>
            </StatsCard>
        </div>
    </section>

    <!-- Main Content (Timeline) -->
    <main class="container mx-auto px-4 py-6 max-w-2xl">
        <div class="flex flex-col gap-3">
            <template v-for="(month, idx) in yearData" :key="idx">
                <!-- Expanded Card (Current/Selected) -->
                <div 
                    v-if="expandedMonth === month.name"
                    class="rounded-xl border border-blue-200 bg-card shadow-sm ring-2 ring-blue-100 transition-all duration-300 dark:ring-blue-900"
                >
                    <div 
                        class="p-6 pb-3 flex items-center justify-between cursor-pointer"
                        @click="toggleMonth(month.name)"
                    >
                        <div class="flex items-center gap-3">
                            <h3 class="text-xl font-bold text-foreground">{{ month.name }} {{ currentYear }}</h3>
                             <span v-if="month.users.length > 0" class="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                {{ month.users.length }} Lunas
                            </span>
                            <span v-else class="text-xs font-medium px-2 py-1 bg-secondary text-muted-foreground rounded-full">
                                Pending
                            </span>
                        </div>
                        <ChevronUp class="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div class="p-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <div v-if="month.users.length > 0" class="flex flex-col gap-2">
                             <div v-for="user in month.users" :key="user" class="flex items-center justify-between text-sm text-foreground bg-secondary/50 p-3 rounded-lg border border-border">
                                <span class="font-medium flex items-center">
                                    <CheckCircle2 class="w-4 h-4 text-green-500 mr-2" />
                                    {{ user }}
                                </span>
                                <span class="text-xs text-muted-foreground">Lunas</span>
                            </div>
                        </div>
                        <div v-else class="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border rounded-lg">
                            <p class="text-sm text-muted-foreground font-medium">Belum ada pembayaran</p>
                            <p class="text-xs text-muted-foreground mt-1">Tagihan untuk bulan ini belum ada yang lunas.</p>
                        </div>
                    </div>
                </div>

                <!-- Collapsed Row (Compact) -->
                <div 
                    v-else
                    class="group flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 cursor-pointer transition-all duration-200 hover:border-ring/30"
                    @click="toggleMonth(month.name)"
                >
                    <div class="flex items-center gap-4">
                        <span class="w-8 h-[1px] bg-border group-hover:bg-muted-foreground transition-colors"></span> <!-- The 'dash' visual -->
                        <span class="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            {{ month.name }} {{ currentYear }}
                        </span>
                    </div>
                    <ChevronDown class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
            </template>
        </div>
    </main>

    <Footer />
  </div>
</template>
