/**
 * Uyghur script conversion between the Arabic-based alphabet (UEY),
 * the Latin alphabet (ULY) and the Cyrillic alphabet (USY).
 * Pure functions so they can be tested and reused for read-aloud and typing.
 */
export type UyghurScript = "uey" | "uly" | "usy";

export const scriptNames: Record<UyghurScript, string> = {
  uey: "ئەرەب يېزىقى",
  uly: "Latin yéziqi",
  usy: "Кирил йезиқи",
};

const HAMZA = "ئ";
const VOWELS = new Set(["ا", "ە", "و", "ۇ", "ۆ", "ۈ", "ې", "ى"]);

/** Normalise Persian/Arabic look-alikes and drop tatweel and harakat. */
export function normalizeUey(text: string) {
  return text
    .replace(/[كک]/g, "ك")
    .replace(/[یى]/g, "ى")
    .replace(/ە|ه(?=\s|$|[،؛؟.!?])/g, "ە")
    .replace(/[ـً-ٟ]/g, "");
}

const toLatin: Record<string, string> = {
  ا: "a", ە: "e", ب: "b", پ: "p", ت: "t", ج: "j", چ: "ch", خ: "x",
  د: "d", ر: "r", ز: "z", ژ: "zh", س: "s", ش: "sh", غ: "gh", ف: "f",
  ق: "q", ك: "k", گ: "g", ڭ: "ng", ل: "l", م: "m", ن: "n", ھ: "h",
  و: "o", ۇ: "u", ۆ: "ö", ۈ: "ü", ۋ: "w", ې: "é", ى: "i", ي: "y",
  "،": ",", "؛": ";", "؟": "?", "٪": "%",
};

const toCyrillic: Record<string, string> = {
  ا: "а", ە: "ә", ب: "б", پ: "п", ت: "т", ج: "җ", چ: "ч", خ: "х",
  د: "д", ر: "р", ز: "з", ژ: "ж", س: "с", ش: "ш", غ: "ғ", ف: "ф",
  ق: "қ", ك: "к", گ: "г", ڭ: "ң", ل: "л", م: "м", ن: "н", ھ: "һ",
  و: "о", ۇ: "у", ۆ: "ө", ۈ: "ү", ۋ: "в", ې: "е", ى: "и", ي: "й",
  "،": ",", "؛": ";", "؟": "?", "٪": "%",
};

const isLetter = (ch: string | undefined) =>
  !!ch && (ch in toLatin) && !"،؛؟٪".includes(ch);

/** Latin digraph letters whose halves could be misread (n+g, s+h, z+h, g+h, c+h). */
const LATIN_SPLIT: Record<string, string> = { ن: "g", س: "h", ز: "h", گ: "h" };

