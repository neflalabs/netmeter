/**
 * Composable for formatting utilities
 */
export const useFormatters = () => {
    /**
     * Format number as Indonesian Rupiah
     */
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('id-ID').format(value)
    }

    /**
     * Format date string to Indonesian locale with time
     */
    const formatDate = (dateString: string | Date): string => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    /**
     * Format date string to Indonesian locale (date only)
     */
    const formatDateOnly = (dateString: string | Date): string => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date)
    }

    /**
     * Get Indonesian month name from month number (1-12)
     */
    const getMonthName = (month: number): string => {
        const date = new Date()
        date.setMonth(month - 1)
        return date.toLocaleString('id-ID', { month: 'long' })
    }

    return {
        formatCurrency,
        formatDate,
        formatDateOnly,
        getMonthName
    }
}
