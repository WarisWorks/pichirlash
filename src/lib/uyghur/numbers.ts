/**
 * Uyghur numbers in words, ordinals and telling the time (standard UEY spelling).
 * Pure functions, so they can be tested and reused anywhere.
 *
 * Conventions chosen here:
 * - A hundreds digit of 1 is just "يۈز" (100 = يۈز, 120 = يۈز يىگىرمە,
 *   1100 = بىر مىڭ يۈز), while the larger scales always take a number:
 *   1000 = بىر مىڭ, 1000000 = بىر مىليون, 1000000000 = بىر مىليارد.
 *   The parser also accepts "بىر يۈز" and a bare "مىڭ".
 * - Negative numbers start with "مىنۇس".
 * - Time is told on a 12-hour clock with minutes past the hour up to 44,
 *   half past as "يېرىم", and from 45 on as minutes left to the next hour:
 *   3:00 سائەت ئۈچ · 3:10 سائەت ئۈچتىن ئون مىنۇت ئۆتتى · 3:30 سائەت ئۈچ يېرىم ·
 *   3:50 سائەت تۆتكە ئون مىنۇت بار.
 */

export const MAX_NUMBER = 999_999_999_999;

const ones = ["", "بىر", "ئىككى", "ئۈچ", "تۆت", "بەش", "ئالتە", "يەتتە", "سەككىز", "توققۇز"];
const tens = ["", "ئون", "يىگىرمە", "ئوتتۇز", "قىرىق", "ئەللىك", "ئاتمىش", "يەتمىش", "سەكسەن", "توقسان"];
const HUNDRED = "يۈز";
const ZERO = "نۆل";
const MINUS = "مىنۇس";
const scales: [number, string][] = [
  [1_000_000_000, "مىليارد"],
  [1_000_000, "مىليون"],
  [1_000, "مىڭ"],
];

/** Words for 1..999 (empty for 0). */
function groupWords(n: number): string[] {
  const out: string[] = [];
  const h = Math.floor(n / 100),
    t = Math.floor((n % 100) / 10),
    u = n % 10;
  if (h > 1) out.push(ones[h]);
  if (h > 0) out.push(HUNDRED);
  if (t > 0) out.push(tens[t]);
  if (u > 0) out.push(ones[u]);
  return out;
}

/** Spell an integer in Uyghur words, e.g. 1234 → "بىر مىڭ ئىككى يۈز ئوتتۇز تۆت". */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || Math.abs(n) > MAX_NUMBER)
    throw new RangeError(`numberToWords: unsupported number ${n}`);
  if (n === 0) return ZERO;
  if (n < 0) return `${MINUS} ${numberToWords(-n)}`;
  const words: string[] = [];
  let rest = n;
  for (const [value, name] of scales) {
    const count = Math.floor(rest / value);
    if (count > 0) words.push(...groupWords(count), name);
    rest %= value;
  }
  words.push(...groupWords(rest));
  return words.join(" ");
}

const VOWELS = /[اەوۇۆۈېى]$/;
/** Final-syllable a/e that weakens to ى before the suffix (سەكسەن → سەكسىنىنچى). */
const weakened: Record<string, string> = { سەكسەن: "سەكسىن", توقسان: "توقسىن" };

/** Add the ordinal suffix -(ى)نچى to one word, with ا/ە → ى weakening. */
export function ordinalWord(word: string): string {
  if (weakened[word]) return `${weakened[word]}ىنچى`;
  if (/[اە]$/.test(word)) return `${word.slice(0, -1)}ىنچى`;
  if (VOWELS.test(word)) return `${word}نچى`;
  return `${word}ىنچى`;
}

/** Ordinal number in words: 1 → بىرىنچى, 6 → ئالتىنچى, 21 → يىگىرمە بىرىنچى. */
export function ordinal(n: number): string {
  const words = numberToWords(n).split(" ");
  words[words.length - 1] = ordinalWord(words[words.length - 1]);
  return words.join(" ");
}

const ablative = ["", "بىردىن", "ئىككىدىن", "ئۈچتىن", "تۆتتىن", "بەشتىن", "ئالتىدىن", "يەتتىدىن", "سەككىزدىن", "توققۇزدىن", "ئوندىن", "ئون بىردىن", "ئون ئىككىدىن"];
const dative = ["", "بىرگە", "ئىككىگە", "ئۈچكە", "تۆتكە", "بەشكە", "ئالتىگە", "يەتتىگە", "سەككىزگە", "توققۇزغا", "ئونغا", "ئون بىرگە", "ئون ئىككىگە"];

/** The minute from which time is told as "minutes left to the next hour". */
export const TO_FROM_MINUTE = 45;

/** Hour 0..23 on a 12-hour dial (0 and 12 → 12). */
export const dialHour = (h: number) => ((((h % 12) + 12) % 12) || 12);

