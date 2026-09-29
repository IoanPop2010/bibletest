import { MORNING_PASSAGES, type Passage } from "@/lib/passages";

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function passageFor(date: Date): Passage {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfYear = Math.floor((now - start) / 86400000);
  return MORNING_PASSAGES[(dayOfYear - 1) % MORNING_PASSAGES.length];
}

export function isKnownPassage(ref: string): boolean {
  return MORNING_PASSAGES.some((item) => item.ref === ref);
}

export function previousDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function currentStreak(sortedKeys: string[], todayKey: string): number {
  if (!sortedKeys.length) return 0;
  const set = new Set(sortedKeys);
  let cursor = set.has(todayKey) ? todayKey : previousDate(todayKey);
  if (!set.has(cursor)) return 0;
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = previousDate(cursor);
  }
  return count;
}
