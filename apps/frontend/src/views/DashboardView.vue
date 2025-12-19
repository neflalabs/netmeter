<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, CreditCard, LogOut, Users, MoreHorizontal, Settings, Receipt, CheckCircle2, Clock, MessageCircle, Send, TrendingUp } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import StatsCard from '@/components/StatsCard.vue'
import { billsApi } from '@/api'
import { useBillStore } from '@/stores/bill'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()
const auth = useAuthStore()
const billStore = useBillStore()
const userStore = useUserStore()
const router = useRouter()

const handleLogout = () => {
    auth.logout()
    localStorage.removeItem('username')
    router.push('/login')
}

const isLoading = computed(() => billStore.isFetching || userStore.isFetching)
const activeBillId = ref<number | null>(null)
const sendingNotif = ref(false)

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value)
}

// Current month bills
const currentMonth = new Date().getMonth() + 1
const currentYear = new Date().getFullYear()

const currentMonthBills = computed(() => {
    return billStore.bills.filter(b => b.month === currentMonth && b.year === currentYear)
})

const pendingBills = computed(() => currentMonthBills.value.filter(b => b.status === 'UNPAID'))
const paidBills = computed(() => currentMonthBills.value.filter(b => b.status === 'PAID'))

const estimatedIncome = computed(() => {
    return billStore.bills
        .filter(b => b.status === 'UNPAID')
        .reduce((sum, b) => sum + (b.amount || 0), 0)
})

const handleNotify = async (id: number) => {
    sendingNotif.value = true
    activeBillId.value = null
    try {
        const api = billsApi()
        await api.notify(id)
        toast({
            title: 'Terkirim',
            description: 'Notifikasi tagihan berhasil dikirim.',
            variant: 'success'
        })
    } catch (e: any) {
        console.error(e)
    } finally {
        sendingNotif.value = false
    }
}

const handlePaymentNotify = async (id: number) => {
    sendingNotif.value = true
    activeBillId.value = null
    try {
        const api = billsApi()
        await api.notifyPayment(id)
        toast({
            title: 'Terkirim',
            description: 'Bukti bayar berhasil dikirim.',
            variant: 'success'
        })
    } catch (e: any) {
        console.error(e)
    } finally {
        sendingNotif.value = false
    }
}

let refreshInterval: any = null

onMounted(async () => {
    // Initial fetch
    billStore.fetchBills()
    userStore.fetchUsers()

    // Polling every 10 seconds for real-time reactivity
    refreshInterval = setInterval(() => {
        billStore.fetchBills(true) // Force background refresh
    }, 10000)
})

// Cleanup interval on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- Header -->
    <Header 
        title="Admin Dashboard" 
        subtitle="Kelola Netmeter"
        :show-back="true"
        back-to="/"
    >
        <template #actions>
             <Button size="icon" variant="ghost" class="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" @click="handleLogout" title="Logout">
                <LogOut class="w-5 h-5" />
            </Button>
        </template>
    </Header>

    <main class="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <!-- Quick Stats -->
        <div class="grid grid-cols-2 gap-4">
            <StatsCard 
                title="Total User Active" 
                :value="userStore.users.length" 
                :icon="Users" 
                variant="primary"
            />
            <StatsCard 
                title="Pending Income" 
                :value="`Rp ${formatCurrency(estimatedIncome)}`"
                :icon="CreditCard" 
                variant="secondary"
            />
        </div>

        <!-- Action Bar -->
        <div class="flex gap-2 overflow-x-auto pb-2">
            <Button size="sm" class="pl-2" @click="$router.push('/bills')">
                <Plus class="w-4 h-4 mr-1" />Tagihan
            </Button>
            <Button size="sm" variant="outline" class="pl-2" @click="$router.push('/users')">
                <Users class="w-4 h-4 mr-1" /> Pengguna
            </Button>

            <Button size="sm" variant="outline" class="pl-2" @click="$router.push('/stats')">
                <TrendingUp class="w-4 h-4 mr-1" /> Stats
            </Button>

            <Button size="sm" variant="outline" class="pl-2" @click="$router.push('/settings')">
                <Settings class="w-4 h-4 mr-1" /> Settings
            </Button>
        </div>

        <!-- Bills List -->
        <Card>
            <CardHeader class="pb-3 px-4 pt-4 border-b border-border">
                <div class="flex items-center justify-between">
                    <CardTitle class="text-base flex items-center gap-2">
                        <Receipt class="w-4 h-4" />
                        Tagihan Bulan Ini
                    </CardTitle>
                    <div class="flex items-center gap-2 text-xs">
                        <span class="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-900/50">
                            {{ pendingBills.length }} Pending
                        </span>
                        <span class="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-900/50">
                            {{ paidBills.length }} Lunas
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent class="p-0">
                <div v-if="isLoading" class="p-8 text-center text-muted-foreground">
                    <div class="animate-pulse">Memuat data...</div>
                </div>
                <div v-else-if="currentMonthBills.length === 0" class="p-8 text-center text-muted-foreground">
                    <Receipt class="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                    <p class="font-medium">Belum ada tagihan bulan ini</p>
                    <p class="text-xs mt-1">Klik "Buat Tagihan" untuk generate tagihan</p>
                </div>
                <div v-else class="divide-y divide-border">
                    <div v-for="bill in currentMonthBills" :key="bill.id" class="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                        <div class="flex items-center gap-3">
                            <div 
                                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                :class="bill.status === 'PAID' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-yellow-500 to-orange-500'"
                            >
                                <CheckCircle2 v-if="bill.status === 'PAID'" class="w-5 h-5" />
                                <Clock v-else class="w-5 h-5" />
                            </div>
                            <div>
                                <div class="font-medium text-foreground">{{ bill.userName }}</div>
                                <div class="text-xs text-muted-foreground">Rp {{ formatCurrency(bill.amount) }}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span 
                                class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                :class="bill.status === 'PAID' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'"
                            >
                                {{ bill.status === 'PAID' ? 'LUNAS' : 'PENDING' }}
                            </span>
                            
                             <div class="relative">
                                <button class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-colors" @click.stop="activeBillId = activeBillId === bill.id ? null : bill.id">
                                    <MoreHorizontal class="w-4 h-4" />
                                </button>
                                
                                <!-- Action Menu Dropdown -->
                                <div 
                                    v-if="activeBillId === bill.id" 
                                    class="absolute right-0 top-full mt-1 w-56 bg-card rounded-lg shadow-lg border border-border z-10 py-1"
                                    @click.stop
                                >
                                    <button 
                                        v-if="bill.status === 'UNPAID'"
                                        @click="handleNotify(bill.id)"
                                        :disabled="sendingNotif"
                                        class="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <MessageCircle class="w-4 h-4 text-blue-500" />
                                        Kirim Notifikasi Tagihan
                                    </button>


                                    <button 
                                        v-if="bill.status === 'PAID'"
                                        @click="handlePaymentNotify(bill.id)"
                                        :disabled="sendingNotif"
                                        class="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Send class="w-4 h-4 text-green-500" />
                                        Kirim Bukti Bayar
                                    </button>

                                    <div class="border-t border-border my-1"></div>

                                    <button 
                                        class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                        @click="activeBillId = null"
                                    >
                                        Batal
                                    </button>
                                </div>
                                
                                <!-- Backdrop (Invisible) handled by global click or use a fixed overlay if needed, but clicking outside usually needs a directive or overlay -->
                            </div>
                            <!-- Backdrop Overlay -->
                            <div v-if="activeBillId === bill.id" class="fixed inset-0 z-0" @click="activeBillId = null"></div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </main>

    <Footer />
  </div>
</template>
