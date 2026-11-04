import { isRecord } from "./model.ts";

export const moods = [
  { key: "great", name: "ناھايىتى خۇشال", sticker: "heart-eyes", color: "#f4c95d" },
  { key: "good", name: "خۇشال", sticker: "smiley", color: "#b9d58c" },
  { key: "okay", name: "ئادەتتىكىدەك", sticker: "thinking-face", color: "#c9d6e3" },
  { key: "tired", name: "ھارغىن", sticker: "sleepy", color: "#d6c4e4" },
  { key: "sad", name: "غەمكىن", sticker: "raindrop-pal", color: "#9fb7d6" },
] as const;
export type MoodKey = (typeof moods)[number]["key"];

export const diaryTags = [
  { key: "family", name: "ئائىلە" },
  { key: "school", name: "مەكتەپ" },
  { key: "friends", name: "دوستلار" },
  { key: "reading", name: "ئوقۇش" },
  { key: "weather", name: "ھاۋا" },
  { key: "play", name: "ئويۇن" },
  { key: "nature", name: "تەبىئەت" },
  { key: "food", name: "تائام" },
  { key: "music", name: "مۇزىكا" },
  { key: "sport", name: "تەنتەربىيە" },
] as const;
export type TagKey = (typeof diaryTags)[number]["key"];

export const diaryLimits = { text: 2000, tags: 4, entries: 800 } as const;

export type DiaryEntry = {
  day: string;
  mood: MoodKey;
  tags: TagKey[];
  text: string;
  updated: number;
};
export type Diary = Record<string, DiaryEntry>;

export const monthNames = [
  "يانۋار",
  "فېۋرال",
  "مارت",
  "ئاپرېل",
  "ماي",
  "ئىيۇن",
  "ئىيۇل",
  "ئاۋغۇست",
  "سېنتەبىر",
  "ئۆكتەبىر",
  "نويابىر",
  "دېكابىر",
] as const;
/** Monday first. `short` is the first letter, which is distinct for every day. */
export const weekdayNames = [
  { name: "دۈشەنبە", short: "د" },
  { name: "سەيشەنبە", short: "س" },
  { name: "چارشەنبە", short: "چ" },
  { name: "پەيشەنبە", short: "پ" },
  { name: "جۈمە", short: "ج" },
  { name: "شەنبە", short: "ش" },
  { name: "يەكشەنبە", short: "ي" },
] as const;

const moodKeys: readonly string[] = moods.map((m) => m.key);
const tagKeys: readonly string[] = diaryTags.map((t) => t.key);
export const moodOf = (key: MoodKey) => moods.find((m) => m.key === key)!;
export const tagName = (key: TagKey) => diaryTags.find((t) => t.key === key)!.name;

export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export function daysInMonth(year: number, month0: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month0];
}

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

/** Parses "YYYY-MM-DD" into a real calendar date, or null. */
export function parseDay(day: string): { y: number; m0: number; d: number } | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(day);
  if (!m) return null;
  const y = Number(m[1]),
    m0 = Number(m[2]) - 1,
    d = Number(m[3]);
  if (m0 < 0 || m0 > 11 || d < 1 || d > daysInMonth(y, m0)) return null;
  return { y, m0, d };
}
export const isDay = (v: unknown): v is string => typeof v === "string" && parseDay(v) !== null;

/** 0 = Monday … 6 = Sunday (calendar maths in UTC so time zones never shift it). */
export function weekdayIndex(y: number, m0: number, d: number): number {
  return (new Date(Date.UTC(y, m0, d)).getUTCDay() + 6) % 7;
}

/** Weeks of the month, Monday first; empty cells are null. */
export function monthGrid(year: number, month0: number): (string | null)[][] {
  const first = weekdayIndex(year, month0, 1),
    count = daysInMonth(year, month0);
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= count; d++) cells.push(dayKey(year, month0, d));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** ISO 8601 week id such as "2026-W45" (weeks start Monday; week 1 holds the first Thursday). */
export function isoWeekId(day: string): string {
  const p = parseDay(day);
  if (!p) throw Error("bad-day");
  const date = new Date(Date.UTC(p.y, p.m0, p.d));
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() + 3 - weekdayIndex(p.y, p.m0, p.d));
  const year = thursday.getUTCFullYear();
  const week =
    1 + Math.floor((thursday.getTime() - Date.UTC(year, 0, 1)) / 86400000 / 7);
  return `${year}-W${pad(week)}`;
}

