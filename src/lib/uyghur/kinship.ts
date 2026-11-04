/**
 * Uyghur kinship terms and a small resolver for "what do I call…?".
 *
 * Pure data + functions (no React, no aliases) so tests can import this file
 * directly. Only terms we are confident about are given as the main `term`;
 * regional or less certain usages are listed in `variants` with a note, and
 * `verify` marks entries a native speaker should double-check.
 */

/** One step along a family path, e.g. "father" → "older sister". */
export type KinStep =
  | "father"
  | "mother"
  | "olderBrother"
  | "youngerBrother"
  | "olderSister"
  | "youngerSister"
  | "son"
  | "daughter"
  | "husband"
  | "wife";

export type KinKey =
  | "paternalGrandfather"
  | "paternalGrandmother"
  | "maternalGrandfather"
  | "maternalGrandmother"
  | "father"
  | "mother"
  | "fatherBrother"
  | "fatherSister"
  | "motherBrother"
  | "motherSister"
  | "uncleWife"
  | "auntHusband"
  | "fatherInLaw"
  | "motherInLaw"
  | "olderBrother"
  | "youngerBrother"
  | "olderSister"
  | "youngerSister"
  | "olderBrotherWife"
  | "olderSisterHusband"
  | "cousinMale"
  | "cousinFemale"
  | "husband"
  | "wife"
  | "son"
  | "daughter"
  | "siblingChild"
  | "daughterInLaw"
  | "sonInLaw"
  | "grandson"
  | "granddaughter";

export type KinTerm = {
  key: KinKey;
  /** The usual Uyghur word. */
  term: string;
  /** "my …" as a short description, e.g. «دادامنىڭ ئاچىسى». */
  path: string;
  /** Generation relative to me: 2 grandparents … -2 grandchildren. */
  gen: number;
  sex: "m" | "f" | "x";
  /** Short plain explanation. */
  note: string;
  /** Other words people use, with where/when. */
  variants?: { word: string; where: string }[];
  /** A native speaker should double-check this entry. */
  verify?: boolean;
};

