export function parseRetentionDays(value: string | undefined, fallback = 365): number | null {
  if (value === undefined || value === "") return fallback;
  if (!/^\d{1,4}$/.test(value)) return null;
  const days = Number(value);
  return Number.isInteger(days) && days >= 30 && days <= 3650 ? days : null;
}

export function getRetentionCutoff(days: number, now = new Date()) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
