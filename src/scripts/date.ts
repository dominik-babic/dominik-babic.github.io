/**
 * Content dates are `Date` objects: YAML and Zod both parse `2026-09-01` as
 * UTC midnight. Format and compare them in UTC — a local-time formatter would
 * report the previous day for any build machine west of UTC.
 */
export function fmtDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/** Today at UTC midnight, for comparing against content dates. */
export function utcToday(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