export const kinTerms: readonly KinTerm[] = [
  {
    key: "paternalGrandfather",
    term: "بوۋا",
    path: "دادامنىڭ دادىسى",
    gen: 2,
    sex: "m",
    note: "دادىڭىزنىڭ دادىسى.",
    variants: [{ word: "چوڭ دادا", where: "ئىلى قاتارلىق بەزى جايلاردا" }],
  },
  {
    key: "paternalGrandmother",
    term: "موما",
    path: "دادامنىڭ ئاپىسى",
    gen: 2,
    sex: "f",
    note: "دادىڭىزنىڭ ئاپىسى.",
    variants: [{ word: "چوڭ ئاپا", where: "ئىلى قاتارلىق بەزى جايلاردا" }],
  },
  {
    key: "maternalGrandfather",
    term: "بوۋا",
    path: "ئاپامنىڭ دادىسى",
    gen: 2,
    sex: "m",
    note: "ئاپىڭىزنىڭ دادىسى. ئانا تەرەپتىكى بوۋىمۇ «بوۋا» دەپ ئاتىلىدۇ.",
    variants: [{ word: "چوڭ دادا", where: "ئىلى قاتارلىق بەزى جايلاردا" }],
  },
  {
    key: "maternalGrandmother",
    term: "موما",
    path: "ئاپامنىڭ ئاپىسى",
    gen: 2,
    sex: "f",
    note: "ئاپىڭىزنىڭ ئاپىسى. ئانا تەرەپتىكى مومىمۇ «موما» دەپ ئاتىلىدۇ.",
    variants: [{ word: "چوڭ ئاپا", where: "ئىلى قاتارلىق بەزى جايلاردا" }],
  },
  {
    key: "father",
    term: "دادا",
    path: "دادام",
    gen: 1,
    sex: "m",
    note: "سىزنىڭ دادىڭىز. سۆزلەشتە «دادا»، يېزىقتا ۋە ھۆرمەت بىلدۈرگەندە «ئاتا» كۆپ ئىشلىتىلىدۇ.",
    variants: [{ word: "ئاتا", where: "يېزىق تىلىدا" }],
  },
  {
    key: "mother",
    term: "ئاپا",
    path: "ئاپام",
    gen: 1,
    sex: "f",
    note: "سىزنىڭ ئاپىڭىز. سۆزلەشتە «ئاپا»، يېزىقتا ۋە ھۆرمەت بىلدۈرگەندە «ئانا» كۆپ ئىشلىتىلىدۇ.",
    variants: [{ word: "ئانا", where: "يېزىق تىلىدا" }],
  },
  {
    key: "fatherBrother",
    term: "تاغا",
    path: "دادامنىڭ ئاكا-ئىنىسى",
    gen: 1,
    sex: "m",
    note: "دادىڭىزنىڭ ئاكىسى ياكى ئىنىسى. كۆپ ئائىلىلەردە ئۇلارمۇ «تاغا» دەپ ئاتىلىدۇ؛ بەزى جايلاردا باشقىچە ئاتاشلارمۇ بار.",
    verify: true,
  },
  {
    key: "fatherSister",
    term: "ھامما",
    path: "دادامنىڭ ئاچا-سىڭلىسى",
    gen: 1,
    sex: "f",
    note: "دادىڭىزنىڭ ئاچىسى ياكى سىڭلىسى.",
  },
  {
    key: "motherBrother",
    term: "تاغا",
    path: "ئاپامنىڭ ئاكا-ئىنىسى",
    gen: 1,
    sex: "m",
    note: "ئاپىڭىزنىڭ ئاكىسى ياكى ئىنىسى.",
  },
  {
    key: "motherSister",
    term: "ھامما",
    path: "ئاپامنىڭ ئاچا-سىڭلىسى",
    gen: 1,
    sex: "f",
    note: "ئاپىڭىزنىڭ ئاچىسى ياكى سىڭلىسى. كۆپ جايلاردا ئۇلارمۇ «ھامما» دەپ ئاتىلىدۇ.",
    variants: [{ word: "خالا", where: "بەزى جايلاردا" }],
    verify: true,
  },
  {
    key: "uncleWife",
    term: "يەڭگە",
    path: "تاغامنىڭ ئايالى",
    gen: 1,
    sex: "f",
    note: "تاغىڭىزنىڭ ئايالى. ئاكىنىڭ ئايالى بىلەن ئوخشاش «يەڭگە» دېيىلىدۇ.",
    verify: true,
  },
  {
    key: "auntHusband",
    term: "يەزنە",
    path: "ھاممامنىڭ ئېرى",
    gen: 1,
    sex: "m",
    note: "ھاممىڭىزنىڭ ئېرى. ئاچىنىڭ ئېرى بىلەن ئوخشاش «يەزنە» دېيىلىدۇ.",
    verify: true,
  },
  {
    key: "fatherInLaw",
    term: "قېيىن ئاتا",
    path: "جورامنىڭ دادىسى",
    gen: 1,
    sex: "m",
    note: "ئېرىڭىز ياكى ئايالىڭىزنىڭ دادىسى.",
  },
  {
    key: "motherInLaw",
    term: "قېيىن ئانا",
    path: "جورامنىڭ ئاپىسى",
    gen: 1,
    sex: "f",
    note: "ئېرىڭىز ياكى ئايالىڭىزنىڭ ئاپىسى.",
  },
  {
    key: "olderBrother",
    term: "ئاكا",
    path: "ئاكام",
    gen: 0,
    sex: "m",
    note: "ئۆزىڭىزدىن چوڭ ئوغۇل قېرىندىشىڭىز. ياشتا چوڭ ئەر كىشىلەرگىمۇ ھۆرمەت بىلەن «ئاكا» دەيمىز.",
  },
  {
    key: "youngerBrother",
    term: "ئۇكا",
    path: "ئىنىم",
    gen: 0,
    sex: "m",
    note: "ئۆزىڭىزدىن كىچىك ئوغۇل قېرىندىشىڭىز. يېزىق تىلىدا «ئىنى»، سۆزلەشتە كۆپىنچە «ئۇكا» دېيىلىدۇ.",
    variants: [{ word: "ئىنى", where: "يېزىق تىلىدا" }],
  },
  {
    key: "olderSister",
    term: "ئاچا",
    path: "ئاچام",
    gen: 0,
    sex: "f",
    note: "ئۆزىڭىزدىن چوڭ قىز قېرىندىشىڭىز. ياشتا چوڭ ئاياللارغىمۇ ھۆرمەت بىلەن شۇنداق دەيمىز.",
    variants: [{ word: "ھەدە", where: "قەشقەر قاتارلىق جەنۇبىي جايلاردا" }],
  },
  {
    key: "youngerSister",
    term: "سىڭىل",
    path: "سىڭلىم",
    gen: 0,
    sex: "f",
    note: "ئۆزىڭىزدىن كىچىك قىز قېرىندىشىڭىز. سۆزلەشتە ئۇنىمۇ «ئۇكا» دەپ چاقىرىمىز.",
    variants: [{ word: "ئۇكا", where: "سۆزلەشتە چاقىرغاندا" }],
  },
  {
    key: "olderBrotherWife",
    term: "يەڭگە",
    path: "ئاكامنىڭ ئايالى",
    gen: 0,
    sex: "f",
    note: "ئاكىڭىزنىڭ ئايالى.",
  },
  {
    key: "olderSisterHusband",
    term: "يەزنە",
    path: "ئاچامنىڭ ئېرى",
    gen: 0,
    sex: "m",
    note: "ئاچىڭىزنىڭ ئېرى.",
  },
  {
    key: "cousinMale",
    term: "ئاكا ياكى ئۇكا",
    path: "تاغا-ھاممامنىڭ ئوغلى",
    gen: 0,
    sex: "m",
    note: "تاغا ياكى ھاممىڭىزنىڭ ئوغلى. ياشقا قاراپ «ئاكا» ياكى «ئۇكا» دەپ چاقىرىلىدۇ.",
    variants: [{ word: "نەۋرە ئاكا / نەۋرە ئۇكا", where: "تونۇشتۇرغاندا" }],
    verify: true,
  },
  {
    key: "cousinFemale",
    term: "ئاچا ياكى سىڭىل",
    path: "تاغا-ھاممامنىڭ قىزى",
    gen: 0,
    sex: "f",
    note: "تاغا ياكى ھاممىڭىزنىڭ قىزى. ياشقا قاراپ «ئاچا» ياكى «سىڭىل» دەپ چاقىرىلىدۇ.",
    variants: [{ word: "نەۋرە ئاچا / نەۋرە سىڭىل", where: "تونۇشتۇرغاندا" }],
    verify: true,
  },
  {
    key: "husband",
    term: "ئەر",
    path: "ئېرىم",
    gen: 0,
    sex: "m",
    note: "ئۆزىڭىزنىڭ جورىسى (ئېرىڭىز).",
  },
  {
    key: "wife",
    term: "ئايال",
    path: "ئايالىم",
    gen: 0,
    sex: "f",
    note: "ئۆزىڭىزنىڭ جورىسى (ئايالىڭىز).",
  },
  {
    key: "son",
    term: "ئوغۇل",
    path: "ئوغلۇم",
    gen: -1,
    sex: "m",
    note: "ئۆزىڭىزنىڭ ئوغلى.",
  },
  {
    key: "daughter",
    term: "قىز",
    path: "قىزىم",
    gen: -1,
    sex: "f",
    note: "ئۆزىڭىزنىڭ قىزى.",
  },
  {
    key: "siblingChild",
    term: "جىيەن",
    path: "قېرىندىشىمنىڭ بالىسى",
    gen: -1,
    sex: "x",
    note: "ئاكا-ئۇكا ياكى ئاچا-سىڭىللىرىڭىزنىڭ بالىسى.",
    verify: true,
  },
  {
    key: "daughterInLaw",
    term: "كېلىن",
    path: "ئوغلۇمنىڭ ئايالى",
    gen: -1,
    sex: "f",
    note: "ئوغلىڭىزنىڭ ئايالى.",
  },
  {
    key: "sonInLaw",
    term: "كۈيئوغۇل",
    path: "قىزىمنىڭ ئېرى",
    gen: -1,
    sex: "m",
    note: "قىزىڭىزنىڭ ئېرى.",
  },
  {
    key: "grandson",
    term: "نەۋرە",
    path: "بالامنىڭ ئوغلى",
    gen: -2,
    sex: "m",
    note: "بالىڭىزنىڭ ئوغلى. «نەۋرە ئوغۇل» دەپمۇ ئېيتىلىدۇ.",
  },
  {
    key: "granddaughter",
    term: "نەۋرە",
    path: "بالامنىڭ قىزى",
    gen: -2,
    sex: "f",
    note: "بالىڭىزنىڭ قىزى. «نەۋرە قىز» دەپمۇ ئېيتىلىدۇ.",
  },
];

