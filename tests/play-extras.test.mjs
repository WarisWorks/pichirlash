import test from "node:test";
import assert from "node:assert/strict";
import { letters, letterForms } from "../src/components/play/letters.ts";
import {
  spellingQuestions,
  spellingCategories,
  pickRound,
  ROUND_SIZE,
} from "../src/components/play/spellingData.ts";
import {
  storyTemplates,
  blankTypeLabels,
  blankKeysInText,
} from "../src/components/play/fillStoryData.ts";

const arabicIndic = /[٠-٩۰-۹]/;
const latin = /[A-Za-z]/;
const nonJoining = new Set(["ا", "ە", "د", "ر", "ز", "ژ", "و", "ۇ", "ۆ", "ۈ", "ۋ"]);

test("the alphabet has 32 unique letters with valid positional forms", () => {
  assert.equal(letters.length, 32);
  assert.equal(new Set(letters.map((l) => l.letter)).size, 32);
  assert.equal(new Set(letters.map((l) => l.base)).size, 32);
  for (const l of letters) {
    assert.ok(l.name && l.word && l.meaning, l.letter);
    assert.equal(l.join === "right", nonJoining.has(l.base), l.letter);
    const forms = letterForms(l);
    assert.equal(forms.length, l.join === "right" ? 2 : 4, l.letter);
    assert.equal(forms[0].text, l.base);
    // vowels written with a hamza carrier at the start of a word
    if (/^[اەوۇۆۈېى]$/.test(l.base)) assert.equal(l.letter, "ئ" + l.base);
    else assert.equal(l.letter, l.base);
    assert.ok(l.word.includes(l.base), `${l.letter} in ${l.word}`);
    assert.ok(!arabicIndic.test(l.name + l.word));
  }
});

test("spelling questions are well formed", () => {
  assert.ok(spellingQuestions.length >= 32);
  const cats = new Set(spellingCategories.map((c) => c.id));
  assert.equal(new Set(spellingQuestions.map((q) => q.id)).size, spellingQuestions.length);
  for (const q of spellingQuestions) {
    assert.ok(cats.has(q.category), q.id);
    assert.ok(q.options.length >= 2 && q.options.length <= 3, q.id);
    assert.equal(new Set(q.options).size, q.options.length, q.id);
    assert.ok(q.options.includes(q.answer), q.id);
    assert.ok(!q.clue.includes(q.answer), `clue gives away ${q.id}`);
    for (const s of [q.clue, q.explain, ...q.options]) {
      assert.ok(!arabicIndic.test(s), q.id);
      assert.ok(!latin.test(s), q.id);
    }
  }
  for (const c of cats)
    assert.ok(
      spellingQuestions.filter((q) => q.category === c).length >= ROUND_SIZE,
      c,
    );
});

test("a round has distinct questions and respects the category filter", () => {
  const round = pickRound("all");
  assert.equal(round.length, ROUND_SIZE);
  assert.equal(new Set(round.map((q) => q.id)).size, ROUND_SIZE);
  assert.ok(pickRound("hamza").every((q) => q.category === "hamza"));
});

test("fill-story templates reference only declared blanks, followed by no suffix", () => {
  assert.ok(storyTemplates.length >= 4);
  assert.equal(new Set(storyTemplates.map((t) => t.id)).size, storyTemplates.length);
  for (const t of storyTemplates) {
    const keys = t.blanks.map((b) => b.key);
    assert.equal(new Set(keys).size, keys.length, t.id);
    assert.ok(keys.length >= 5 && keys.length <= 7, t.id);
    assert.deepEqual(new Set(blankKeysInText(t.text)), new Set(keys), t.id);
    assert.ok(!/\{[^}]*$|^[^{]*\}/.test(t.text));
    // a blank must be followed by a space, punctuation or the end of the text
    assert.ok(!/\}[^\s.،!؟:»»]/.test(t.text), t.id);
    for (const b of t.blanks) {
      assert.ok(blankTypeLabels[b.type], `${t.id}.${b.key}`);
      assert.equal(b.suggestions.length, 3);
      assert.equal(new Set(b.suggestions).size, 3);
      for (const s of [b.hint, ...b.suggestions]) {
        assert.ok(!latin.test(s), `${t.id}.${b.key}: ${s}`);
        assert.ok(!arabicIndic.test(s));
      }
    }
    assert.ok(!latin.test(t.text.replace(/\{[a-zA-Z]+\}/g, "")), t.id);
  }
});
