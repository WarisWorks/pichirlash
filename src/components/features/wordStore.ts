import { isRecord } from "@/components/play/model";

export type SavedWord = {
  word: string;
  root: string;
  ug: string;
  en: string;
  day: string;
  /** Times answered correctly in flashcard review. */
  known: number;
};
export const WORDS_KEY = "pichirlash-words-v1";
export const validWords = (v: unknown): v is SavedWord[] =>
  Array.isArray(v) &&
  v.length <= 500 &&
  v.every(
    (x) =>
      isRecord(x) &&
      ["word", "root", "ug", "en", "day"].every((k) => typeof x[k] === "string") &&
      typeof x.known === "number",
  );
export function addWord(list: SavedWord[], word: SavedWord) {
  return list.some((w) => w.word === word.word) ? list : [word, ...list].slice(0, 500);
}
