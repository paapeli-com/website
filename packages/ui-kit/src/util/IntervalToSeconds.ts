export function intervalToSeconds(interval: string): number {
    const unit = interval.slice(-1); // Get the last character (unit)
    const value = parseInt(interval.slice(0, -1), 10) || 1; // Get the numeric value, default to 1 if no value is present

    switch (unit.toUpperCase()) {
        case 'T': // Ticks (assuming 1 tick = 1 millisecond)
            return value;
        case 'S': // Seconds
            return value;
        case 'M': // Months or Minutes
            if (interval.toUpperCase().endsWith('M')) {
                // Handle months (assuming 1 month = 30 days)
                return value * 30 * 24 * 60 * 60;
            }
            // Handle minutes
            return value * 60;
        case 'H': // Hours
            return value * 60 * 60;
        case 'D': // Days
            return value * 24 * 60 * 60;
        case 'W': // Weeks
            return value * 7 * 24 * 60 * 60;
        case 'Y': // Years (assuming 1 year = 365 days)
            return value * 365 * 24 * 60 * 60;
        default:
            // If no unit is provided, assume minutes (e.g., "60" means 60 minutes)
            return parseInt(interval, 10) * 60;
    }
}