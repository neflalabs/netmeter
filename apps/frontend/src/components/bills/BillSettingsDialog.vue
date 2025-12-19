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
                        Pengaturan Tagihan
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                        Konfigurasi default untuk pembuatan tagihan.
                    </p>
                </div>
                
                <div class="space-y-4">
                    <div class="space-y-2">
                        <Label for="monthlyFee">Biaya Bulanan Default (IDR)</Label>
                        <div class="relative">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                            <Input 
                                id="monthlyFee" 
                                v-model="displayMonthlyFee" 
                                type="text" 
                                class="pl-10 font-mono font-bold"
                                placeholder="0" 
                            />
                        </div>
                        <p class="text-[10px] text-muted-foreground">
                            Biaya ini akan diterapkan secara otomatis saat membuat tagihan baru untuk user.
                        </p>
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-4">
                    <Button variant="outline" @click="handleCancel" :disabled="loading">
                        Batal
                    </Button>
                    <Button 
                        variant="default" 
                        @click="handleSave"
                        :disabled="loading"
                    >
                        {{ loading ? 'Menyimpan...' : 'Simpan' }}
                    </Button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from '@/components/ui/Button.vue' 
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import type { UpdateSettingsDTO } from '@/types'
import { useFormatters } from '@/composables/useFormatters'

const { formatCurrency } = useFormatters()

const props = defineProps<{
    isOpen: boolean
    loading?: boolean
    initialSettings?: Partial<UpdateSettingsDTO>
}>()

const emit = defineEmits(['close', 'save'])

const form = ref<Partial<UpdateSettingsDTO>>({
    monthlyFee: 0
})

const displayMonthlyFee = computed({
    get: () => {
        const val = form.value.monthlyFee || 0
        return formatCurrency(val)
    },
    set: (val: string) => {
        // Remove everything except numbers
        const numericVal = parseInt(val.replace(/\D/g, ''))
        form.value.monthlyFee = isNaN(numericVal) ? 0 : numericVal
    }
})

// Initialize form when opened or when initialSettings change
watch([() => props.isOpen, () => props.initialSettings], ([newOpen, newSettings]) => {
    if (newOpen && newSettings) {
        form.value = {
            monthlyFee: newSettings.monthlyFee || 0
        }
    }
}, { deep: true })

const handleCancel = () => {
    emit('close')
}

const handleSave = () => {
    emit('save', form.value)
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
