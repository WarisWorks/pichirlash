import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_RECIPES,
  applyPreset,
  blankRecipe,
  hasRecipeText,
  numberSteps,
  presetWouldReplace,
  recipeAsText,
  recipeLimits,
  recipePresets,
  removeRecipe,
  sameRecipeText,
  splitLines,
  upsertRecipe,
  validRecipe,
  validRecipes,
} from "../src/components/play/recipeModel.ts";
import {
  audioExtension,
  formatDuration,
  pickMimeType,
  validVoiceNote,
} from "../src/components/play/voiceStore.ts";

const recipe = (id, extra = {}) => ({
  ...blankRecipe(id, 1),
  title: "لەغمەن",
  ingredients: "ئۇن",
  ...extra,
});

test("lines are trimmed, blank lines dropped and typed markers removed", () => {
  assert.deepEqual(splitLines("  ئۇن \n\n- سۇ\n• تۇز\r\n3. پىياز\n٢) گۆش"), [
    "ئۇن",
    "سۇ",
    "تۇز",
    "پىياز",
    "گۆش",
  ]);
  assert.deepEqual(splitLines("500 گرام ئۇن\n2-3 دانە پىياز"), [
    "500 گرام ئۇن",
    "2-3 دانە پىياز",
  ]);
  assert.deepEqual(splitLines("   \n  "), []);
});

test("steps are numbered with Western digits only", () => {
  const steps = numberSteps("خېمىر يۇغۇرۇڭ\n\n1. سوزۇڭ\nپىشۇرۇڭ");
  assert.deepEqual(
    steps.map((s) => s.n),
    ["1.", "2.", "3."],
  );
  assert.equal(steps[1].text, "سوزۇڭ");
  const text = recipeAsText({ ...recipe("a"), steps: "بىر\nئىككى" });
  assert.match(text, /1\. بىر/);
  assert.match(text, /2\. ئىككى/);
  assert.doesNotMatch(text, /[٠-٩]/);
});

test("recipe validation is strict", () => {
  assert.ok(validRecipe(recipe("a")));
  assert.ok(!validRecipe({ ...recipe("a"), color: "red" }));
  assert.ok(!validRecipe({ ...recipe("a"), art: "rocket" }));
  assert.ok(!validRecipe({ ...recipe("a"), id: "" }));
  assert.ok(!validRecipe({ ...recipe("a"), updated: Number.NaN }));
  assert.ok(
    !validRecipe({ ...recipe("a"), title: "x".repeat(recipeLimits.title + 1) }),
  );
  assert.ok(!validRecipe({ ...recipe("a"), memory: 4 }));
  assert.ok(!validRecipe(null));
  assert.ok(validRecipes([recipe("a"), recipe("b")]));
  assert.ok(!validRecipes([recipe("a"), recipe("a")]));
  assert.ok(
    !validRecipes(
      Array.from({ length: MAX_RECIPES + 1 }, (_, i) => recipe(`r${i}`)),
    ),
  );
});

test("saving replaces by id, puts newest first and refuses past the limit", () => {
  const one = upsertRecipe([], recipe("a"));
  const two = upsertRecipe(one, recipe("b"));
  assert.deepEqual(
    two.map((r) => r.id),
    ["b", "a"],
  );
  const edited = upsertRecipe(two, recipe("a", { title: "پولۇ" }));
  assert.deepEqual(
    edited.map((r) => r.id),
    ["a", "b"],
  );
  assert.equal(edited[0].title, "پولۇ");
  const full = Array.from({ length: MAX_RECIPES }, (_, i) => recipe(`r${i}`));
  assert.equal(upsertRecipe(full, recipe("new")), null);
  assert.equal(upsertRecipe(full, recipe("r3", { title: "x" }))?.length, MAX_RECIPES);
  assert.deepEqual(
    removeRecipe(two, "a").map((r) => r.id),
    ["b"],
  );
});

test("presets are valid editable starting points that ask before replacing", () => {
  assert.deepEqual(
    recipePresets.map((p) => p.label),
    ["لەغمەن", "پولۇ", "سامسا"],
  );
  const blank = blankRecipe("x");
  assert.ok(!hasRecipeText(blank));
  assert.ok(!presetWouldReplace(blank));
  assert.ok(presetWouldReplace({ ...blank, steps: "بىر" }));
  assert.ok(!presetWouldReplace({ ...blank, from: "مومام", memory: "ئەسلىمە" }));
  for (const preset of recipePresets) {
    const applied = applyPreset({ ...blank, from: "مومام", memory: "يازدا" }, preset);
    assert.ok(validRecipe(applied), preset.key);
    assert.equal(applied.from, "مومام");
    assert.equal(applied.memory, "يازدا");
    assert.equal(applied.id, "x");
    assert.ok(splitLines(applied.ingredients).length >= 4);
    assert.ok(numberSteps(applied.steps).length >= 4);
    assert.doesNotMatch(applied.ingredients + applied.steps, /[٠-٩]/);
  }
  assert.ok(sameRecipeText(recipe("a"), { ...recipe("a"), updated: 99 }));
  assert.ok(!sameRecipeText(recipe("a"), recipe("a", { color: "pink" })));
});

test("voice helpers format time with Western digits and pick a format", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(9.8), "0:09");
  assert.equal(formatDuration(75), "1:15");
  assert.equal(formatDuration(600), "10:00");
  assert.equal(formatDuration(-3), "0:00");
  assert.equal(formatDuration(Number.NaN), "0:00");
  assert.equal(
    pickMimeType((t) => t === "audio/mp4"),
    "audio/mp4",
  );
  assert.equal(pickMimeType(() => true), "audio/webm;codecs=opus");
  assert.equal(
    pickMimeType(() => {
      throw Error("nope");
    }),
    "",
  );
  assert.equal(audioExtension("audio/webm;codecs=opus"), "webm");
  assert.equal(audioExtension("audio/mp4"), "m4a");
  assert.equal(audioExtension("audio/ogg;codecs=opus"), "ogg");
  const note = {
    id: "n",
    title: "ھېكايە",
    speaker: "مومام",
    created: 1,
    duration: 3,
    type: "audio/webm",
  };
  assert.ok(validVoiceNote(note));
  assert.ok(validVoiceNote({ ...note, entryId: "e", entryTitle: "بەت" }));
  assert.ok(!validVoiceNote({ ...note, entryId: 4 }));
  assert.ok(!validVoiceNote({ ...note, duration: Number.POSITIVE_INFINITY }));
});
