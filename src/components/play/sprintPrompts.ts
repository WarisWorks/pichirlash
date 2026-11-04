import { isRecord } from "./model.ts";

/** Original free-writing prompts. */
export const sprintPrompts = [
  "بىر كۈنى ئەتىگەن ئويغانسىڭىز، ئۆيىڭىزدىكى بارلىق نەرسىلەر گەپ قىلىدىغان بولۇپ قاپتۇ. بىرىنچى بولۇپ قايسىسى سۆزلىدى؟",
  "مومىڭىزنىڭ ساندۇقىدىن بىر كونا خەت چىقتى. خەتتە نېمىلەر يېزىلغان؟",
  "يامغۇرلۇق بىر كۈنى دېرىزە ئالدىدا ئولتۇرغان بىر مۈشۈكنىڭ خىياللىرىنى يېزىڭ.",
  "ئەڭ ياخشى كۆرىدىغان تائامىڭىزنىڭ پۇرىقى سىزنى قايسى ئەسلىمىگە ئېلىپ بارىدۇ؟",
  "بىر كىچىك ئۇرۇق يەر ئاستىدا ئويغىنىپ، قۇياشنى ئىزدەشكە باشلىدى…",
  "ئون يىلدىن كېيىنكى ئۆزىڭىزگە بىر خەت يېزىڭ.",
  "بازاردا ھېچكىم كۆرۈپ باقمىغان سېھىرلىك نەرسىلەرنى ساتىدىغان بىر دۇكان ئېچىلدى. ئۇ يەردە نېمىلەر بار؟",
  "بىر كۈنلۈك قۇش بولۇپ قالسىڭىز، قەيەرلەرگە ئۇچقان بولاتتىڭىز؟",
  "ئاسماندىن قار ئەمەس، ئۈرۈك گۈلى ياغقان بىر كۈننى تەسۋىرلەڭ.",
  "دوستىڭىز بىلەن بىللە باشتىن كەچۈرگەن ئەڭ قىزىقارلىق بىر ئىشنى ھېكايە قىلىڭ.",
  "كۇتۇپخانىدىكى بىر كىتاب كېچىسى ئۆز بەتلىرىدىن چىقىپ، سەيلىگە ماڭدى…",
  "ئۆيىڭىزدىكى ئەڭ كونا نەرسە ئۆزىنىڭ تەرجىمىھالىنى ئۆزى سۆزلەپ بەرسۇن.",
  "بىر يولۇچى قۇملۇقتا بىر كونا قۇدۇق تاپتى. قۇدۇق ئۇنىڭدىن بىر سوئال سورىدى.",
  "سىزنى ئەڭ كۆپ كۈلدۈرىدىغان ئادەم ھەققىدە يېزىڭ.",
  "ئەگەر ھەر بىر ئادەم كۈنىگە پەقەت يۈز سۆزلا قىلالىسا، دۇنيا قانداق بولار ئىدى؟",
  "تۈنۈگۈن كېچە كۆرگەن چۈشىڭىزنى داۋاملاشتۇرۇپ يېزىڭ — ياكى يېڭى بىر چۈش ئويدۇرۇڭ.",
  "دۇتارنىڭ تارىدىن چىققان بىر ئاھاڭ شامالغا ئەگىشىپ سەپەرگە چىقتى…",
  "كىچىك ۋاقتىڭىزدا قورقىدىغان بىر نەرسە ۋە ئۇنىڭدىن قانداق قورقمايدىغان بولغىنىڭىز ھەققىدە يېزىڭ.",
  "ئاي بىر كېچىسى يەرگە چۈشۈپ، بىر يېزىدا مېھمان بولدى.",
  "قولىڭىزدىكى قەلەم سىزگە ئۆزى خالىغان بىر ھېكايىنى يازدۇرماقچى بولدى.",
  "تامدىكى رەسىمدىكى ئادەم رامكىدىن چىقىپ، سىز بىلەن پاراڭلاشتى.",
  "ئۆزىڭىز ياشاۋاتقان كوچىنى ئۇنى تۇنجى قېتىم كۆرگەن بىر مېھماننىڭ كۆزى بىلەن تەسۋىرلەڭ.",
  "يولدىن ئېزىپ قېلىپ، ئويلىمىغان بىر يەرنى تاپقان كۈنىڭىزنى يېزىڭ.",
  "بىر سېھىرلىك سۆز بىلەن بىر نەرسىنى ئۆزگەرتەلىسىڭىز، نېمىنى ئۆزگەرتكەن بولاتتىڭىز؟",
  "قىش كېچىسى ئوچاق بېشىدا ئاڭلىغان بىر چۆچەكنى ئۆز سۆزىڭىز بىلەن قايتا يېزىڭ.",
] as const;