/** Moves a day key by n days. */
export function addDays(day: string, n: number): string {
  const p = parseDay(day);
  if (!p) return day;
  const t = new Date(Date.UTC(p.y, p.m0, p.d + n));
  return dayKey(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
}

/** «2026-يىلى 4-نويابىر، چارشەنبە» */
export function longDate(day: string): string {
  const p = parseDay(day);
  if (!p) return day;
  return `${p.y}-يىلى ${p.d}-${monthNames[p.m0]}، ${weekdayNames[weekdayIndex(p.y, p.m0, p.d)].name}`;
}

export function validEntry(v: unknown): v is DiaryEntry {
  return (
    isRecord(v) &&
    isDay(v.day) &&
    moodKeys.includes(String(v.mood)) &&
    Array.isArray(v.tags) &&
    v.tags.length <= diaryLimits.tags &&
    v.tags.every((t) => tagKeys.includes(String(t))) &&
    new Set(v.tags).size === v.tags.length &&
    typeof v.text === "string" &&
    v.text.length <= diaryLimits.text &&
    typeof v.updated === "number" &&
    Number.isFinite(v.updated) &&
    v.updated >= 0
  );
}

export function validDiary(v: unknown): v is Diary {
  if (!isRecord(v)) return false;
  const entries = Object.entries(v);
  return (
    entries.length <= diaryLimits.entries &&
    entries.every(([day, e]) => validEntry(e) && e.day === day)
  );
}

/** Saves an entry for its day. Returns null when a new day would pass the limit. */
export function putEntry(diary: Diary, entry: DiaryEntry): Diary | null {
  if (!(entry.day in diary) && Object.keys(diary).length >= diaryLimits.entries) return null;
  return { ...diary, [entry.day]: entry };
}
export function dropEntry(diary: Diary, day: string): Diary {
  const next = { ...diary };
  delete next[day];
  return next;
}

/** How many days of the month had each mood. */
export function monthSummary(diary: Diary, year: number, month0: number) {
  const prefix = `${year}-${pad(month0 + 1)}-`;
  const counts = Object.fromEntries(moods.map((m) => [m.key, 0])) as Record<MoodKey, number>;
  let total = 0;
  for (const e of Object.values(diary))
    if (e.day.startsWith(prefix)) {
      counts[e.mood]++;
      total++;
    }
  return { counts, total };
}

export const diaryPrompts = [
  "بۈگۈن سىزنى كۈلدۈرگەن بىر ئىش نېمە بولدى؟",
  "بۈگۈن كىمگە رەھمەت ئېيتقىڭىز كېلىدۇ؟",
  "بۈگۈن ئۆگەنگەن بىر يېڭى نەرسىنى يېزىڭ.",
  "بۈگۈنكى ھاۋا كۆڭلىڭىزگە قانداق تەسىر قىلدى؟",
  "ئەتە قىلماقچى بولغان بىر كىچىك ياخشى ئىشنى يېزىڭ.",
  "بۈگۈن يېگەن ئەڭ مەززىلىك نەرسە نېمە ئىدى؟",
  "بۈگۈن قايسى بىر ئاۋاز ياكى پۇراق ئېسىڭىزدە قالدى؟",
  "بۈگۈن ئۆزىڭىزدىن پەخىرلەنگەن بىر پەيت بارمۇ؟",
  "بۈگۈن قىيىن بولغان بىر ئىشنى ۋە ئۇنى قانداق يەڭگىنىڭىزنى يېزىڭ.",
  "ئائىلىڭىزدىكى بىرىنىڭ بۈگۈن ئېيتقان بىر گېپىنى خاتىرىلەڭ.",
  "بۈگۈن ئوقۇغان ياكى ئاڭلىغان بىر ھېكايە ھەققىدە يېزىڭ.",
  "ھازىر دېرىزىدىن قارىسىڭىز نېمىنى كۆرىسىز؟",
  "بۈگۈنكى كۈنىڭىزنى ئۈچ سۆز بىلەن تەسۋىرلەڭ.",
  "دوستىڭىزغا بۈگۈن نېمە دېمەكچى بولدىڭىز؟",
] as const;

/** A gentle prompt that stays the same all day. */
export function promptFor(day: string): string {
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return diaryPrompts[h % diaryPrompts.length];
}