export const kinKeys = kinTerms.map((t) => t.key);
const byKey = new Map(kinTerms.map((t) => [t.key, t]));
export const isKinKey = (value: unknown): value is KinKey =>
  typeof value === "string" && byKey.has(value as KinKey);
export function kinTerm(key: KinKey): KinTerm {
  return byKey.get(key)!;
}

export const kinSteps: readonly KinStep[] = [
  "father",
  "mother",
  "olderBrother",
  "youngerBrother",
  "olderSister",
  "youngerSister",
  "son",
  "daughter",
  "husband",
  "wife",
];
export const isKinStep = (value: unknown): value is KinStep =>
  typeof value === "string" && (kinSteps as readonly string[]).includes(value);

/** Labels for choosing a step, plus possessive forms for describing paths. */
export const stepWords: Record<
  KinStep,
  { label: string; noun: string; mine: string; theirs: string; gen: number }
> = {
  father: { noun: "دادا", label: "دادىسى", mine: "دادام", theirs: "دادىسى", gen: 1 },
  mother: { noun: "ئاپا", label: "ئاپىسى", mine: "ئاپام", theirs: "ئاپىسى", gen: 1 },
  olderBrother: { noun: "ئاكا", label: "ئاكىسى (ئۆزىدىن چوڭ ئوغۇل قېرىندىشى)", mine: "ئاكام", theirs: "ئاكىسى", gen: 0 },
  youngerBrother: { noun: "ئىنى", label: "ئىنىسى (ئۆزىدىن كىچىك ئوغۇل قېرىندىشى)", mine: "ئىنىم", theirs: "ئىنىسى", gen: 0 },
  olderSister: { noun: "ئاچا", label: "ئاچىسى (ئۆزىدىن چوڭ قىز قېرىندىشى)", mine: "ئاچام", theirs: "ئاچىسى", gen: 0 },
  youngerSister: { noun: "سىڭىل", label: "سىڭلىسى (ئۆزىدىن كىچىك قىز قېرىندىشى)", mine: "سىڭلىم", theirs: "سىڭلىسى", gen: 0 },
  son: { noun: "ئوغۇل", label: "ئوغلى", mine: "ئوغلۇم", theirs: "ئوغلى", gen: -1 },
  daughter: { noun: "قىز", label: "قىزى", mine: "قىزىم", theirs: "قىزى", gen: -1 },
  husband: { noun: "ئەر", label: "ئېرى", mine: "ئېرىم", theirs: "ئېرى", gen: 0 },
  wife: { noun: "ئايال", label: "ئايالى", mine: "ئايالىم", theirs: "ئايالى", gen: 0 },
};

