<template>
    <Transition name="fade">
        <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div 
                class="bg-card w-full max-w-md rounded-lg shadow-lg border border-border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div>
                    <h3 class="text-lg font-semibold leading-none tracking-tight">
                        Konfirmasi Pembayaran
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                        Tandai tagihan ini sebagai LUNAS?
                    </p>
                </div>
                
                <div class="space-y-2">
                    <Label>
                        Metode Pembayaran
                    </Label>
                    <select 
                        v-model="paymentMethod"
                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="CASH">Tunai (Cash)</option>
                        <option value="MANUAL_TRANSFER">Transfer Bank / E-Wallet</option>
                    </select>
                </div>

                <div class="space-y-2">
                    <Label>
                        Tanggal Pembayaran
                    </Label>
                    <div class="relative">
                        <!-- Hidden native date input for picker functionality -->
                        <input 
                            type="date"
                            v-model="paymentDate"
                            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <!-- Custom display to force Indonesian format -->
                        <div class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background peer-focus-within:ring-2 peer-focus-within:ring-ring peer-focus-within:ring-offset-2">
                            <span :class="!paymentDate ? 'text-muted-foreground' : ''">
                                {{ formattedDisplayDate }}
                            </span>
                            <Calendar class="h-4 w-4 opacity-50" />
                        </div>
                    </div>
                    <p class="text-[10px] text-muted-foreground">
                        Default: Hari ini
                    </p>
                </div>

                <div class="flex justify-end gap-2 pt-4">
                    <Button variant="outline" @click="handleCancel">
                        Batal
                    </Button>
                    <Button 
                        variant="default" 
                        @click="handleConfirm"
                        :disabled="loading"
                    >
                        {{ loading ? 'Menyimpan...' : 'Ya, Lunas' }}
                    </Button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from '@/components/ui/Button.vue' 
import Label from '@/components/ui/Label.vue'
import { Calendar } from 'lucide-vue-next'

// Helper to format Date to YYYY-MM-DD local
const toLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - (offset * 60 * 1000))
    return localDate.toISOString().split('T')[0]
}

const props = defineProps<{
    isOpen: boolean
    loading?: boolean
}>()

const emit = defineEmits(['close', 'confirm'])

const paymentDate = ref(toLocalISO(new Date()))
const paymentMethod = ref<'CASH' | 'MANUAL_TRANSFER'>('CASH')

const formattedDisplayDate = computed(() => {
    if (!paymentDate.value) return 'Pilih Tanggal'
    const [year, month, day] = paymentDate.value.split('-')
    return `${day}/${month}/${year}`
})

// Reset date when opened
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        paymentDate.value = toLocalISO(new Date())
        paymentMethod.value = 'CASH'
    }
})

const handleCancel = () => {
    emit('close')
}

const handleConfirm = () => {
    // Convert string YYYY-MM-DD back to Date object
    const date = new Date(paymentDate.value)
    emit('confirm', { date, method: paymentMethod.value })
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
