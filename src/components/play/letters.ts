export type LetterJoin = "dual" | "right";
export type LetterForm = "isolated" | "initial" | "medial" | "final";
export type UyghurLetter = {
  /** The letter as written alone at the start of a word (with ئ for vowels). */
  letter: string;
  /** The traditional alphabet name, e.g. "بې". */
  name: string;
  /** Latin (ULY) transcription, for developers and screen-reader hints. */
  latin: string;
  /** The bare base character whose positional forms are shown. */
  base: string;
  /** "right" letters never connect to the following letter. */
  join: LetterJoin;
  word: string;
  /** English gloss of the sample word (developer/test reference). */
  meaning: string;
  icon: string;
};

const ZWJ = "‍";

export const letters: UyghurLetter[] = [
  { letter: "ئا", name: "ئا", latin: "a", base: "ا", join: "right", word: "ئانا", meaning: "mother", icon: "👩" },
  { letter: "ئە", name: "ئە", latin: "e", base: "ە", join: "right", word: "ئەتىگەن", meaning: "morning", icon: "🌅" },
  { letter: "ب", name: "بې", latin: "b", base: "ب", join: "dual", word: "بېلىق", meaning: "fish", icon: "🐟" },
  { letter: "پ", name: "پې", latin: "p", base: "پ", join: "dual", word: "پاقا", meaning: "frog", icon: "🐸" },
  { letter: "ت", name: "تې", latin: "t", base: "ت", join: "dual", word: "تاغ", meaning: "mountain", icon: "⛰️" },
  { letter: "ج", name: "جې", latin: "j", base: "ج", join: "dual", word: "جۈجە", meaning: "chick", icon: "🐥" },
  { letter: "چ", name: "چې", latin: "ch", base: "چ", join: "dual", word: "چاي", meaning: "tea", icon: "🍵" },
  { letter: "خ", name: "خې", latin: "x", base: "خ", join: "dual", word: "خوراز", meaning: "rooster", icon: "🐓" },
  { letter: "د", name: "دې", latin: "d", base: "د", join: "right", word: "دەرەخ", meaning: "tree", icon: "🌳" },
  { letter: "ر", name: "رې", latin: "r", base: "ر", join: "right", word: "رەسىم", meaning: "picture", icon: "🖼️" },
  { letter: "ز", name: "زې", latin: "z", base: "ز", join: "right", word: "قوزا", meaning: "lamb", icon: "🐑" },
  { letter: "ژ", name: "ژې", latin: "zh", base: "ژ", join: "right", word: "ژورنال", meaning: "magazine", icon: "📰" },
  { letter: "س", name: "سې", latin: "s", base: "س", join: "dual", word: "سۇ", meaning: "water", icon: "💧" },
  { letter: "ش", name: "شې", latin: "sh", base: "ش", join: "dual", word: "شىر", meaning: "lion", icon: "🦁" },
  { letter: "غ", name: "غې", latin: "gh", base: "غ", join: "dual", word: "غاز", meaning: "goose", icon: "🪿" },
  { letter: "ف", name: "فې", latin: "f", base: "ف", join: "dual", word: "تېلېفون", meaning: "telephone", icon: "📞" },
  { letter: "ق", name: "قې", latin: "q", base: "ق", join: "dual", word: "قار", meaning: "snow", icon: "❄️" },
  { letter: "ك", name: "كې", latin: "k", base: "ك", join: "dual", word: "كىتاب", meaning: "book", icon: "📖" },
  { letter: "گ", name: "گې", latin: "g", base: "گ", join: "dual", word: "گۈل", meaning: "flower", icon: "🌸" },
  { letter: "ڭ", name: "ڭې", latin: "ng", base: "ڭ", join: "dual", word: "رەڭ", meaning: "colour", icon: "🎨" },
  { letter: "ل", name: "لې", latin: "l", base: "ل", join: "dual", word: "لىمون", meaning: "lemon", icon: "🍋" },
  { letter: "م", name: "مې", latin: "m", base: "م", join: "dual", word: "مۈشۈك", meaning: "cat", icon: "🐱" },
  { letter: "ن", name: "نې", latin: "n", base: "ن", join: "dual", word: "نان", meaning: "bread", icon: "🫓" },
  { letter: "ھ", name: "ھې", latin: "h", base: "ھ", join: "dual", word: "ھەسەل", meaning: "honey", icon: "🍯" },
  { letter: "ئو", name: "ئو", latin: "o", base: "و", join: "right", word: "ئوت", meaning: "fire", icon: "🔥" },
  { letter: "ئۇ", name: "ئۇ", latin: "u", base: "ۇ", join: "right", word: "ئۇي", meaning: "cow", icon: "🐄" },
  { letter: "ئۆ", name: "ئۆ", latin: "ö", base: "ۆ", join: "right", word: "ئۆي", meaning: "house", icon: "🏠" },
  { letter: "ئۈ", name: "ئۈ", latin: "ü", base: "ۈ", join: "right", word: "ئۈزۈم", meaning: "grapes", icon: "🍇" },
  { letter: "ۋ", name: "ۋې", latin: "w", base: "ۋ", join: "right", word: "ۋاقىت", meaning: "time", icon: "⏰" },
  { letter: "ئې", name: "ئې", latin: "ë", base: "ې", join: "dual", word: "ئېيىق", meaning: "bear", icon: "🐻" },
  { letter: "ئى", name: "ئى", latin: "i", base: "ى", join: "dual", word: "ئىت", meaning: "dog", icon: "🐶" },
  { letter: "ي", name: "يې", latin: "y", base: "ي", join: "dual", word: "يۇلتۇز", meaning: "star", icon: "⭐" },
];

export const formLabels: Record<LetterForm, string> = {
  isolated: "يالغۇز",
  initial: "باشتا",
  medial: "ئوتتۇرىدا",
  final: "ئاخىرىدا",
};

/** Valid positional forms, built with ZWJ so the shaping engine picks the right glyph. */
export function letterForms(
  l: Pick<UyghurLetter, "base" | "join">,
): { form: LetterForm; text: string }[] {
  const forms: { form: LetterForm; text: string }[] = [
    { form: "isolated", text: l.base },
  ];
  if (l.join === "dual")
    forms.push(
      { form: "initial", text: l.base + ZWJ },
      { form: "medial", text: ZWJ + l.base + ZWJ },
    );
  forms.push({ form: "final", text: ZWJ + l.base });
  return forms;
}