/** «دادامنىڭ ئاچىسى» for [father, olderSister]. */
export function describePath(steps: readonly KinStep[]): string {
  return steps
    .map((s, i) => {
      const w = i === 0 ? stepWords[s].mine : stepWords[s].theirs;
      return i === steps.length - 1 ? w : `${w}نىڭ`;
    })
    .join(" ");
}

/** «ئايگۈلنىڭ ئاچىسى» — a step from a named person. */
export function describeVia(name: string, step: KinStep): string {
  return `${name.trim() || "ئۇ"}نىڭ ${stepWords[step].theirs}`;
}

type From = KinKey | "self";
const sib = (to: From): Partial<Record<KinStep, From>> => ({
  olderBrother: to,
  youngerBrother: to,
  olderSister: to,
  youngerSister: to,
});
const parents = (f: From, m: From) => ({ father: f, mother: m });

/** Where a single step from a known relative leads. Missing = no single term. */
const table: Record<From, Partial<Record<KinStep, From>>> = {
  self: {
    father: "father",
    mother: "mother",
    olderBrother: "olderBrother",
    youngerBrother: "youngerBrother",
    olderSister: "olderSister",
    youngerSister: "youngerSister",
    son: "son",
    daughter: "daughter",
    husband: "husband",
    wife: "wife",
  },
  father: {
    ...parents("paternalGrandfather", "paternalGrandmother"),
    olderBrother: "fatherBrother",
    youngerBrother: "fatherBrother",
    olderSister: "fatherSister",
    youngerSister: "fatherSister",
    wife: "mother",
  },
  mother: {
    ...parents("maternalGrandfather", "maternalGrandmother"),
    olderBrother: "motherBrother",
    youngerBrother: "motherBrother",
    olderSister: "motherSister",
    youngerSister: "motherSister",
    husband: "father",
  },
  paternalGrandfather: { wife: "paternalGrandmother" },
  paternalGrandmother: { husband: "paternalGrandfather" },
  maternalGrandfather: { wife: "maternalGrandmother" },
  maternalGrandmother: { husband: "maternalGrandfather" },
  fatherBrother: {
    ...parents("paternalGrandfather", "paternalGrandmother"),
    son: "cousinMale",
    daughter: "cousinFemale",
    wife: "uncleWife",
  },
  fatherSister: {
    ...parents("paternalGrandfather", "paternalGrandmother"),
    son: "cousinMale",
    daughter: "cousinFemale",
    husband: "auntHusband",
  },
  motherBrother: {
    ...parents("maternalGrandfather", "maternalGrandmother"),
    son: "cousinMale",
    daughter: "cousinFemale",
    wife: "uncleWife",
  },
  motherSister: {
    ...parents("maternalGrandfather", "maternalGrandmother"),
    son: "cousinMale",
    daughter: "cousinFemale",
    husband: "auntHusband",
  },
  uncleWife: {},
  auntHusband: {},
  fatherInLaw: { wife: "motherInLaw" },
  motherInLaw: { husband: "fatherInLaw" },
  olderBrother: {
    ...parents("father", "mother"),
    olderBrother: "olderBrother",
    olderSister: "olderSister",
    wife: "olderBrotherWife",
    son: "siblingChild",
    daughter: "siblingChild",
  },
  youngerBrother: {
    ...parents("father", "mother"),
    youngerBrother: "youngerBrother",
    youngerSister: "youngerSister",
    son: "siblingChild",
    daughter: "siblingChild",
  },
  olderSister: {
    ...parents("father", "mother"),
    olderBrother: "olderBrother",
    olderSister: "olderSister",
    husband: "olderSisterHusband",
    son: "siblingChild",
    daughter: "siblingChild",
  },
  youngerSister: {
    ...parents("father", "mother"),
    youngerBrother: "youngerBrother",
    youngerSister: "youngerSister",
    son: "siblingChild",
    daughter: "siblingChild",
  },
  olderBrotherWife: { husband: "olderBrother" },
  olderSisterHusband: { wife: "olderSister" },
  cousinMale: {},
  cousinFemale: {},
  husband: {
    ...parents("fatherInLaw", "motherInLaw"),
    son: "son",
    daughter: "daughter",
    wife: "self",
  },
  wife: {
    ...parents("fatherInLaw", "motherInLaw"),
    son: "son",
    daughter: "daughter",
    husband: "self",
  },
  son: {
    ...sib("son"),
    son: "grandson",
    daughter: "granddaughter",
    wife: "daughterInLaw",
  },
  daughter: {
    ...sib("daughter"),
    son: "grandson",
    daughter: "granddaughter",
    husband: "sonInLaw",
  },
  siblingChild: {},
  daughterInLaw: { husband: "son" },
  sonInLaw: { wife: "daughter" },
  grandson: {},
  granddaughter: {},
};
// A son's brothers are also my sons, but a son's sisters are daughters.
table.son.olderSister = table.son.youngerSister = "daughter";
table.daughter.olderBrother = table.daughter.youngerBrother = "son";

