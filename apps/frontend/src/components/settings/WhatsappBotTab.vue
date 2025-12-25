<template>
    <div class="space-y-6">
        <!-- Enable/Disable WhatsApp Integration -->
        <div class="relative overflow-hidden p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 shadow-sm group">
            <div class="absolute top-0 right-0 -m-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700"></div>
            
            <div class="relative flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                        <MessageCircle class="w-7 h-7" />
                    </div>
                    <div>
                        <h4 class="font-bold text-base tracking-tight">WhatsApp Integration</h4>
                        <p class="text-xs text-muted-foreground mt-0.5">Enable WhatsApp messaging via Wainthego API</p>
                    </div>
                </div>
                <Switch 
                    :checked="!!form.waEnabled" 
                    @update:checked="(val) => form.waEnabled = val" 
                    class="scale-110" 
                />
            </div>
        </div>

        <!-- Configuration (only show when enabled) -->
        <transition name="fade-slide">
            <div v-if="!!form.waEnabled" class="space-y-6">
                <!-- Wainthego Configuration -->
                <section class="space-y-4">
                    <div class="flex items-center gap-2 px-1">
                        <div class="w-1.5 h-4 bg-primary rounded-full"></div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Wainthego Configuration</h3>
                    </div>

                    <Card class="border-none bg-secondary/20 shadow-none">
                        <CardContent class="p-5 space-y-4">
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div class="space-y-1.5">
                                    <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Service URL</label>
                                    <input 
                                        v-model="form.waServiceUrl" 
                                        type="text" 
                                        placeholder="http://localhost:3030/api/v1"
                                        class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary transition-all" 
                                    />
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Instance ID</label>
                                    <input 
                                        v-model="form.waInstanceId" 
                                        type="text" 
                                        placeholder="main"
                                        class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary transition-all" 
                                    />
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">API Key (Master)</label>
                                <input 
                                    v-model="form.waApiKey" 
                                    type="password" 
                                    placeholder="Enter your Wainthego API Key"
                                    class="w-full bg-background border border-border rounded-xl text-xs p-2.5 outline-none focus:ring-1 focus:ring-primary transition-all" 
                                />
                            </div>
                            
                            <div class="flex items-center gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 text-[10px] text-blue-600 dark:text-blue-400">
                                <Info class="w-3.5 h-3.5 shrink-0" />
                                <p>Configure these settings, then click <b>Save Changes</b> at the bottom. Scan QR code in the Wainthego dashboard.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <!-- Connection Status -->
                <section class="space-y-4">
                    <div class="flex items-center gap-2 px-1">
                        <div class="w-1.5 h-4 bg-green-500 rounded-full"></div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Connection Status</h3>
                    </div>

                    <Card class="border-none bg-secondary/20 shadow-none">
                        <CardContent class="p-5">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-colors border border-primary/10"
                                        :class="connectionStatus === 'CONNECTED' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'">
                                        <MessageCircle class="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-sm tracking-tight leading-none">
                                            {{ connectionStatus === 'CONNECTED' ? 'Connected' : 'Disconnected' }}
                                        </h4>
                                        <p class="text-[11px] text-muted-foreground mt-1">
                                            {{ connectionStatus === 'CONNECTED' ? (connectedUser || 'WhatsApp Active') : 'Not connected to WhatsApp' }}
                                        </p>
                                    </div>
                                </div>

                                <div class="flex items-center gap-2">
                                    <Button variant="outline" size="sm" class="h-8 w-8 p-0 rounded-lg" @click="checkStatus" :disabled="checkingStatus">
                                        <RefreshCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': checkingStatus }" />
                                    </Button>

                                    <a href="https://wa.home.npx.my.id" target="_blank" class="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm">
                                        Dashboard <ExternalLink class="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </transition>

        <!-- Disabled State -->
        <div v-if="!form.waEnabled" class="p-12 text-center space-y-4">
            <div class="inline-flex w-16 h-16 bg-muted rounded-full items-center justify-center text-muted-foreground/30">
                <MessageCircle class="w-8 h-8" />
            </div>
            <div class="max-w-[280px] mx-auto">
                <p class="text-sm font-medium text-muted-foreground">Enable WhatsApp Integration to configure Wainthego settings and view connection status.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MessageCircle, Info, RefreshCcw, ExternalLink } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Switch from '@/components/ui/Switch.vue'
import Button from '@/components/ui/Button.vue'
import type { UpdateSettingsDTO } from '@/types'
import { whatsappApi } from '@/api'

const props = defineProps<{
    form: UpdateSettingsDTO
}>()

const api = whatsappApi()

const connectionStatus = ref<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED')
const connectedUser = ref('')
const checkingStatus = ref(false)

const checkStatus = async () => {
    checkingStatus.value = true
    try {
        const res = await api.getStatus() as any
        connectionStatus.value = res.status || 'DISCONNECTED'
        if (res.status === 'CONNECTED' && res.user) {
            connectedUser.value = res.user.name || res.user.id || 'Connected'
        }
    } catch (e) {
        console.error('Failed to check status', e)
        connectionStatus.value = 'DISCONNECTED'
    } finally {
        checkingStatus.value = false
    }
}

onMounted(() => {
    if (props.form.waEnabled) {
        checkStatus()
    }
})
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
</style>