/** True when a word at this offset begins a sentence. */
const startsSentence = (text: string, offset: number) =>
  /(^|[.!?؟]\s+|\n\s*|[«“"]\s*)$/.test(text.slice(Math.max(0, offset - 4), offset)) ||
  offset === 0;

function convertWord(word: string, target: "uly" | "usy") {
  const map = target === "uly" ? toLatin : toCyrillic;
  let out = "";
  for (let i = 0; i < word.length; i++) {
    const ch = word[i],
      prev = word[i - 1],
      next = word[i + 1];
    if (ch === HAMZA) {
      // Word-initial hamza is silent; between letters it marks a syllable break.
      if (isLetter(prev) && target === "uly") out += "'";
      continue;
    }
    if (target === "usy" && ch === "ي" && (next === "ا" || next === "ۇ")) {
      out += next === "ا" ? "я" : "ю";
      i++;
      continue;
    }
    const mapped = map[ch];
    if (mapped === undefined) {
      out += ch;
      continue;
    }
    out += mapped;
    if (target === "uly") {
      const split = LATIN_SPLIT[ch];
      if (split && next && toLatin[next]?.startsWith(split)) out += "'";
    }
  }
  return out;
}

/** Convert Arabic-script Uyghur (UEY) text to Latin (ULY) or Cyrillic (USY). */
export function convertScript(text: string, target: UyghurScript): string {
  if (target === "uey") return text;
  const normalized = normalizeUey(text);
  return normalized
    .replace(/[\u0600-\u06FF]+/g, (word, offset: number) => {
      const out = convertWord(word, target);
      return startsSentence(normalized, offset)
        ? out.charAt(0).toUpperCase() + out.slice(1)
        : out;
    })
    .replace(/«|»/g, (q) => (q === "«" ? "“" : "”"));
}

/** The writing direction to use for a script. */
export const scriptDir = (script: UyghurScript) =>
  script === "uey" ? "rtl" : "ltr";

const latinToUey: [string, string][] = [
  ["ch", "چ"], ["gh", "غ"], ["ng", "ڭ"], ["sh", "ش"], ["zh", "ژ"],
  ["a", "ا"], ["e", "ە"], ["é", "ې"], ["ë", "ې"], ["i", "ى"], ["o", "و"],
  ["u", "ۇ"], ["ö", "ۆ"], ["ü", "ۈ"], ["b", "ب"], ["p", "پ"], ["t", "ت"],
  ["j", "ج"], ["x", "خ"], ["d", "د"], ["r", "ر"], ["z", "ز"], ["s", "س"],
  ["f", "ف"], ["q", "ق"], ["k", "ك"], ["g", "گ"], ["l", "ل"], ["m", "م"],
  ["n", "ن"], ["h", "ھ"], ["w", "ۋ"], ["v", "ۋ"], ["y", "ي"], ["c", "چ"],
  [",", "،"], [";", "؛"], ["?", "؟"],
];

/**
 * Convert Latin-script Uyghur (ULY) typed on any keyboard to Arabic script.
 * Accepts é/ë for ې, ö and ü, and an apostrophe to split letters (n'g, sa'et).
 */
export function latinToArabic(text: string): string {
  const source = text.normalize("NFC").toLowerCase().replace(/[’ʼ`]/g, "'");
  let out = "";
  let prevLetter: string | null = null;
  for (let i = 0; i < source.length; ) {
    if (source[i] === "'") {
      i++;
      // An apostrophe before a vowel inside a word becomes a hamza.
      const nextVowel = latinToUey.find(
        ([lat, uey]) => VOWELS.has(uey) && source.startsWith(lat, i),
      );
      if (nextVowel && prevLetter) {
        out += HAMZA + nextVowel[1];
        prevLetter = nextVowel[1];
        i += nextVowel[0].length;
      }
      continue;
    }
    const pair = latinToUey.find(([lat]) => source.startsWith(lat, i));
    if (!pair) {
      out += source[i];
      prevLetter = /\p{L}/u.test(source[i]) ? source[i] : null;
      i++;
      continue;
    }
    const [lat, uey] = pair;
    const isPunct = !(uey in toLatin) || "،؛؟".includes(uey);
    if (VOWELS.has(uey) && (!prevLetter || VOWELS.has(prevLetter))) out += HAMZA;
    out += uey;
    prevLetter = isPunct ? null : uey;
    i += lat.length;
  }
  return out;
}

const UEY_VOWEL_RE = /[اەوۇۆۈېى]/g;

/** Count syllables of an Arabic-script Uyghur word or line (one per vowel). */
export function countSyllables(text: string) {
  return (normalizeUey(text).match(UEY_VOWEL_RE) || []).length;
}

/** Strip punctuation so words can be compared and looked up. */
export function cleanWord(word: string) {
  return normalizeUey(word).replace(/[^ؠ-ۿ]/g, "");
}

/**
 * The rhyme key of a line: its last word from the second-to-last vowel onward.
 * Uyghur rhymes (qapiye) are usually judged by this ending.
 */
export function rhymeKey(line: string) {
  const words = line.split(/\s+/).map(cleanWord).filter(Boolean);
  const last = words[words.length - 1];
  if (!last) return "";
  const latin = convertWord(last, "uly").replace(/'/g, "");
  const match =
    latin.match(/[aeéiouöü][^aeéiouöü]*[aeéiouöü][^aeéiouöü]*$/) ||
    latin.match(/[aeéiouöü][^aeéiouöü]*$/);
  return match ? match[0] : latin.slice(-2);
}