/** One step from a relative (or from me). `null` when Uyghur has no single clear term. */
export function stepFrom(from: From, step: KinStep): From | null {
  return table[from][step] ?? null;
}

/** Resolves a whole path from me, e.g. [father, olderSister] → fatherSister. */
export function resolvePath(steps: readonly KinStep[]): From | null {
  let at: From | null = "self";
  for (const s of steps) {
    if (!at) return null;
    at = stepFrom(at, s);
  }
  return at;
}

/** Generation change for a path even when there is no single term. */
export function pathGeneration(steps: readonly KinStep[]): number {
  return steps.reduce((g, s) => g + stepWords[s].gen, 0);
}

export const generationNames: Record<number, string> = {
  2: "بوۋا-مومىلار",
  1: "ئاتا-ئانا، تاغا-ھاممىلار",
  0: "مەن، قېرىنداشلار",
  [-1]: "بالىلار",
  [-2]: "نەۋرىلەر",
};
export function generationName(gen: number): string {
  if (gen > 2) return "ئەجدادلار";
  if (gen < -2) return "چەۋرىلەر ۋە ئەۋلادلار";
  return generationNames[gen];
}

/* ---------- A family tree built from these terms ---------- */

export const familyStickers = [
  "sunflower",
  "owl",
  "bunny",
  "bee",
  "teacup",
  "cat-loaf",
  "fox",
  "puppy",
  "turtle",
  "frog",
  "potted-plant",
  "rainbow",
  "moon-sleepy",
  "sun-shades",
] as const;

