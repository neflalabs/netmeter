
export function formatPhoneForWhatsapp(phone: string): string {
    if (!phone) return '';

    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, replace with 62
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
    }

    // If starts with 62, it's good (assuming it wasn't 062...)
    // If it doesn't start with 62 and was just 812..., we assume 62
    // But safe bet is handling '0' prefix specifically for Indonesia.

    return cleaned;
}
