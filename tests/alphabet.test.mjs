import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { letters } from "../src/components/play/letters.ts";
import {
  alphabetPages,
  alphabetLetters,
  validAlphabetProgress,
} from "../src/components/play/alphabetData.ts";

const arabicIndic = /[٠-٩۰-۹]/;
const stickerDir = new URL("../src/lib/ink/art/stickers/", import.meta.url);
const stickerSource = readdirSync(stickerDir)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => readFileSync(new URL(f, stickerDir), "utf8"))
  .join("\n");
const stickerExists = (name) =>
  new RegExp(`^\\s+(?:'${name}'|"${name}"|${name}):\\s*\\{`, "m").test(stickerSource);

test("the alphabet book has 32 pages in alphabet order", () => {
  assert.equal(alphabetPages.length, 32);
  assert.deepEqual(alphabetLetters, letters.map((l) => l.letter));
  assert.equal(new Set(alphabetLetters).size, 32);
});

test("every page has 2–3 example words containing its letter", () => {
  for (const page of alphabetPages) {
    assert.ok(page.words.length >= 2 && page.words.length <= 3, page.letter);
    assert.equal(new Set(page.words.map((w) => w.word)).size, page.words.length);
    for (const { word } of page.words) {
      assert.ok(word.includes(page.base), `${word} should contain ${page.base}`);
      assert.match(word, /^[ئ-ە]+$/u, `${word} is plain Uyghur letters`);
    }
    if (!page.note)
      for (const { word } of page.words)
        assert.ok(word.startsWith(page.letter), `${word} should start with ${page.letter}`);
    else assert.ok(page.words.some((w) => !w.word.startsWith(page.letter)));
  }
});

test("ڭ is never word-initial and is explained", () => {
  const ng = alphabetPages.find((p) => p.letter === "ڭ");
  assert.ok(ng.note);
  for (const { word } of ng.words) assert.ok(!word.startsWith("ڭ"));
});

test("stickers exist and texts use no Arabic-Indic digits", () => {
  for (const page of alphabetPages) {
    if (page.sticker) assert.ok(stickerExists(page.sticker), page.sticker);
    const text = [page.letter, page.name, page.note ?? "", ...page.words.map((w) => w.word)].join(" ");
    assert.doesNotMatch(text, arabicIndic);
  }
});

test("progress validator is strict", () => {
  assert.ok(validAlphabetProgress({ learned: [], page: 0 }));
  assert.ok(validAlphabetProgress({ learned: ["ب", "ئا"], page: 31 }));
  assert.ok(!validAlphabetProgress({ learned: ["ب", "ب"], page: 0 }));
  assert.ok(!validAlphabetProgress({ learned: ["x"], page: 0 }));
  assert.ok(!validAlphabetProgress({ learned: [], page: 32 }));
  assert.ok(!validAlphabetProgress({ learned: [], page: 1.5 }));
  assert.ok(!validAlphabetProgress({ learned: [], page: 0, extra: 1 }));
  assert.ok(!validAlphabetProgress(null));
  assert.ok(!validAlphabetProgress([]));
});
