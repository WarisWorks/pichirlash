/** Reading habit helpers working on local calendar days (YYYY-MM-DD). */
const DAY = 86_400_000;

function toUtc(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export const validDay = (day: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(toUtc(day));

export function addReadingDay(days: string[], day: string) {
  return days.includes(day) ? days : [...days, day].sort().slice(-800);
}

/** Consecutive days read, ending today (or yesterday, so the streak survives until bedtime). */
export function currentStreak(days: string[], today: string) {
  const set = new Set(days);
  let cursor = toUtc(today);
  if (!set.has(today)) cursor -= DAY;
  let count = 0;
  while (set.has(new Date(cursor).toISOString().slice(0, 10))) {
    count++;
    cursor -= DAY;
  }
  return count;
}

export function longestStreak(days: string[]) {
  const sorted = [...new Set(days)].filter(validDay).sort();
  let best = 0,
    run = 0,
    prev = NaN;
  for (const day of sorted) {
    const t = toUtc(day);
    run = t - prev === DAY ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

export const daysInYear = (days: string[], year: number) =>
  days.filter((d) => d.startsWith(`${year}-`)).length;

/** Tree stages grow with reading days in the year: seed → sprout → sapling → tree → blossom → fruit. */
export const treeStages = [0, 1, 7, 30, 90, 180] as const;
export function treeStage(readDays: number) {
  let stage = 0;
  treeStages.forEach((min, i) => {
    if (readDays >= min) stage = i;
  });
  return stage;
}
