import { dictionary } from "../../lib/uyghur/dictionary.ts";
import { convertScript } from "../../lib/uyghur/script.ts";
import { seededRandom, seededShuffle } from "../../lib/uyghur/wordSearch.ts";

export type MemoryMode = "picture" | "script" | "english";
export type MemoryFace =
  | { kind: "text"; text: string; lang: string; dir: "rtl" | "ltr" }
  | { kind: "sticker"; name: string; label: string };
export type MemoryCard = { id: string; pair: string; face: MemoryFace };
export type MemoryPair = { id: string; word: string; a: MemoryFace; b: MemoryFace };

export const memoryModes: { id: MemoryMode; label: string; hint: string }[] = [
  { id: "picture", label: "رەسىم ۋە سۆز", hint: "رەسىمنى ئۇنىڭ ئۇيغۇرچە ئىسمى بىلەن جۈپلەڭ." },
  { id: "script", label: "ئەرەب ۋە لاتىن يېزىقى", hint: "بىر سۆزنىڭ ئىككى خىل يېزىلىشىنى جۈپلەڭ." },
  { id: "english", label: "ئۇيغۇرچە ۋە ئىنگلىزچە", hint: "ئۇيغۇرچە سۆزنى ئىنگلىزچە مەنىسى بىلەن جۈپلەڭ." },
];
export const PAIR_COUNTS = [6, 8] as const;

/** Words whose sticker clearly shows the thing named (sticker names verified in tests). */
export const pictureWords: { word: string; sticker: string; en: string }[] = [
  { word: "گۈل", sticker: "sunflower", en: "flower" },
  { word: "ھەسەل ھەرىسى", sticker: "bee", en: "bee" },
  { word: "توشقان", sticker: "bunny", en: "rabbit" },
  { word: "مۈشۈك", sticker: "cat-loaf", en: "cat" },
  { word: "كۈچۈك", sticker: "puppy", en: "puppy" },
  { word: "تۈلكە", sticker: "fox", en: "fox" },
  { word: "مۈشۈكياپىلاق", sticker: "owl", en: "owl" },
  { word: "پاقا", sticker: "frog", en: "frog" },
  { word: "تاشپاقا", sticker: "turtle", en: "turtle" },
  { word: "ئاي", sticker: "moon-sleepy", en: "moon" },
  { word: "ھەسەن-ھۈسەن", sticker: "rainbow", en: "rainbow" },
  { word: "قار", sticker: "snowflake", en: "snow" },
  { word: "راكېتا", sticker: "rocket", en: "rocket" },
  { word: "سوۋغا", sticker: "gift-wrapped", en: "gift" },
  { word: "چاي", sticker: "teacup", en: "tea" },
  { word: "لىمون", sticker: "lemon-slice", en: "lemon" },
  { word: "قايچا", sticker: "scissors", en: "scissors" },
];

/** Dictionary keys for the two text modes. */
export const memoryWords: string[] = [
  "سۇ", "كىتاب", "گۈل", "دەرەخ", "قۇش", "ئانا", "ئاتا", "نان", "قۇياش", "ئاي",
  "يۇلتۇز", "ئاسمان", "يامغۇر", "شامال", "تاغ", "دوست", "ئىشىك", "دېرىزە",
  "مەكتەپ", "يوپۇرماق", "ئاق", "قىزىل", "كۆك", "سوۋغا", "يول", "باغ",
  "موما", "بوۋا", "قىش", "كۈز", "ئۆي", "ئائىلە", "شېئىر", "تىل",
];

/** The first, plainest English gloss: "bread (naan)" → "bread". */
export const shortEnglish = (word: string) =>
  (dictionary[word]?.en ?? "").split(/[;,(]/)[0].trim();

const ug = (text: string): MemoryFace => ({ kind: "text", text, lang: "ug-Arab", dir: "rtl" });
const ltr = (text: string, lang: string): MemoryFace => ({ kind: "text", text, lang, dir: "ltr" });

export function memoryPairs(mode: MemoryMode): MemoryPair[] {
  if (mode === "picture")
    return pictureWords.map((p) => ({
      id: `picture:${p.word}`,
      word: p.word,
      a: ug(p.word),
      b: { kind: "sticker", name: p.sticker, label: p.en },
    }));
  return memoryWords.map((w) => ({
    id: `${mode}:${w}`,
    word: w,
    a: ug(w),
    b: mode === "script" ? ltr(convertScript(w, "uly"), "ug-Latn") : ltr(shortEnglish(w), "en"),
  }));
}

/** A shuffled deck of 2 × pairs cards; the same seed gives the same deck. */
export function makeDeck(mode: MemoryMode, pairs: number, seed: number): MemoryCard[] {
  const random = seededRandom(seed);
  const chosen = seededShuffle(memoryPairs(mode), random).slice(0, pairs);
  const cards = chosen.flatMap((p) => [
    { id: `${p.id}:a`, pair: p.id, face: p.a },
    { id: `${p.id}:b`, pair: p.id, face: p.b },
  ]);
  return seededShuffle(cards, random);
}

/** Text a screen reader hears for an open card. */
export const faceLabel = (face: MemoryFace) =>
  face.kind === "sticker" ? `رەسىم: ${face.label}` : face.text;
