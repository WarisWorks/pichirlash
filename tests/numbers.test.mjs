import test from "node:test";
import assert from "node:assert/strict";
import {
  numberToWords,
  ordinal,
  timeToWords,
  timeToDigits,
  wordsToNumber,
  numberDistractors,
  westernDigits,
  MAX_NUMBER,
} from "../src/lib/uyghur/numbers.ts";

const arabicIndic = /[٠-٩۰-۹]/;

test("basic numbers, tens and hundreds", () => {
  const cases = {
    0: "نۆل",
    1: "بىر",
    2: "ئىككى",
    3: "ئۈچ",
    4: "تۆت",
    5: "بەش",
    6: "ئالتە",
    7: "يەتتە",
    8: "سەككىز",
    9: "توققۇز",
    10: "ئون",
    11: "ئون بىر",
    15: "ئون بەش",
    20: "يىگىرمە",
    21: "يىگىرمە بىر",
    30: "ئوتتۇز",
    40: "قىرىق",
    50: "ئەللىك",
    60: "ئاتمىش",
    70: "يەتمىش",
    80: "سەكسەن",
    90: "توقسان",
    99: "توقسان توققۇز",
    100: "يۈز",
    101: "يۈز بىر",
    120: "يۈز يىگىرمە",
    200: "ئىككى يۈز",
    999: "توققۇز يۈز توقسان توققۇز",
  };
  for (const [n, words] of Object.entries(cases))
    assert.equal(numberToWords(Number(n)), words, `n=${n}`);
});

test("thousands, millions and milliards", () => {
  assert.equal(numberToWords(1000), "بىر مىڭ");
  assert.equal(numberToWords(1100), "بىر مىڭ يۈز");
  assert.equal(numberToWords(1234), "بىر مىڭ ئىككى يۈز ئوتتۇز تۆت");
  assert.equal(numberToWords(2026), "ئىككى مىڭ يىگىرمە ئالتە");
  assert.equal(numberToWords(10000), "ئون مىڭ");
  assert.equal(numberToWords(100000), "يۈز مىڭ");
  assert.equal(numberToWords(1_000_000), "بىر مىليون");
  assert.equal(numberToWords(1_000_001), "بىر مىليون بىر");
  assert.equal(numberToWords(25_300_000), "يىگىرمە بەش مىليون ئۈچ يۈز مىڭ");
  assert.equal(numberToWords(1_000_000_000), "بىر مىليارد");
  assert.equal(
    numberToWords(MAX_NUMBER),
    "توققۇز يۈز توقسان توققۇز مىليارد توققۇز يۈز توقسان توققۇز مىليون توققۇز يۈز توقسان توققۇز مىڭ توققۇز يۈز توقسان توققۇز",
  );
});

test("negative numbers and invalid input", () => {
  assert.equal(numberToWords(-5), "مىنۇس بەش");
  assert.equal(numberToWords(-1000), "مىنۇس بىر مىڭ");
  assert.throws(() => numberToWords(1.5), RangeError);
  assert.throws(() => numberToWords(MAX_NUMBER + 1), RangeError);
  assert.throws(() => numberToWords(Number.NaN), RangeError);
});

test("ordinals handle vowel-final words and ە/ا weakening", () => {
  const cases = {
    1: "بىرىنچى",
    2: "ئىككىنچى",
    3: "ئۈچىنچى",
    4: "تۆتىنچى",
    5: "بەشىنچى",
    6: "ئالتىنچى",
    7: "يەتتىنچى",
    8: "سەككىزىنچى",
    9: "توققۇزىنچى",
    10: "ئونىنچى",
    20: "يىگىرمىنچى",
    21: "يىگىرمە بىرىنچى",
    30: "ئوتتۇزىنچى",
    40: "قىرىقىنچى",
    50: "ئەللىكىنچى",
    60: "ئاتمىشىنچى",
    70: "يەتمىشىنچى",
    80: "سەكسىنىنچى",
    90: "توقسىنىنچى",
    100: "يۈزىنچى",
    1000: "بىر مىڭىنچى",
    1_000_000: "بىر مىليونىنچى",
  };
  for (const [n, words] of Object.entries(cases))
    assert.equal(ordinal(Number(n)), words, `n=${n}`);
});

