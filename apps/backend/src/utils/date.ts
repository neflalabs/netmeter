
/**
 * Utility to get the current date and time in Asia/Jayapura (WIT) timezone.
 * This ensures consistency across automated schedulers and manual administrative actions.
 */
export function getCurrentDate() {
    const timezone = process.env.APP_TIMEZONE || 'Asia/Jayapura';
    const now = new Date();

    // Get year, month, and day in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const dateMap: Record<string, number> = {};
    parts.forEach(p => {
        if (p.type !== 'literal') {
            dateMap[p.type] = parseInt(p.value);
        }
    });

    return {
        year: dateMap.year,
        month: dateMap.month, // 1-12
        day: dateMap.day,
        hour: dateMap.hour,
        minute: dateMap.minute,
        second: dateMap.second,
        // Helper to get a native Date object for the "same" local time in Jayapura
        // Use this for database timestamps if we want them to reflect local time
        toDate: () => {
            const date = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
            return date;
        }
    };
}
