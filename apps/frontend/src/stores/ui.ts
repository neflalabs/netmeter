import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastProps {
    id: string
    title?: string
    description?: string
    variant?: 'default' | 'destructive' | 'success'
    duration?: number
}

export interface ConfirmOptions {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
}

export const useUIStore = defineStore('ui', () => {
    // Toast State
    const toasts = ref<ToastProps[]>([])

    // Confirmation State
    const isConfirmVisible = ref(false)
    const confirmOptions = ref<ConfirmOptions>({
        title: '',
        message: ''
    })
    let resolveConfirm: ((value: boolean) => void) | null = null

    // Toast Actions
    function toast({ title, description, variant = 'default', duration = 3000 }: Omit<ToastProps, 'id'>) {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast: ToastProps = {
            id,
            title,
            description,
            variant,
            duration
        }

        toasts.value.push(newToast)

        if (duration > 0) {
            setTimeout(() => {
                dismissToast(id)
            }, duration)
        }

        return {
            id,
            dismiss: () => dismissToast(id)
        }
    }

    function dismissToast(id: string) {
        toasts.value = toasts.value.filter((t) => t.id !== id)
    }

    // Confirmation Actions
    function confirm(opts: ConfirmOptions | string) {
        if (typeof opts === 'string') {
            confirmOptions.value = {
                title: 'Konfirmasi',
                message: opts,
                variant: 'default'
            }
        } else {
            confirmOptions.value = {
                variant: 'default',
                ...opts
            }
        }

        isConfirmVisible.value = true

        return new Promise<boolean>((resolve) => {
            resolveConfirm = resolve
        })
    }

    function handleConfirm() {
        isConfirmVisible.value = false
        if (resolveConfirm) {
            resolveConfirm(true)
            resolveConfirm = null
        }
    }

    function handleCancel() {
        isConfirmVisible.value = false
        if (resolveConfirm) {
            resolveConfirm(false)
            resolveConfirm = null
        }
    }

    return {
        // Toast
        toasts,
        toast,
        dismissToast,
        // Confirmation
        isConfirmVisible,
        confirmOptions,
        confirm,
        handleConfirm,
        handleCancel
    }
})