test("telling the time", () => {
  assert.equal(timeToWords(3, 0), "سائەت ئۈچ");
  assert.equal(timeToWords(15, 0), "سائەت ئۈچ");
  assert.equal(timeToWords(0, 0), "سائەت ئون ئىككى");
  assert.equal(timeToWords(3, 30), "سائەت ئۈچ يېرىم");
  assert.equal(timeToWords(3, 10), "سائەت ئۈچتىن ئون مىنۇت ئۆتتى");
  assert.equal(timeToWords(6, 5), "سائەت ئالتىدىن بەش مىنۇت ئۆتتى");
  assert.equal(timeToWords(9, 40), "سائەت توققۇزدىن قىرىق مىنۇت ئۆتتى");
  assert.equal(timeToWords(3, 50), "سائەت تۆتكە ئون مىنۇت بار");
  assert.equal(timeToWords(8, 45), "سائەت توققۇزغا ئون بەش مىنۇت بار");
  assert.equal(timeToWords(12, 55), "سائەت بىرگە بەش مىنۇت بار");
  assert.equal(timeToWords(11, 59), "سائەت ئون ئىككىگە بىر مىنۇت بار");
  assert.equal(timeToDigits(15, 5), "3:05");
  assert.equal(timeToDigits(0, 0), "12:00");
  assert.throws(() => timeToWords(24, 0), RangeError);
  assert.throws(() => timeToWords(1, 60), RangeError);
  // every minute of the day has words with Western digits only
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m++) {
      const text = timeToWords(h, m);
      assert.ok(text.startsWith("سائەت "), text);
      assert.doesNotMatch(text + timeToDigits(h, m), arabicIndic);
    }
});

test("wordsToNumber parses generated forms and common variants", () => {
  assert.equal(wordsToNumber("نۆل"), 0);
  assert.equal(wordsToNumber("بىر مىڭ ئىككى يۈز ئوتتۇز تۆت"), 1234);
  assert.equal(wordsToNumber("بىر يۈز"), 100);
  assert.equal(wordsToNumber("مىڭ"), 1000);
  assert.equal(wordsToNumber("  مىنۇس  يىگىرمە "), -20);
  assert.equal(wordsToNumber("ئىككى مىليارد بەش"), 2_000_000_005);
  assert.equal(wordsToNumber(""), null);
  assert.equal(wordsToNumber("ئالما"), null);
  assert.equal(wordsToNumber("ئون ئون"), null);
  assert.equal(wordsToNumber("بىر ئىككى"), null);
  assert.equal(wordsToNumber("مىڭ مىليون"), null);
  assert.equal(wordsToNumber("بىر مىڭ بىر مىڭ"), null);
  assert.equal(wordsToNumber("مىنۇس نۆل"), null);
});

test("round trips 0..10000 and sampled large numbers", () => {
  for (let n = 0; n <= 10000; n++) {
    const words = numberToWords(n);
    assert.equal(wordsToNumber(words), n, words);
    assert.doesNotMatch(words, arabicIndic);
  }
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2000; i++) {
    const n = Math.floor(random() * MAX_NUMBER) * (i % 5 === 0 ? -1 : 1);
    assert.equal(wordsToNumber(numberToWords(n)), n);
  }
  assert.equal(wordsToNumber(numberToWords(MAX_NUMBER)), MAX_NUMBER);
});

test("distractors are distinct, in range and never the answer", () => {
  for (const [n, max] of [[0, 20], [20, 20], [7, 20], [55, 100], [1000, 1000], [123456, 1_000_000]]) {
    const d = numberDistractors(n, max);
    assert.equal(d.length, 3, `n=${n}`);
    assert.equal(new Set([n, ...d]).size, 4);
    for (const x of d) assert.ok(x >= 0 && x <= max && Number.isInteger(x));
  }
});

test("westernDigits converts Arabic-Indic and Persian digits", () => {
  assert.equal(westernDigits("١٢٣"), "123");
  assert.equal(westernDigits("۴۵۶"), "456");
  assert.equal(westernDigits("7٨9"), "789");
});