export const familyLimits = {
  people: 60,
  name: 40,
  memory: 240,
  minYear: 1850,
  maxYear: 2100,
} as const;

export type FamilyRelation =
  | DirectRelation
  | ViaRelation;

export type DirectRelation = { to: "me"; key: KinKey };
export type ViaRelation = { to: string; step: KinStep };
export const isDirect = (rel: FamilyRelation): rel is DirectRelation => "key" in rel;

export type FamilyPerson = {
  id: string;
  name: string;
  rel: FamilyRelation;
  birthYear: number | null;
  memory: string;
  sticker: string;
  created: number;
};

export type FamilyState = { me: string; people: FamilyPerson[] };
export const emptyFamily: FamilyState = { me: "", people: [] };

const isRecordLike = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

function validRelation(v: unknown): v is FamilyRelation {
  if (!isRecordLike(v) || typeof v.to !== "string") return false;
  if (v.to === "me") return isKinKey(v.key) && !("step" in v);
  return v.to.length > 0 && v.to.length <= 80 && isKinStep(v.step) && !("key" in v);
}

export function validPerson(v: unknown): v is FamilyPerson {
  return (
    isRecordLike(v) &&
    typeof v.id === "string" &&
    v.id.length > 0 &&
    v.id.length <= 80 &&
    v.id !== "me" &&
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    v.name.length <= familyLimits.name &&
    validRelation(v.rel) &&
    (v.birthYear === null ||
      (Number.isInteger(v.birthYear) &&
        (v.birthYear as number) >= familyLimits.minYear &&
        (v.birthYear as number) <= familyLimits.maxYear)) &&
    typeof v.memory === "string" &&
    v.memory.length <= familyLimits.memory &&
    (v.sticker === "" ||
      (familyStickers as readonly string[]).includes(String(v.sticker))) &&
    typeof v.created === "number" &&
    Number.isFinite(v.created) &&
    v.created >= 0
  );
}

/** Whether following `id`'s links ever reaches `target` (or loops). */
export function linksTo(people: readonly FamilyPerson[], id: string, target: string): boolean {
  const byId = new Map(people.map((p) => [p.id, p]));
  let at = byId.get(id);
  for (let i = 0; at && i <= people.length; i++) {
    if (isDirect(at.rel)) return false;
    if (at.rel.to === target) return true;
    at = byId.get(at.rel.to);
  }
  return !!at; // ran out of steps: a loop
}

export function validFamily(v: unknown): v is FamilyState {
  if (
    !isRecordLike(v) ||
    typeof v.me !== "string" ||
    v.me.length > familyLimits.name ||
    !Array.isArray(v.people) ||
    v.people.length > familyLimits.people ||
    !v.people.every(validPerson)
  )
    return false;
  const people = v.people as FamilyPerson[];
  const ids = new Set(people.map((p) => p.id));
  if (ids.size !== people.length) return false;
  return people.every(
    (p) =>
      isDirect(p.rel) ||
      (p.rel.to !== p.id && ids.has(p.rel.to) && !linksTo(people, p.id, p.id)),
  );
}

export type Placement = {
  /** Resolved key ("self" = it is me), or null when there is no single term. */
  key: KinKey | "self" | null;
  gen: number;
  /** «دادامنىڭ ئاچىسى» or «ئايگۈلنىڭ قىزى». */
  desc: string;
  /** Person id (or "me") the card is drawn connected to. */
  anchor: string;
};

