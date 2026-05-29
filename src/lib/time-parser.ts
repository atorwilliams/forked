export function parseTimeMinutes(s: string | null | undefined): number {
  if (!s) return 0;
  const raw = s.trim().toLowerCase();

  if (/^\d+(\.\d+)?$/.test(raw)) return parseFloat(raw);

  let total = 0;
  const fn      = raw.match(/(\d+(?:\.\d+)?)\s*(?:fn|fortnights?)/);        if (fn)    total += parseFloat(fn[1])    * 60 * 24 * 14;
  const weeks   = raw.match(/(\d+(?:\.\d+)?)\s*(?:w|wks?|weeks?)/);         if (weeks) total += parseFloat(weeks[1]) * 60 * 24 * 7;
  const days    = raw.match(/(\d+(?:\.\d+)?)\s*(?:d|days?)/);               if (days)  total += parseFloat(days[1])  * 60 * 24;
  const hours   = raw.match(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)/);         if (hours) total += parseFloat(hours[1]) * 60;
  const minutes = raw.match(/(\d+(?:\.\d+)?)\s*(?:m|mins?|minutes?)/);      if (minutes) total += parseFloat(minutes[1]);

  return total;
}

export function formatMinutes(total: number): string {
  if (total <= 0) return "";
  const d = Math.floor(total / (60 * 24));
  const rem = total % (60 * 24);
  const h = Math.floor(rem / 60);
  const m = Math.round(rem % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(" ");
}

// Normalize a user-typed time string. Pure number → minutes. Unrecognised → returned as-is.
export function normalizeTime(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^\d+(\.\d+)?$/.test(s)) return `${Math.round(parseFloat(s))}m`;
  const mins = parseTimeMinutes(s);
  return mins > 0 ? formatMinutes(mins) : s;
}
