export type SpellingCategory = "e-i" | "o-u" | "oe-ue" | "hamza";
export type SpellingQuestion = {
  id: string;
  category: SpellingCategory;
  /** A clue that points to exactly one meaning. */
  clue: string;
  options: string[];
  answer: string;
  explain: string;
};

export const spellingCategories: { id: SpellingCategory; label: string }[] = [
  { id: "e-i", label: "ې ياكى ى" },
  { id: "oe-ue", label: "ۆ ياكى ۈ" },
  { id: "o-u", label: "و ياكى ۇ" },
  { id: "hamza", label: "ئ (ھەمزە)" },
];

export const spellingQuestions: SpellingQuestion[] = [
  // ې vs ى
  { id: "fish", category: "e-i", clue: "سۇدا ئۈزۈپ يۈرىدىغان جانىۋار", options: ["بېلىق", "بىلىق", "بېلېق"], answer: "بېلىق", explain: "بىرىنچى بوغۇمدا ې، ئىككىنچى بوغۇمدا ى يېزىلىدۇ: بې-لىق." },
  { id: "night", category: "e-i", clue: "كۈندۈزنىڭ ئەكسى، ئاي ۋە يۇلتۇزلار چىقىدىغان ۋاقىت", options: ["كېچە", "كىچە", "كېچې"], answer: "كېچە", explain: "«كېچە» سۆزىنىڭ بېشىدا ې، ئاخىرىدا ە بار." },
  { id: "green", category: "e-i", clue: "يوپۇرماق ۋە چىملىقنىڭ رەڭگى", options: ["يېشىل", "يىشىل", "يېشېل"], answer: "يېشىل", explain: "يې-شىل: ئالدىدا ې، كەينىدە ى." },
  { id: "fast", category: "e-i", clue: "ئاستىنىڭ ئەكسى: «ئۇ ... يۈگۈردى»", options: ["تېز", "تىز"], answer: "تېز", explain: "«تىز» — پۇتنىڭ بوغۇمى. ئالدىراپ مېڭىش «تېز» دەپ يېزىلىدۇ." },
  { id: "bear", category: "e-i", clue: "ئورماندا ياشايدىغان، ھەسەلنى ياخشى كۆرىدىغان چوڭ ھايۋان", options: ["ئېيىق", "ئىيىق", "ئېيېق"], answer: "ئېيىق", explain: "ئې-يىق: سۆز بېشىدا ئې، ئىككىنچى بوغۇمدا ى." },
  { id: "book", category: "e-i", clue: "بەتلىرى بار، ئوقۇيدىغان نەرسە", options: ["كىتاب", "كېتاب"], answer: "كىتاب", explain: "«كىتاب» دا ى يېزىلىدۇ، ې ئەمەس." },
  { id: "dog", category: "e-i", clue: "قاۋايدىغان، ئۆينى قوغدايدىغان ھايۋان", options: ["ئىت", "ئېت"], answer: "ئىت", explain: "«ئىت» قىسقا ى بىلەن يېزىلىدۇ." },
  { id: "fruit", category: "e-i", clue: "ئالما، ئۆرۈك، شاپتۇل — ھەممىسى ...", options: ["مېۋە", "مىۋە", "مېۋې"], answer: "مېۋە", explain: "«مېۋە»: بېشىدا ې، ئاخىرىدا ە." },
  { id: "tongue", category: "e-i", clue: "ئېغىزىمىزدىكى، سۆزلەشكە ياردەم بېرىدىغان ئەزا", options: ["تىل", "تېل"], answer: "تىل", explain: "«تىل» ى بىلەن يېزىلىدۇ." },
  { id: "sea", category: "e-i", clue: "سۈيى شور، ناھايىتى كەڭ ۋە چوڭقۇر سۇ", options: ["دېڭىز", "دىڭىز", "دېڭېز"], answer: "دېڭىز", explain: "دې-ڭىز: بىرىنچى بوغۇمدا ې." },
  { id: "door", category: "e-i", clue: "ئۆيگە كىرگەندە ئاچىدىغان نەرسە", options: ["ئىشىك", "ئېشىك"], answer: "ئىشىك", explain: "«ئىشىك» نىڭ ھەر ئىككى بوغۇمىدا ى بار." },
  { id: "village", category: "e-i", clue: "شەھەر ئەمەس، ئېتىز ۋە باغلار كۆپ جاي", options: ["يېزا", "يىزا"], answer: "يېزا", explain: "«يېزا» ې بىلەن يېزىلىدۇ." },
  // ۆ vs ۈ
  { id: "eye", category: "oe-ue", clue: "بىز ئۇنىڭ بىلەن كۆرىمىز", options: ["كۆز", "كۈز"], answer: "كۆز", explain: "«كۈز» — يىلنىڭ بىر پەسلى. كۆرىدىغان ئەزا «كۆز»." },
  { id: "autumn", category: "oe-ue", clue: "يازدىن كېيىن كېلىدىغان، يوپۇرماقلار سارغىيىدىغان پەسىل", options: ["كۈز", "كۆز"], answer: "كۈز", explain: "پەسىلنىڭ نامى ۈ بىلەن «كۈز» دەپ يېزىلىدۇ." },
  { id: "lake", category: "oe-ue", clue: "ئەتراپى قۇرۇقلۇق بىلەن ئورالغان چوڭ سۇ", options: ["كۆل", "كۈل"], answer: "كۆل", explain: "«كۈل» — كۈلمەك پېئىلىدىن. سۇ تولغان جاي «كۆل»." },
  { id: "flower", category: "oe-ue", clue: "باغچىدا ئېچىلىدىغان، خۇش پۇراقلىق ئۆسۈملۈك", options: ["گۈل", "گۆل"], answer: "گۈل", explain: "«گۈل» ۈ بىلەن يېزىلىدۇ." },
  { id: "house", category: "oe-ue", clue: "ئائىلىمىز بىلەن ياشايدىغان جاي", options: ["ئۆي", "ئۈي"], answer: "ئۆي", explain: "«ئۆي» ۆ بىلەن يېزىلىدۇ." },
  { id: "grape", category: "oe-ue", clue: "تۇرپاندا كۆپ ئۆستۈرۈلىدىغان شېرىن مېۋە", options: ["ئۈزۈم", "ئۆزۈم"], answer: "ئۈزۈم", explain: "«ئۆزۈم» — «مەن ئۆزۈم» دېگەن مەنىدە. مېۋە «ئۈزۈم»." },
  { id: "blue", category: "oe-ue", clue: "ئوچۇق ھاۋادا ئاسماننىڭ رەڭگى", options: ["كۆك", "كۈك"], answer: "كۆك", explain: "«كۆك» ۆ بىلەن يېزىلىدۇ." },
  { id: "milk", category: "oe-ue", clue: "كالىدىن سېغىلىدىغان ئاق ئىچىملىك", options: ["سۈت", "سۆت"], answer: "سۈت", explain: "«سۈت» ۈ بىلەن يېزىلىدۇ." },
  { id: "four", category: "oe-ue", clue: "ئۈچتىن كېيىنكى سان", options: ["تۆت", "تۈت"], answer: "تۆت", explain: "«تۆت» ۆ بىلەن يېزىلىدۇ." },
  { id: "hundred", category: "oe-ue", clue: "توقسان توققۇزدىن كېيىنكى سان", options: ["يۈز", "يۆز"], answer: "يۈز", explain: "«يۈز» ۈ بىلەن يېزىلىدۇ." },
  { id: "cat", category: "oe-ue", clue: "چاشقان تۇتىدىغان ئۆي ھايۋىنى", options: ["مۈشۈك", "مۆشۆك", "مۈشۆك"], answer: "مۈشۈك", explain: "«مۈشۈك» نىڭ ئىككى بوغۇمىدا ۈ بار." },
  // و vs ۇ
  { id: "fire", category: "o-u", clue: "قىشتا ئۆينى ئىسسىتىدىغان، يالقۇنلۇق نەرسە", options: ["ئوت", "ئۇت"], answer: "ئوت", explain: "«ئۇت» — ئۇتماق پېئىلىدىن. يالقۇن «ئوت»." },
  { id: "water", category: "o-u", clue: "ئۇسساپ قالغاندا ئىچىدىغان نەرسە", options: ["سۇ", "سو"], answer: "سۇ", explain: "«سۇ» ۇ بىلەن يېزىلىدۇ." },
  { id: "hand", category: "o-u", clue: "بەش بارمىقى بار ئەزا", options: ["قول", "قۇل"], answer: "قول", explain: "بارماقلىق ئەزا «قول» دەپ و بىلەن يېزىلىدۇ." },
  { id: "student", category: "o-u", clue: "مەكتەپتە دەرس ئاڭلايدىغان بالا", options: ["ئوقۇغۇچى", "ئۇقۇغۇچى", "ئوقوغوچى"], answer: "ئوقۇغۇچى", explain: "ئو-قۇ-غۇ-چى: پەقەت بىرىنچى بوغۇمدا و بار." },
  { id: "ball", category: "o-u", clue: "بالىلار ئويناشنى ياخشى كۆرىدىغان يۇمىلاق نەرسە", options: ["توپ", "تۇپ"], answer: "توپ", explain: "«توپ» و بىلەن يېزىلىدۇ." },
  { id: "bird", category: "o-u", clue: "قانىتى بىلەن ئۇچىدىغان جانىۋار", options: ["قۇش", "قوش"], answer: "قۇش", explain: "«قوش» — قوشماق پېئىلىدىن. ئۇچىدىغان جانىۋار «قۇش»." },
  { id: "road", category: "o-u", clue: "ماشىنىلار ماڭىدىغان جاي", options: ["يول", "يۇل"], answer: "يول", explain: "«يول» و بىلەن يېزىلىدۇ." },
  { id: "salt", category: "o-u", clue: "تاماققا شور تەم بېرىدىغان ئاق نەرسە", options: ["تۇز", "توز"], answer: "تۇز", explain: "«تۇز» ۇ بىلەن يېزىلىدۇ." },
  { id: "ten", category: "o-u", clue: "توققۇزدىن كېيىنكى سان", options: ["ئون", "ئۇن"], answer: "ئون", explain: "«ئۇن» — بۇغدايدىن تارتىلغان تالقان. سان «ئون»." },
  { id: "flour", category: "o-u", clue: "بۇغداي تارتىلىپ چىققان، نان ياقىدىغان ئاق تالقان", options: ["ئۇن", "ئون"], answer: "ئۇن", explain: "تالقان «ئۇن» دەپ ۇ بىلەن يېزىلىدۇ." },
  // ئ
  { id: "clock", category: "hamza", clue: "ۋاقىتنى كۆرسىتىدىغان نەرسە", options: ["سائەت", "ساەت", "ساعەت"], answer: "سائەت", explain: "ئىككى سوزۇق تاۋۇش يانمۇيان كەلسە، ئوتتۇرىغا ئ يېزىلىدۇ: سا-ئەت." },
  { id: "teacher", category: "hamza", clue: "مەكتەپتە دەرس ئۆتىدىغان كىشى", options: ["مۇئەللىم", "مۇەللىم"], answer: "مۇئەللىم", explain: "ۇ بىلەن ە نىڭ ئارىسىدا ئ بولىدۇ: مۇ-ئەل-لىم." },
  { id: "poet", category: "hamza", clue: "شېئىر يازىدىغان كىشى", options: ["شائىر", "شاىر", "شاير"], answer: "شائىر", explain: "ا بىلەن ى نىڭ ئارىسىدا ئ يېزىلىدۇ: شا-ئىر." },
  { id: "poem", category: "hamza", clue: "مىسرالىرى ۋە قاپىيىسى بار ئەسەر", options: ["شېئىر", "شېىر", "شىئېر"], answer: "شېئىر", explain: "شې-ئىر: ې بىلەن ى نىڭ ئارىسىدا ئ بار." },
  { id: "mother", category: "hamza", clue: "بىزنى تۇغۇپ ئۆستۈرگەن مېھرىبان كىشى", options: ["ئانا", "انا"], answer: "ئانا", explain: "سوزۇق تاۋۇش بىلەن باشلانغان سۆزنىڭ بېشىغا ئ يېزىلىدۇ." },
  { id: "family", category: "hamza", clue: "ئانا، دادا ۋە بالىلار بىرلىكتە", options: ["ئائىلە", "ئاىلە", "ائىلە"], answer: "ئائىلە", explain: "سۆز بېشىدا ۋە ئىككى سوزۇق ئارىسىدا ئ بار: ئا-ئى-لە." },
  { id: "nature", category: "hamza", clue: "تاغ، ئورمان، دەريا ۋە ھايۋانلار دۇنياسى", options: ["تەبىئەت", "تەبىەت"], answer: "تەبىئەت", explain: "ى بىلەن ە نىڭ ئارىسىدا ئ يېزىلىدۇ: تە-بى-ئەت." },
  { id: "always", category: "hamza", clue: "ھەمىشە، ھەر ۋاقىت", options: ["دائىم", "داىم"], answer: "دائىم", explain: "ا بىلەن ى نىڭ ئارىسىدا ئ يېزىلىدۇ: دا-ئىم." },
  { id: "apple", category: "hamza", clue: "قىزىل ياكى يېشىل، يۇمىلاق مېۋە", options: ["ئالما", "الما"], answer: "ئالما", explain: "سۆز ا تاۋۇشى بىلەن باشلانسا، ئالدىغا ئ قوشۇلىدۇ: ئالما." },
  { id: "rule", category: "hamza", clue: "ئويۇندا ھەممە ئادەم ئەمەل قىلىدىغان بەلگىلىمە", options: ["قائىدە", "قاىدە"], answer: "قائىدە", explain: "ا بىلەن ى نىڭ ئارىسىدا ئ يېزىلىدۇ: قا-ئى-دە." },
];

export const ROUND_SIZE = 8;

/** Pick up to `size` distinct random questions, optionally from one category. */
export function pickRound(
  category: SpellingCategory | "all",
  size = ROUND_SIZE,
  random: () => number = Math.random,
): SpellingQuestion[] {
  const pool = spellingQuestions.filter(
    (q) => category === "all" || q.category === category,
  );
  return shuffled(pool, random).slice(0, size);
}

export function shuffled<T>(items: T[], random: () => number = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
