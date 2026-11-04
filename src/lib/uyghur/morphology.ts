import { cleanWord } from "./script.ts";
import { dictionary } from "./dictionary.ts";
import type { DictEntry } from "./dictionary.ts";

export type Suffix = { form: string; label: string };
export type Analysis = {
  word: string;
  root: string;
  suffixes: Suffix[];
  entry?: DictEntry;
  /** True when the root was found in the dictionary. */
  known: boolean;
};

/** Common inflectional and derivational suffixes, labelled in Uyghur. */
const SUFFIXES: Suffix[] = [
  // Case endings
  ...["نىڭ"].map((form) => ({ form, label: "ئىگىلىك كېلىش" })),
  ...["نى"].map((form) => ({ form, label: "چۈشۈم كېلىش" })),
  ...["غا", "قا", "گە", "كە", "ا", "ە"].map((form) => ({ form, label: "يۆنىلىش كېلىش" })),
  ...["دا", "تا", "دە", "تە"].map((form) => ({ form, label: "ئورۇن كېلىش" })),
  ...["دىن", "تىن"].map((form) => ({ form, label: "چىقىش كېلىش" })),
  ...["دىكى", "تىكى"].map((form) => ({ form, label: "ئورۇن-بەلگە" })),
  ...["غىچە", "قىچە", "گىچە", "كىچە"].map((form) => ({ form, label: "چەك كېلىش" })),
  ...["چە"].map((form) => ({ form, label: "ئوخشاش" })),
  // Possessive endings
  ...["ىمىز", "ۇمىز", "ۈمىز", "مىز"].map((form) => ({ form, label: "بىزنىڭ" })),
  ...["ىڭىز", "ۇڭىز", "ۈڭىز", "ڭىز"].map((form) => ({ form, label: "سىزنىڭ" })),
  ...["ىم", "ۇم", "ۈم", "م"].map((form) => ({ form, label: "مېنىڭ" })),
  ...["ىڭ", "ۇڭ", "ۈڭ", "ڭ"].map((form) => ({ form, label: "سېنىڭ" })),
  ...["سى", "ى"].map((form) => ({ form, label: "ئۇنىڭ" })),
  // Plural
  ...["لار", "لەر", "لىر"].map((form) => ({ form, label: "كۆپلۈك" })),
  // Particles
  ...["مۇ"].map((form) => ({ form, label: "-مۇ (ھەم، سوئال)" })),
  ...["چۇ"].map((form) => ({ form, label: "-چۇ (سوئال)" })),
  // Derivation
  ...["لىق", "لىك", "لۇق", "لۈك"].map((form) => ({ form, label: "ئىسىم/سۈپەت ياسىغۇچى" })),
  ...["سىز"].map((form) => ({ form, label: "-سىز (يوق)" })),
  ...["چى"].map((form) => ({ form, label: "كەسىپ ياسىغۇچى" })),
  // Verb endings
  ...["ماق", "مەك"].map((form) => ({ form, label: "ھەرىكەت نامى" })),
  ...["ىش", "ۇش", "ۈش", "ش"].map((form) => ({ form, label: "ھەرىكەت نامى" })),
  ...["ىمەن", "ىسىز", "ىدۇ", "ايمەن", "ەيمەن", "ايدۇ", "ەيدۇ", "يمەن", "يدۇ"].map((form) => ({ form, label: "ھازىرقى/كەلگۈسى زامان" })),
  ...["دى", "تى", "دىم", "تىم", "دۇق", "تۇق", "دىڭىز", "تىڭىز"].map((form) => ({ form, label: "ئۆتكەن زامان" })),
  ...["غان", "قان", "گەن", "كەن"].map((form) => ({ form, label: "سۈپەتداش" })),
  ...["ىپ", "ۇپ", "ۈپ", "پ"].map((form) => ({ form, label: "ھال پېئىل" })),
  ...["ىلى", "يلى"].map((form) => ({ form, label: "تەكلىپ (بىز)" })),
  ...["ىڭ", "ۇڭ", "ۈڭ"].map((form) => ({ form, label: "بۇيرۇق (سىز)" })),
  ...["الا", "ەلە", "يالا", "يەلە"].map((form) => ({ form, label: "ئىقتىدار (-ala)" })),
  ...["ىۋات", "ۋات"].map((form) => ({ form, label: "داۋاملىشىش" })),
].sort((a, b) => b.form.length - a.form.length);

/**
 * When a suffix is added, a final ا/ە of the root often weakens to ى,
 * and final ق/ك may voice to غ/گ. Undo those changes to find the root.
 */
function rootCandidates(stem: string) {
  const out = [stem];
  if (stem.endsWith("ى")) out.push(stem.slice(0, -1) + "ا", stem.slice(0, -1) + "ە");
  if (stem.endsWith("غ")) out.push(stem.slice(0, -1) + "ق");
  if (stem.endsWith("گ")) out.push(stem.slice(0, -1) + "ك");
  // Middle ە/ا weakened to ى before the last consonant (يۈرىكى ← يۈرەك).
  const m = stem.match(/^(.*)ى([^اەوۇۆۈېى])$/);
  if (m) out.push(`${m[1]}ە${m[2]}`, `${m[1]}ا${m[2]}`);
  // Dropped vowel: كۆڭلۈم ← كۆڭۈل، ئېغزى ← ئېغىز
  const d = stem.match(/^(.*[^اەوۇۆۈېى])([^اەوۇۆۈېى])$/);
  if (d) for (const v of ["ى", "ۇ", "ۈ"]) out.push(`${d[1]}${v}${d[2]}`);
  // Hidden ھ/ى in مېھىر → مېھرى
  const h = stem.match(/^(.*)ھر$/);
  if (h) out.push(`${h[1]}ھىر`);
  return out;
}

function search(stem: string, suffixes: Suffix[], depth: number): Analysis | null {
  for (const candidate of rootCandidates(stem)) {
    const entry = dictionary[candidate];
    if (entry) return { word: "", root: candidate, suffixes, entry, known: true };
  }
  if (depth >= 5) return null;
  for (const suffix of SUFFIXES) {
    if (stem.length - suffix.form.length < 2 || !stem.endsWith(suffix.form)) continue;
    const found = search(stem.slice(0, -suffix.form.length), [suffix, ...suffixes], depth + 1);
    if (found) return found;
  }
  return null;
}

/** Break a word into a dictionary root and its suffixes. */
export function analyzeWord(raw: string): Analysis {
  const word = cleanWord(raw);
  const found = search(word, [], 0);
  if (found) return { ...found, word };
  // Fall back to a best guess: strip the longest common endings without a dictionary hit.
  let stem = word;
  const suffixes: Suffix[] = [];
  for (let i = 0; i < 4; i++) {
    const suffix = SUFFIXES.find(
      (s) => s.form.length > 1 && stem.endsWith(s.form) && stem.length - s.form.length >= 3,
    );
    if (!suffix) break;
    suffixes.unshift(suffix);
    stem = stem.slice(0, -suffix.form.length);
  }
  return { word, root: stem, suffixes, known: false };
}
