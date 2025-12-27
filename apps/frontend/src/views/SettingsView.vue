<template>
  <div class="min-h-screen bg-background pb-20 md:pb-6 flex">
    <!-- Desktop Sidebar -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-w-0 overflow-x-hidden">
        <Header 
            title="Settings" 
            subtitle="Konfigurasi aplikasi Netmeter"
            :show-back="true"
        />

        <main class="container mx-auto px-4 py-6 md:max-w-4xl space-y-6 w-full">
            <!-- Status Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- WhatsApp Status -->
                <StatsCard 
                    title="WhatsApp API" 
                    :icon="MessageCircle" 
                    :variant="waCardVariant"
                >
                    <div v-if="!form.waEnabled" class="flex items-center gap-2">
                        Disabled
                        <XCircle class="w-6 h-6" />
                    </div>
                    <div v-else-if="waStatus === 'CONNECTED'">
                        <div class="text-xl font-bold truncate">{{ waUser?.name || 'WhatsApp User' }}</div>
                    </div>
                    <div v-else class="flex items-center gap-2">
                        Disconnected
                        <XCircle class="w-6 h-6" />
                    </div>

                    <template #footer v-if="form.waEnabled && waStatus === 'CONNECTED'">
                        <div class="flex items-center gap-1 mt-1">
                             <div class="text-xs font-mono bg-white/20 px-1 rounded">
                                +{{ waUser?.id }}
                             </div>
                             <CheckCircle2 class="w-3 h-3 ml-auto" />
                        </div>
                    </template>
                </StatsCard>

                <!-- Payment Gateway Status -->
                <StatsCard 
                    title="Payment Gateway" 
                    :icon="CreditCard" 
                    :variant="paymentStatusVariant"
                >
                    <div class="flex items-center gap-2">
                        {{ paymentStatusText }}
                        <component :is="paymentStatusIcon" class="w-6 h-6" />
                    </div>
                </StatsCard>
            </div>

            <!-- Settings Tabs -->
            <Card>
                <div class="border-b border-border">
                    <div class="flex overflow-x-auto scrollbar-hide">
                        <button 
                            v-for="tab in tabs" 
                            :key="tab.id"
                            @click="activeTab = tab.id"
                            class="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2"
                            :class="activeTab === tab.id ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'"
                        >
                            <component :is="tab.icon" class="w-4 h-4" />
                            {{ tab.label }}
                        </button>
                    </div>
                </div>

                <CardContent class="p-6">
                    <!-- General Tab -->
                    <GeneralTab v-if="activeTab === 'general'" :form="form" />


                    <!-- WhatsApp Bot Tab -->
                    <WhatsappBotTab v-if="activeTab === 'whatsapp'" :form="form" />

                    <!-- Payment Gateway Tab -->
                    <PaymentTab v-if="activeTab === 'payment'" :form="form" />

                    <!-- Notification Tab -->
                    <NotificationTab v-if="activeTab === 'notifications'" :form="form" />

                    <!-- Backup Tab -->
                    <BackupTab v-if="activeTab === 'backup'" />

                    <!-- Save Button (Global for General, Pricing, Whatsapp, Notifications) -->
                    <div v-if="['general', 'whatsapp', 'payment', 'notifications'].includes(activeTab)" class="pt-6 mt-6 border-t border-border">
                        <Button class="w-full sm:w-auto" @click="saveSettings" :disabled="loading">
                            <Save class="w-4 h-4 mr-2" />
                            <span v-if="loading">Menyimpan...</span>
                            <span v-else>Simpan Perubahan</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Header from '@/components/Header.vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import Footer from '@/components/Footer.vue'
import StatsCard from '@/components/StatsCard.vue'
import { 
    Settings, 
    CreditCard, 
    MessageCircle, 
    Wallet, 
    CheckCircle2, 
    AlertCircle,
    Save,
    XCircle,
    DatabaseBackup,
    BellRing
} from 'lucide-vue-next'
import type { UpdateSettingsDTO } from '@/types'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import { useWhatsappStore } from '@/stores/whatsapp'

const { toast } = useToast()
const settingsStore = useSettingsStore()
const whatsappStore = useWhatsappStore()

// Tabs Components
import GeneralTab from '@/components/settings/GeneralTab.vue'
import WhatsappBotTab from '@/components/settings/WhatsappBotTab.vue'
import PaymentTab from '@/components/settings/PaymentTab.vue'
import NotificationTab from '@/components/settings/NotificationTab.vue'
import BackupTab from '@/components/settings/BackupTab.vue'

