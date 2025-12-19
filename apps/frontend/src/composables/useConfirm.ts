import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

export function useConfirm() {
    const ui = useUIStore()

    return {
        isVisible: computed(() => ui.isConfirmVisible),
        options: computed(() => ui.confirmOptions),
        confirm: ui.confirm,
        handleConfirm: ui.handleConfirm,
        handleCancel: ui.handleCancel
    }
}