/** Tell the time in words (12-hour clock). See the module comment for the phrasing. */
export function timeToWords(h: number, m: number): string {
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59)
    throw new RangeError(`timeToWords: unsupported time ${h}:${m}`);
  const hour = dialHour(h);
  if (m === 0) return `سائەت ${numberToWords(hour)}`;
  if (m === 30) return `سائەت ${numberToWords(hour)} يېرىم`;
  if (m < TO_FROM_MINUTE)
    return `سائەت ${ablative[hour]} ${numberToWords(m)} مىنۇت ئۆتتى`;
  const next = (hour % 12) + 1;
  return `سائەت ${dative[next]} ${numberToWords(60 - m)} مىنۇت بار`;
}

/** Digital clock text with Western digits, e.g. "3:05". */
export const timeToDigits = (h: number, m: number) =>
  `${dialHour(h)}:${String(m).padStart(2, "0")}`;

const valueMap = (words: string[], times: number) =>
  new Map<string, number>(
    words.flatMap((w, i): [string, number][] => (w ? [[w, i * times]] : [])),
  );
const unitValue = valueMap(ones, 1);
const tensValue = valueMap(tens, 10);
const scaleValue = new Map<string, number>(scales.map(([v, w]) => [w, v]));

/** Parse 0..999 from tokens: [unit] يۈز? [tens]? [unit]?; null when malformed. */
function parseGroup(tokens: string[]): number | null {
  let i = 0,
    value = 0;
  if (tokens[i + 1] === HUNDRED && unitValue.has(tokens[i])) {
    value = unitValue.get(tokens[i])! * 100;
    i += 2;
  } else if (tokens[i] === HUNDRED) {
    value = 100;
    i++;
  }
  if (tensValue.has(tokens[i])) value += tensValue.get(tokens[i++])!;
  if (unitValue.has(tokens[i])) value += unitValue.get(tokens[i++])!;
  return i === tokens.length && i > 0 ? value : null;
}

/** Normalise look-alike letters and spacing before parsing words. */
const tidy = (text: string) =>
  text
    .replace(/ک/g, "ك")
    .replace(/ی/g, "ى")
    .replace(/ه(?=\s|$)/g, "ە")
    .replace(/‌|‍|ـ/g, "")
    .replace(/[،,.!؟?]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

/**
 * Read a number written in Uyghur words, as produced by numberToWords
 * (also "بىر يۈز" and a bare "مىڭ"). Returns null when the text is not a number.
 */
export function wordsToNumber(text: string): number | null {
  let tokens = tidy(text);
  let sign = 1;
  if (tokens[0] === MINUS) {
    sign = -1;
    tokens = tokens.slice(1);
  }
  if (tokens.length === 0) return null;
  if (tokens.length === 1 && tokens[0] === ZERO) return sign === 1 ? 0 : null;
  let total = 0,
    lastScale = Infinity,
    group: string[] = [];
  for (const token of tokens) {
    const scale = scaleValue.get(token);
    if (scale === undefined) {
      if (!unitValue.has(token) && !tensValue.has(token) && token !== HUNDRED)
        return null;
      group.push(token);
      continue;
    }
    if (scale >= lastScale) return null;
    const count = group.length ? parseGroup(group) : 1;
    if (!count) return null;
    total += count * scale;
    lastScale = scale;
    group = [];
  }
  if (group.length) {
    const rest = parseGroup(group);
    if (rest === null) return null;
    total += rest;
  }
  return total === 0 ? null : sign * total;
}

/**
 * Three plausible wrong answers for a number quiz: neighbours, a tens step
 * and swapped digits, all distinct, non-negative and within [0, max].
 */
export function numberDistractors(
  n: number,
  max: number,
  random: () => number = Math.random,
): number[] {
  const swapped = Number(String(n).split("").reverse().join(""));
  const span = Math.max(3, Math.round(max / 10));
  const candidates = [
    n + 1,
    n - 1,
    n + 10,
    n - 10,
    swapped,
    n + 100,
    n - 100,
    n + 2,
    n - 2,
  ].filter((x) => x >= 0 && x <= max && x !== n);
  const picked: number[] = [];
  const pool = [...new Set(candidates)];
  while (picked.length < 3 && pool.length) {
    const i = Math.floor(random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  for (let tries = 0; picked.length < 3 && tries < 200; tries++) {
    const x = Math.max(0, Math.min(max, n + Math.round((random() * 2 - 1) * span)));
    if (x !== n && !picked.includes(x)) picked.push(x);
  }
  return picked;
}

/** Turn any Arabic-Indic or Persian digits into Western digits 0-9. */
export const westernDigits = (text: string) =>
  text.replace(/[٠-٩۰-۹]/g, (d) =>
    String((d.charCodeAt(0) - (d >= "۰" ? 0x06f0 : 0x0660)) % 10),
  );
