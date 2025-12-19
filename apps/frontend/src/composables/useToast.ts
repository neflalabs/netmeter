import { computed } from 'vue'
import { useUIStore, type ToastProps } from '@/stores/ui'

export type { ToastProps }

export function useToast() {
    const ui = useUIStore()

    const toast = (props: Omit<ToastProps, 'id'>) => {
        return ui.toast(props)
    }

    const dismiss = (id: string) => {
        ui.dismissToast(id)
    }

    return {
        toasts: computed(() => ui.toasts),
        toast,
        dismiss
    }
}

