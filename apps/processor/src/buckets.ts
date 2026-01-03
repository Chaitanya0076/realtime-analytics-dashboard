export function toMinuteBucket(date: Date): string {
    const d = new Date(date);
    d.setSeconds(0, 0);
    return d.toISOString();
}

export function toHourBucket(date: Date): string {
    const d = new Date(date);
    d.setMinutes(0, 0, 0);
    return d.toISOString();
}