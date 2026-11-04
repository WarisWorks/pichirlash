import { letters } from "./letters.ts";
import type { UyghurLetter } from "./letters.ts";

export type AlphabetWord = {
  word: string;
  /** English gloss (developer/test reference only, never shown). */
  meaning: string;
};
export type AlphabetPage = UyghurLetter & {
  words: AlphabetWord[];
  /** A sticker that pictures the first example word, when one fits. */
  sticker?: string;
  /** Shown when the example words do not all start with the letter. */
  note?: string;
};

type Extra = { words: [string, string][]; sticker?: string; note?: string };

/** Example words per letter (keys match `letters[].letter`), first word pictured. */
const extras: Record<string, Extra> = {
  "ئا": { sticker: "moon-sleepy", words: [["ئاي", "moon"], ["ئالما", "apple"], ["ئانا", "mother"]] },
  "ئە": { words: [["ئەينەك", "mirror"], ["ئەتىگەن", "morning"], ["ئەتىرگۈل", "rose"]] },
  "ب": { sticker: "cloud-smile", words: [["بۇلۇت", "cloud"], ["بېلىق", "fish"], ["بالا", "child"]] },
  "پ": { sticker: "frog", words: [["پاقا", "frog"], ["پىل", "elephant"], ["پۇل", "money"]] },
  "ت": { sticker: "fox", words: [["تۈلكە", "fox"], ["توشقان", "rabbit"], ["تاشپاقا", "turtle"]] },
  "ج": { words: [["جۈجە", "chick"], ["جەرەن", "gazelle"], ["جىگدە", "oleaster"]] },
  "چ": { sticker: "teacup", words: [["چاي", "tea"], ["چاشقان", "mouse"], ["چىراغ", "lamp"]] },
  "خ": { sticker: "envelope-heart", words: [["خەت", "letter"], ["خوراز", "rooster"], ["خىيار", "cucumber"]] },
  "د": { sticker: "notebook", words: [["دەپتەر", "notebook"], ["دەرەخ", "tree"], ["دېڭىز", "sea"]] },
  "ر": { sticker: "rocket", words: [["راكېتا", "rocket"], ["رەسىم", "picture"], ["رەڭ", "colour"]] },
  "ز": { words: [["زەيتۇن", "olive"], ["زەنجىر", "chain"], ["زاغرا", "corn bread"]] },
  "ژ": {
    words: [["ژۇرنال", "magazine"], ["ئاژدىھا", "dragon"]],
    note: "ژ ئاز ئۇچرايدىغان ھەرپ، كۆپىنچە باشقا تىللاردىن كىرگەن سۆزلەردە كېلىدۇ. «ئاژدىھا» دا ئۇ سۆزنىڭ ئوتتۇرىسىدا.",
  },
  "س": { sticker: "gift-wrapped", words: [["سوۋغات", "gift"], ["سائەت", "clock"], ["سۇ", "water"]] },
  "ش": { sticker: "balloon-bunch", words: [["شار", "balloon"], ["شىر", "lion"], ["شاپتۇل", "peach"]] },
  "غ": { words: [["غاز", "goose"], ["غۇنچە", "flower bud"], ["غار", "cave"]] },
  "ف": {
    words: [["فونار", "lantern"], ["فىلىم", "film"], ["تېلېفون", "telephone"]],
    note: "ف كۆپىنچە باشقا تىللاردىن كىرگەن سۆزلەردە كېلىدۇ. «تېلېفون» دا ئۇ سۆزنىڭ ئاخىرىدا.",
  },
  "ق": { sticker: "snowflake", words: [["قار", "snow"], ["قۇش", "bird"], ["قايچا", "scissors"]] },
  "ك": { sticker: "sunflower", words: [["كۈنگابوقار", "sunflower"], ["كىتاب", "book"], ["كالا", "cow"]] },
  "گ": { sticker: "cherries", words: [["گىلاس", "cherry"], ["گۈل", "flower"], ["گۆش", "meat"]] },
  "ڭ": {
    sticker: "rainbow",
    words: [["رەڭ", "colour"], ["دېڭىز", "sea"], ["مىڭ", "thousand"]],
    note: "ڭ ھەرگىز سۆز بېشىدا كەلمەيدۇ، شۇڭا بۇ سۆزلەردە ئۇ ئوتتۇرىدا ياكى ئاخىرىدا.",
  },
  "ل": { sticker: "lemon-slice", words: [["لىمون", "lemon"], ["لەگلەك", "kite"], ["لاچىن", "falcon"]] },
  "م": { sticker: "cat-loaf", words: [["مۈشۈك", "cat"], ["مەكتەپ", "school"], ["مېۋە", "fruit"]] },
  "ن": { words: [["نان", "bread"], ["نەشپۈت", "pear"], ["نەي", "flute"]] },
  "ھ": { sticker: "bee", words: [["ھەرە", "bee"], ["ھەسەل", "honey"], ["ھاۋا", "air"]] },
  "ئو": { words: [["ئوت", "fire"], ["ئورمان", "forest"], ["ئوقۇغۇچى", "student"]] },
  "ئۇ": { sticker: "sleepy", words: [["ئۇيقۇ", "sleep"], ["ئۇي", "cow"], ["ئۇن", "flour"]] },
  "ئۆ": { words: [["ئۆي", "house"], ["ئۆردەك", "duck"], ["ئۆرۈك", "apricot"]] },
  "ئۈ": { words: [["ئۈزۈم", "grapes"], ["ئۈستەل", "table"], ["ئۈنچە", "pearl"]] },
  "ۋ": { words: [["ۋاقىت", "time"], ["ۋەتەن", "homeland"]] },
  "ئې": { words: [["ئېيىق", "bear"], ["ئېشەك", "donkey"], ["ئېتىز", "field"]] },
  "ئى": { sticker: "puppy", words: [["ئىت", "dog"], ["ئىشىك", "door"], ["ئىلان", "snake"]] },
  "ي": { sticker: "raindrop-pal", words: [["يامغۇر", "rain"], ["يۇلتۇز", "star"], ["يول", "road"]] },
};

/** One picture-book page per letter, in alphabet order. */
export const alphabetPages: AlphabetPage[] = letters.map((l) => {
  const extra = extras[l.letter];
  return {
    ...l,
    words: extra.words.map(([word, meaning]) => ({ word, meaning })),
    sticker: extra.sticker,
    note: extra.note,
  };
});

export const alphabetLetters = alphabetPages.map((p) => p.letter);

export type AlphabetProgress = { learned: string[]; page: number };
export const emptyAlphabetProgress: AlphabetProgress = { learned: [], page: 0 };

/** Strict validator for the saved book progress. */
export function validAlphabetProgress(v: unknown): v is AlphabetProgress {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  return (
    Object.keys(r).length === 2 &&
    Array.isArray(r.learned) &&
    r.learned.every((x) => typeof x === "string" && alphabetLetters.includes(x)) &&
    new Set(r.learned).size === r.learned.length &&
    typeof r.page === "number" &&
    Number.isInteger(r.page) &&
    r.page >= 0 &&
    r.page < alphabetPages.length
  );
}
