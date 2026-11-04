import test from "node:test";
import assert from "node:assert/strict";
import {
  convertScript,
  latinToArabic,
  countSyllables,
  rhymeKey,
} from "../src/lib/uyghur/script.ts";
import { analyzeWord } from "../src/lib/uyghur/morphology.ts";
import { dictionary } from "../src/lib/uyghur/dictionary.ts";
import { proverbs, proverbForDay } from "../src/lib/uyghur/proverbs.ts";
import {
  encodeShare,
  decodeShare,
  readShareHash,
  shareUrl,
  MAX_SHARE_CHARS,
} from "../src/lib/uyghur/share.ts";
import {
  addReadingDay,
  currentStreak,
  longestStreak,
  treeStage,
} from "../src/lib/uyghur/streak.ts";

test("Arabic script converts to Latin with digraphs, hamza and n'g", () => {
  assert.equal(convertScript("ئۇيغۇر تىلى", "uly"), "Uyghur tili");
  assert.equal(convertScript("سائەت مۇئەللىم", "uly"), "Sa'et mu'ellim");
  assert.equal(convertScript("مەنگۈ", "uly"), "Men'gü");
  assert.equal(convertScript("مىڭ", "uly"), "Ming");
  assert.equal(convertScript("يېڭى يول، ياخشى كۈن؟", "uly"), "Yéngi yol, yaxshi kün?");
});

test("Arabic script converts to Cyrillic with я/ю", () => {
  assert.equal(convertScript("ئۇيغۇر تىلى", "usy"), "Уйғур тили");
  assert.equal(convertScript("ياخشى", "usy"), "Яхши");
  assert.equal(convertScript("كۆڭۈل", "usy"), "Көңүл");
});

test("digits and non-Uyghur text pass through unchanged", () => {
  assert.equal(convertScript("2026-يىلى", "uly"), "2026-yili");
  assert.equal(convertScript("abc 123", "usy"), "abc 123");
  assert.equal(convertScript("ئانا", "uey"), "ئانا");
});

test("Latin input becomes Arabic script with initial and medial hamza", () => {
  assert.equal(latinToArabic("uyghur tili"), "ئۇيغۇر تىلى");
  assert.equal(latinToArabic("sa'et mu'ellim"), "سائەت مۇئەللىم");
  assert.equal(latinToArabic("Yaxshimusiz?"), "ياخشىمۇسىز؟");
  assert.equal(latinToArabic("men'gü"), "مەنگۈ");
  assert.equal(latinToArabic("ana öy, ëtiz"), "ئانا ئۆي، ئېتىز");
});

test("round trip Arabic → Latin → Arabic is stable for common words", () => {
  for (const word of ["كىتاب", "ئۆگىنىش", "سائەت", "مەنگۈ", "شېئىر", "ئائىلە"]) {
    assert.equal(latinToArabic(convertScript(word, "uly")), word);
  }
});

test("syllables count vowels and rhyme keys compare line endings", () => {
  assert.equal(countSyllables("بىر تال يوپۇرماق"), 5);
  assert.equal(rhymeKey("كۆڭلۈم ئىشىكىنى"), rhymeKey("گۈلنىڭ ھىدىنى."));
  assert.notEqual(rhymeKey("باھار"), rhymeKey("گۈل"));
});

test("word analysis finds roots through suffixes and sound changes", () => {
  const cases = {
    كىتابلىرىمىزدىن: "كىتاب",
    كۆڭلۈمگە: "كۆڭۈل",
    مېھرى: "مېھىر",
    بالىلار: "بالا",
    دوستۇمغا: "دوست",
    ئۆگىنىمەن: "ئۆگەن",
    يوپۇرماقلاردا: "يوپۇرماق",
  };
  for (const [word, root] of Object.entries(cases)) {
    const a = analyzeWord(word);
    assert.equal(a.root, root, word);
    assert.ok(a.known);
  }
  assert.deepEqual(
    analyzeWord("«كىتابلىرىمىزدىن،»").suffixes.map((s) => s.form),
    ["لىر", "ىمىز", "دىن"],
  );
});

test("dictionary and proverbs use Western digits only", () => {
  const text = JSON.stringify([dictionary, proverbs]);
  assert.doesNotMatch(text, /[٠-٩۰-۹]/);
});

test("proverb of the day is stable per day and ids are unique", () => {
  assert.equal(proverbForDay("2026-11-04").id, proverbForDay("2026-11-04").id);
  assert.equal(new Set(proverbs.map((p) => p.id)).size, proverbs.length);
});

test("share links round-trip Unicode content and reject tampering", () => {
  const poem = { kind: "poem", title: "باھار", text: "بىر تال يوپۇرماق\nبىر تامچە نۇر", color: "pink", art: "sunflower" };
  assert.deepEqual(decodeShare(encodeShare(poem)), poem);
  const url = shareUrl(poem, "https://example.org/app/");
  assert.deepEqual(readShareHash(new URL(url).hash), poem);
  assert.equal(decodeShare("not-valid"), null);
  assert.equal(readShareHash("#other"), null);
  assert.throws(() => encodeShare({ ...poem, text: "ا".repeat(MAX_SHARE_CHARS + 1) }));
});

test("reading streaks count consecutive local days", () => {
  let days = [];
  for (const d of ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-03"])
    days = addReadingDay(days, d);
  assert.deepEqual(days, ["2026-11-01", "2026-11-02", "2026-11-03"]);
  assert.equal(currentStreak(days, "2026-11-03"), 3);
  assert.equal(currentStreak(days, "2026-11-04"), 3, "yesterday keeps the streak");
  assert.equal(currentStreak(days, "2026-11-05"), 0);
  assert.equal(longestStreak(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-05"]), 3);
  assert.equal(treeStage(0), 0);
  assert.equal(treeStage(7), 2);
  assert.equal(treeStage(400), 5);
});