const anchorKeys: Partial<Record<KinKey, KinKey[]>> = {
  paternalGrandfather: ["father"],
  paternalGrandmother: ["father"],
  maternalGrandfather: ["mother"],
  maternalGrandmother: ["mother"],
  fatherBrother: ["paternalGrandfather", "paternalGrandmother", "father"],
  fatherSister: ["paternalGrandfather", "paternalGrandmother", "father"],
  motherBrother: ["maternalGrandfather", "maternalGrandmother", "mother"],
  motherSister: ["maternalGrandfather", "maternalGrandmother", "mother"],
  uncleWife: ["fatherBrother", "motherBrother"],
  auntHusband: ["fatherSister", "motherSister"],
  fatherInLaw: ["husband", "wife"],
  motherInLaw: ["husband", "wife"],
  olderBrother: ["father", "mother"],
  youngerBrother: ["father", "mother"],
  olderSister: ["father", "mother"],
  youngerSister: ["father", "mother"],
  olderBrotherWife: ["olderBrother"],
  olderSisterHusband: ["olderSister"],
  cousinMale: ["fatherBrother", "fatherSister", "motherBrother", "motherSister"],
  cousinFemale: ["fatherBrother", "fatherSister", "motherBrother", "motherSister"],
  siblingChild: ["olderBrother", "youngerBrother", "olderSister", "youngerSister"],
  daughterInLaw: ["son"],
  sonInLaw: ["daughter"],
  grandson: ["son", "daughter"],
  granddaughter: ["son", "daughter"],
};

/** Works out every person's term, generation and connecting card. */
export function placeFamily(state: FamilyState): Map<string, Placement> {
  const byId = new Map(state.people.map((p) => [p.id, p]));
  const out = new Map<string, Placement>();
  const direct = (key: KinKey) =>
    state.people.find((p) => isDirect(p.rel) && p.rel.key === key);
  const visit = (id: string, depth: number): Placement => {
    const known = out.get(id);
    if (known) return known;
    const p = byId.get(id);
    let result: Placement;
    if (!p || depth > state.people.length) {
      result = { key: null, gen: 0, desc: "", anchor: "me" };
    } else if (isDirect(p.rel)) {
      const t = kinTerm(p.rel.key);
      const anchor =
        (anchorKeys[p.rel.key] ?? [])
          .map(direct)
          .find((x) => x && x.id !== p.id)?.id ?? "me";
      result = { key: p.rel.key, gen: t.gen, desc: t.path, anchor };
    } else {
      const of = visit(p.rel.to, depth + 1);
      const key = of.key ? stepFrom(of.key, p.rel.step) : null;
      const gen =
        key === "self" ? 0 : key ? kinTerm(key).gen : of.gen + stepWords[p.rel.step].gen;
      result = {
        key,
        gen,
        desc: describeVia(byId.get(p.rel.to)?.name ?? "", p.rel.step),
        anchor: p.rel.to,
      };
    }
    out.set(id, result);
    return result;
  };
  for (const p of state.people) visit(p.id, 0);
  return out;
}

/** Saves or replaces a person. Returns null when the tree is full. */
export function upsertPerson(state: FamilyState, person: FamilyPerson): FamilyState | null {
  const i = state.people.findIndex((p) => p.id === person.id);
  if (i < 0 && state.people.length >= familyLimits.people) return null;
  const people = [...state.people];
  if (i < 0) people.push(person);
  else people[i] = person;
  return { ...state, people };
}

/**
 * Removes a person. People linked through them are re-linked straight to me
 * when their term is known; if some cannot be, nothing is removed and their
 * names are returned instead.
 */
export function removePerson(
  state: FamilyState,
  id: string,
): { state: FamilyState } | { blocked: string[] } {
  const places = placeFamily(state);
  const dependants = state.people.filter((p) => p.rel.to === id);
  const blocked = dependants.filter((p) => {
    const k = places.get(p.id)?.key;
    return !k || k === "self";
  });
  if (blocked.length) return { blocked: blocked.map((p) => p.name) };
  return {
    state: {
      ...state,
      people: state.people
        .filter((p) => p.id !== id)
        .map((p) =>
          p.rel.to === id
            ? { ...p, rel: { to: "me", key: places.get(p.id)!.key as KinKey } }
            : p,
        ),
    },
  };
}

/** Reads a typed year, accepting Arabic-Indic digits but returning a Western number. */
export function parseYear(text: string): number | null | undefined {
  const t = text
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));
  if (!t) return null;
  if (!/^[0-9]{4}$/.test(t)) return undefined;
  const y = Number(t);
  return y >= familyLimits.minYear && y <= familyLimits.maxYear ? y : undefined;
}