const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageCircle },
    { id: 'notifications', label: 'Notification Center', icon: BellRing },
    { id: 'payment', label: 'Payment Gateway', icon: Wallet },
    { id: 'backup', label: 'Backup & Restore', icon: DatabaseBackup },
]

const activeTab = ref('general')
const loading = computed(() => settingsStore.isFetching)
const form = ref<UpdateSettingsDTO>({
  monthlyFee: 0,
  adminPhoneNumber: '',
  appTitle: '',
  appSubtitle: '',
  appUrl: '',
  listingPerHome: 0,
  billTemplate: '',
  paymentTemplate: '',
  manualPaymentEnabled: true,
  qrisPaymentEnabled: false,
  manualPaymentDetails: '',
  midtransEnabled: false,
  midtransClientKey: '',
  midtransServerKey: '',
  midtransEnvironment: 'sandbox',
  reminderTemplate: '',
  globalDueDay: 10,
  globalReminderInterval: 3,
  waEnabled: false,
  waServiceUrl: 'http://localhost:3030/api/v1',
  waApiKey: '',
  waInstanceId: 'main',
  autoNotifyNewBill: false,
  autoNotifyPaymentSuccess: false,
  autoReminderEnabled: false,
  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
  quietHoursWeekend: true,
  reminderTime: '09:00',
  autoBillTime: '09:00',
  xenditEnabled: false,
  xenditSecretKey: '',
  xenditVerificationToken: '',
  xenditEnvironment: 'sandbox'
})

const fetchSettings = async () => {
  const data = await settingsStore.fetchSettings(true)
  if (data) {
    form.value = { ...data }
  }
}

const waStatus = computed(() => whatsappStore.connectionStatus)
const waUser = ref<{ name?: string, id?: string } | null>(null)

const fetchWaStatus = async () => {
    const res = await whatsappStore.fetchStatus()
    if (res && res.user) {
        waUser.value = res.user
    }
}

const waCardVariant = computed(() => {
    if (!form.value.waEnabled) return 'secondary'
    return waStatus.value === 'CONNECTED' ? 'success' : 'danger'
})
const paymentStatusVariant = computed(() => {
    if (form.value.midtransEnabled || form.value.xenditEnabled) {
        if (form.value.midtransEnvironment === 'production' || form.value.xenditEnabled) return 'success'
        return 'warning'
    }
    if (form.value.qrisPaymentEnabled || form.value.manualPaymentEnabled) return 'success'
    return 'secondary'
})

const paymentStatusText = computed(() => {
    const hasMidtrans = form.value.midtransEnabled
    const hasXendit = form.value.xenditEnabled
    const hasManual = form.value.manualPaymentEnabled || form.value.qrisPaymentEnabled
    
    const gateways = []
    if (hasMidtrans) gateways.push(form.value.midtransEnvironment === 'production' ? 'Midtrans' : 'Midtrans Sandbox')
    if (hasXendit) gateways.push(form.value.xenditEnvironment === 'production' ? 'Xendit' : 'Xendit Sandbox')
    
    if (gateways.length > 0) {
        return gateways.join(' & ') + (hasManual ? ' & Manual' : '')
    }

    if (form.value.qrisPaymentEnabled && form.value.manualPaymentEnabled) return 'QRIS & Manual'
    if (form.value.qrisPaymentEnabled) return 'QRIS Enabled'
    if (form.value.manualPaymentEnabled) return 'Manual Payment'
    return 'Disabled'
})

const paymentStatusIcon = computed(() => {
    if (form.value.midtransEnabled || form.value.xenditEnabled) {
        if (form.value.midtransEnvironment === 'production' || form.value.xenditEnabled) return CheckCircle2
        return AlertCircle
    }
    if (form.value.qrisPaymentEnabled || form.value.manualPaymentEnabled) return CheckCircle2
    return XCircle
})

const saveSettings = async () => {
  try {
    await settingsStore.updateSettings(form.value)
    toast({
        title: 'Berhasil',
        description: 'Pengaturan berhasil disimpan.',
        variant: 'success'
    })
  } catch (error: any) {
    console.error(error)
  }
}

onMounted(() => {
  fetchSettings()
  fetchWaStatus()
})
</script>
