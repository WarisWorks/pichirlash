import { dictionary } from "../../lib/uyghur/dictionary.ts";
import { splitCells } from "../../lib/uyghur/wordSearch.ts";

export type WordSearchDifficulty = "easy" | "medium" | "hard";
export type WordSearchWord = { word: string; ug: string; en: string };
export type WordSearchCategory = { id: string; label: string; words: string[] };

export const difficulties: Record<
  WordSearchDifficulty,
  { label: string; size: number; count: number; diagonal: boolean; reversed: boolean }
> = {
  easy: { label: "ئاسان", size: 8, count: 5, diagonal: false, reversed: false },
  medium: { label: "ئوتتۇرا", size: 10, count: 7, diagonal: true, reversed: false },
  hard: { label: "قىيىن", size: 12, count: 9, diagonal: true, reversed: true },
};

/** Themed lists; every word is a key of the learner dictionary. */
export const wordSearchCategories: WordSearchCategory[] = [
  {
    id: "nature",
    label: "تەبىئەت",
    words: ["گۈل", "دەرەخ", "يوپۇرماق", "تۇپراق", "ئۇرۇق", "بىخ", "قۇش", "باغ", "تاغ", "سۇ", "تامچە"],
  },
  {
    id: "sky",
    label: "ئاسمان ۋە ھاۋا",
    words: ["قۇياش", "ئاي", "يۇلتۇز", "ئاسمان", "يامغۇر", "شامال", "نۇر", "تاڭ", "كۈن", "دۇنيا"],
  },
  {
    id: "family",
    label: "ئائىلە ۋە ئۆي",
    words: ["ئانا", "ئاتا", "موما", "بوۋا", "بالا", "ئائىلە", "ئۆي", "ھويلا", "ئىشىك", "دېرىزە", "دوست", "نان"],
  },
  {
    id: "colours",
    label: "رەڭ ۋە پەسىل",
    words: ["ئاق", "كۆك", "قىزىل", "يېشىل", "سېرىق", "رەڭ", "باھار", "ياز", "كۈز", "قىش"],
  },
  {
    id: "school",
    label: "مەكتەپ ۋە كىتاب",
    words: ["كىتاب", "بەت", "خەت", "سۆز", "جۈملە", "شېئىر", "ھېكايە", "مەكتەپ", "ئوقۇغۇچى", "سوئال", "جاۋاب", "تىل"],
  },
];

export const SAVED_CATEGORY = "saved";
export const SAVED_MIN = 6;

export function dictionaryWord(word: string): WordSearchWord {
  const entry = dictionary[word];
  return { word, ug: entry?.ug ?? "", en: entry?.en ?? "" };
}

/** True when a word fits as a word-search entry in a grid of this size. */
export function fitsGrid(word: string, size: number) {
  const n = splitCells(word).length;
  return n >= 2 && n <= size && !/\s/.test(word.trim());
}