export const sprintMinutes = [5, 10, 15] as const;
export const goalPresets = [50, 100, 200, 300] as const;
export const sprintLimits = {
  saved: 50,
  text: 30000,
  minGoal: 10,
  maxGoal: 3000,
} as const;

/** Words separated by any whitespace; lone punctuation (— ، .) is not a word. */
export function countWords(text: string): number {
  let n = 0;
  for (const token of text.split(/\s+/)) if (/[\p{L}\p{N}]/u.test(token)) n++;
  return n;
}

/** m:ss with Western digits. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** True when `next` only adds text to `prev` (nothing removed or replaced). */
export function onlyAdds(prev: string, next: string): boolean {
  if (next.length < prev.length) return false;
  let p = 0;
  while (p < prev.length && prev[p] === next[p]) p++;
  let s = 0;
  while (
    s < prev.length - p &&
    prev[prev.length - 1 - s] === next[next.length - 1 - s]
  )
    s++;
  return p + s >= prev.length;
}

export function randomPrompt(except?: string, random = Math.random): string {
  const pool = sprintPrompts.filter((p) => p !== except);
  return pool[Math.floor(random() * pool.length) % pool.length];
}

export type SprintDraft = {
  prompt: string;
  text: string;
  goal: number;
  minutes: number;
  /** Milliseconds written so far (not counting pauses). */
  elapsed: number;
  noDelete: boolean;
  goalHit: boolean;
};
export type SavedSprint = {
  id: string;
  day: string;
  prompt: string;
  text: string;
  words: number;
  goal: number;
  minutes: number;
  seconds: number;
  noDelete: boolean;
  created: number;
};

const validGoal = (v: unknown) =>
  Number.isInteger(v) &&
  (v as number) >= sprintLimits.minGoal &&
  (v as number) <= sprintLimits.maxGoal;
const validMinutes = (v: unknown) => (sprintMinutes as readonly unknown[]).includes(v);
const finiteAtLeast0 = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;

export function validSprintDraft(v: unknown): v is SprintDraft | null {
  return (
    v === null ||
    (isRecord(v) &&
      typeof v.prompt === "string" &&
      v.prompt.length <= 400 &&
      typeof v.text === "string" &&
      v.text.length <= sprintLimits.text &&
      validGoal(v.goal) &&
      validMinutes(v.minutes) &&
      finiteAtLeast0(v.elapsed) &&
      (v.elapsed as number) <= (v.minutes as number) * 60000 &&
      typeof v.noDelete === "boolean" &&
      typeof v.goalHit === "boolean")
  );
}

export function validSavedSprint(v: unknown): v is SavedSprint {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    v.id.length > 0 &&
    v.id.length <= 80 &&
    typeof v.day === "string" &&
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v.day) &&
    typeof v.prompt === "string" &&
    v.prompt.length <= 400 &&
    typeof v.text === "string" &&
    v.text.length <= sprintLimits.text &&
    Number.isInteger(v.words) &&
    (v.words as number) >= 0 &&
    validGoal(v.goal) &&
    validMinutes(v.minutes) &&
    finiteAtLeast0(v.seconds) &&
    typeof v.noDelete === "boolean" &&
    finiteAtLeast0(v.created)
  );
}

export function validSavedSprints(v: unknown): v is SavedSprint[] {
  return (
    Array.isArray(v) &&
    v.length <= sprintLimits.saved &&
    v.every(validSavedSprint) &&
    new Set(v.map((s) => s.id)).size === v.length
  );
}

/** Words per minute, rounded; 0 for very short sprints. */
export function wordsPerMinute(words: number, seconds: number): number {
  return seconds < 10 ? 0 : Math.round(words / (seconds / 60));
}
