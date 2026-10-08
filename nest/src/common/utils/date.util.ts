const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True only for real calendar dates in YYYY-MM-DD form (rejects 2026-02-30). */
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Whole days since 1970-01-01, computed in UTC so there is no timezone drift. */
export function toDayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

export function fromDayIndex(index: number): string {
  return new Date(index * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromDayIndex(toDayIndex(iso) + days);
}

/** a - b in whole days. */
export function diffInDays(a: string, b: string): number {
  return toDayIndex(a) - toDayIndex(b);
}
