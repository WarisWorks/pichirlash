import test from "node:test";
import assert from "node:assert/strict";
import {
  describePath,
  describeVia,
  emptyFamily,
  familyLimits,
  kinTerm,
  kinTerms,
  parseYear,
  pathGeneration,
  placeFamily,
  removePerson,
  resolvePath,
  upsertPerson,
  validFamily,
} from "../src/lib/uyghur/kinship.ts";
import {
  addDays,
  daysInMonth,
  diaryLimits,
  dropEntry,
  isLeapYear,
  isoWeekId,
  longDate,
  monthGrid,
  monthSummary,
  parseDay,
  promptFor,
  putEntry,
  validDiary,
  validEntry,
  weekdayIndex,
} from "../src/components/play/diaryModel.ts";
import {
  countWords,
  formatClock,
  onlyAdds,
  randomPrompt,
  sprintPrompts,
  validSavedSprints,
  validSprintDraft,
  wordsPerMinute,
} from "../src/components/play/sprintPrompts.ts";

const easternDigits = /[٠-٩۰-۹]/;

test("kinship paths resolve to the right Uyghur terms", () => {
  const term = (...steps) => {
    const k = resolvePath(steps);
    return k && k !== "self" ? kinTerm(k).term : k;
  };
  assert.equal(term("father"), "دادا");
  assert.equal(term("mother"), "ئاپا");
  assert.equal(term("father", "father"), "بوۋا");
  assert.equal(term("mother", "mother"), "موما");
  assert.equal(term("mother", "olderBrother"), "تاغا");
  assert.equal(term("mother", "youngerBrother"), "تاغا");
  assert.equal(term("father", "olderSister"), "ھامما");
  assert.equal(term("father", "youngerSister"), "ھامما");
  assert.equal(term("olderBrother"), "ئاكا");
  assert.equal(term("youngerBrother"), "ئۇكا");
  assert.equal(term("olderSister"), "ئاچا");
  assert.equal(term("youngerSister"), "سىڭىل");
  assert.equal(term("olderBrother", "wife"), "يەڭگە");
  assert.equal(term("olderSister", "husband"), "يەزنە");
  assert.equal(term("son", "son"), "نەۋرە");
  assert.equal(term("daughter", "daughter"), "نەۋرە");
  assert.equal(term("son", "wife"), "كېلىن");
  assert.equal(term("daughter", "husband"), "كۈيئوغۇل");
  assert.equal(term("wife", "mother"), "قېيىن ئانا");
  assert.equal(term("husband", "father"), "قېيىن ئاتا");
  assert.equal(resolvePath(["father", "olderBrother", "son"]), "cousinMale");
  assert.equal(resolvePath(["mother", "olderSister", "daughter"]), "cousinFemale");
  assert.equal(resolvePath(["father", "wife"]), "mother");
  assert.equal(resolvePath(["wife", "husband"]), "self");
  // No single term: age or identity unknown.
  assert.equal(resolvePath(["father", "son"]), null);
  assert.equal(resolvePath(["father", "father", "olderBrother"]), null);
  assert.equal(resolvePath(["olderBrother", "youngerSister"]), null);
  assert.equal(pathGeneration(["father", "father", "olderBrother"]), 2);
  assert.equal(pathGeneration(["son", "daughter"]), -2);
});

test("paths are described with correct possessive forms", () => {
  assert.equal(describePath(["father"]), "دادام");
  assert.equal(describePath(["father", "olderSister"]), "دادامنىڭ ئاچىسى");
  assert.equal(describePath(["mother", "youngerSister"]), "ئاپامنىڭ سىڭلىسى");
  assert.equal(
    describePath(["father", "olderBrother", "son"]),
    "دادامنىڭ ئاكىسىنىڭ ئوغلى",
  );
  assert.equal(describeVia("ئايگۈل", "daughter"), "ئايگۈلنىڭ قىزى");
  for (const t of kinTerms) {
    assert.ok(t.term && t.note && t.path, t.key);
    assert.doesNotMatch(t.term + t.note + t.path, easternDigits);
  }
  assert.equal(new Set(kinTerms.map((t) => t.key)).size, kinTerms.length);
});

const person = (id, rel, extra = {}) => ({
  id,
  name: id,
  rel,
  birthYear: null,
  memory: "",
  sticker: "",
  created: 1,
  ...extra,
});

test("family trees validate strictly and place people by generation", () => {
  const mom = person("mom", { to: "me", key: "mother" });
  const granny = person("granny", { to: "mom", step: "mother" });
  const uncle = person("uncle", { to: "mom", step: "olderBrother" });
  const cousin = person("cousin", { to: "uncle", step: "daughter" });
  const state = { me: "مەن", people: [mom, granny, uncle, cousin] };
  assert.ok(validFamily(state));
  assert.ok(validFamily(emptyFamily));
  const places = placeFamily(state);
  assert.equal(places.get("granny").key, "maternalGrandmother");
  assert.equal(places.get("granny").gen, 2);
  assert.equal(places.get("uncle").key, "motherBrother");
  assert.equal(places.get("cousin").key, "cousinFemale");
  assert.equal(places.get("cousin").gen, 0);
  assert.equal(places.get("cousin").anchor, "uncle");
  assert.equal(places.get("mom").anchor, "me");
  assert.equal(places.get("uncle").desc, "momنىڭ ئاكىسى");

  // Unknown terms still get a generation.
  const greatUncle = person("gu", { to: "granny", step: "olderBrother" });
  const p2 = placeFamily({ me: "", people: [...state.people, greatUncle] });
  assert.equal(p2.get("gu").key, null);
  assert.equal(p2.get("gu").gen, 2);

  // Strictness.
  assert.ok(!validFamily({ me: "", people: [person("a", { to: "missing", step: "son" })] }));
  assert.ok(!validFamily({ me: "", people: [person("a", { to: "a", step: "son" })] }));
  assert.ok(
    !validFamily({
      me: "",
      people: [person("a", { to: "b", step: "son" }), person("b", { to: "a", step: "son" })],
    }),
  );
  assert.ok(!validFamily({ me: "", people: [person("a", { to: "me", key: "pirate" })] }));
  assert.ok(!validFamily({ me: "", people: [person("a", { to: "me", key: "mother" }, { name: "  " })] }));
  assert.ok(!validFamily({ me: "", people: [person("a", { to: "me", key: "mother" }, { birthYear: 1700 })] }));
  assert.ok(!validFamily({ me: "", people: [person("a", { to: "me", key: "mother" }, { sticker: "rocket" })] }));
  assert.ok(!validFamily({ me: "", people: [mom, mom] }));
  assert.ok(
    !validFamily({
      me: "",
      people: Array.from({ length: familyLimits.people + 1 }, (_, i) =>
        person(`p${i}`, { to: "me", key: "son" }),
      ),
    }),
  );
});

test("removing a person re-links or refuses", () => {
  const mom = person("mom", { to: "me", key: "mother" });
  const granny = person("granny", { to: "mom", step: "mother" });
  const gu = person("gu", { to: "granny", step: "olderBrother" });
  const state = { me: "", people: [mom, granny, gu] };
  const blocked = removePerson(state, "granny");
  assert.deepEqual(blocked, { blocked: ["gu"] });
  const ok = removePerson(state, "mom");
  assert.ok("state" in ok);
  assert.deepEqual(ok.state.people.find((p) => p.id === "granny").rel, {
    to: "me",
    key: "maternalGrandmother",
  });
  assert.ok(validFamily(ok.state));
  const full = {
    me: "",
    people: Array.from({ length: familyLimits.people }, (_, i) => person(`p${i}`, { to: "me", key: "son" })),
  };
  assert.equal(upsertPerson(full, person("new", { to: "me", key: "son" })), null);
  assert.equal(upsertPerson(full, person("p1", { to: "me", key: "daughter" })).people.length, familyLimits.people);
});

test("birth years accept any digits but store Western numbers", () => {
  assert.equal(parseYear(""), null);
  assert.equal(parseYear(" 1956 "), 1956);
  assert.equal(parseYear("١٩٥٦"), 1956);
  assert.equal(parseYear("۱۹۸۰"), 1980);
  assert.equal(parseYear("56"), undefined);
  assert.equal(parseYear("1700"), undefined);
  assert.equal(parseYear("abcd"), undefined);
});

test("month grids start on Monday with the right number of days", () => {
  assert.ok(isLeapYear(2024) && isLeapYear(2000));
  assert.ok(!isLeapYear(1900) && !isLeapYear(2026));
  assert.equal(daysInMonth(2024, 1), 29);
  assert.equal(daysInMonth(2026, 1), 28);
  assert.equal(daysInMonth(2000, 1), 29);
  assert.equal(daysInMonth(1900, 1), 28);
  assert.equal(daysInMonth(2026, 10), 30);
  assert.equal(daysInMonth(2026, 11), 31);

  // November 2026 starts on a Sunday → six empty cells first.
  const nov = monthGrid(2026, 10);
  assert.deepEqual(nov[0], [null, null, null, null, null, null, "2026-11-01"]);
  assert.equal(nov[1][0], "2026-11-02"); // Monday
  assert.equal(nov.flat().filter(Boolean).length, 30);
  assert.ok(nov.every((w) => w.length === 7));
  assert.equal(nov.at(-1).filter(Boolean).at(-1), "2026-11-30");

  // February 2027 starts on Monday and fits in exactly 4 weeks.
  const feb27 = monthGrid(2027, 1);
  assert.equal(feb27.length, 4);
  assert.equal(feb27[0][0], "2027-02-01");
  const feb24 = monthGrid(2024, 1);
  assert.equal(feb24.flat().filter(Boolean).length, 29);
  assert.equal(feb24[0][3], "2024-02-01"); // Thursday

  assert.equal(weekdayIndex(2026, 10, 4), 2); // Wednesday
  assert.equal(longDate("2026-11-04"), "2026-يىلى 4-نويابىر، چارشەنبە");
  assert.doesNotMatch(longDate("2026-11-04"), easternDigits);
});

test("ISO week ids follow ISO 8601", () => {
  assert.equal(isoWeekId("2026-11-04"), "2026-W45");
  assert.equal(isoWeekId("2026-01-01"), "2026-W01"); // Thursday
  assert.equal(isoWeekId("2021-01-03"), "2020-W53"); // Sunday
  assert.equal(isoWeekId("2024-12-30"), "2025-W01"); // Monday
  assert.equal(isoWeekId("2027-01-01"), "2026-W53");
  assert.equal(isoWeekId("2026-11-02"), isoWeekId("2026-11-08"));
  assert.notEqual(isoWeekId("2026-11-08"), isoWeekId("2026-11-09"));
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("diary entries are validated strictly", () => {
  const entry = { day: "2026-11-04", mood: "good", tags: ["family", "school"], text: "ياخشى كۈن", updated: 1 };
  assert.ok(validEntry(entry));
  assert.ok(validDiary({ "2026-11-04": entry }));
  assert.ok(validDiary({}));
  assert.ok(!validDiary({ "2026-11-05": entry }));
  assert.ok(!validDiary([]));
  assert.ok(!validEntry({ ...entry, day: "2026-02-30" }));
  assert.ok(!validEntry({ ...entry, day: "2026-1-4" }));
  assert.ok(!validEntry({ ...entry, mood: "angry" }));
  assert.ok(!validEntry({ ...entry, tags: ["family", "family"] }));
  assert.ok(!validEntry({ ...entry, tags: ["space"] }));
  assert.ok(!validEntry({ ...entry, tags: ["family", "school", "friends", "reading", "weather"] }));
  assert.ok(!validEntry({ ...entry, text: "x".repeat(diaryLimits.text + 1) }));
  assert.ok(!validEntry({ ...entry, updated: Number.NaN }));
  assert.equal(parseDay("2024-02-29").d, 29);
  assert.equal(parseDay("2023-02-29"), null);

  let diary = putEntry({}, entry);
  diary = putEntry(diary, { ...entry, day: "2026-11-05", mood: "sad" });
  diary = putEntry(diary, { ...entry, day: "2026-10-05", mood: "sad" });
  const s = monthSummary(diary, 2026, 10);
  assert.equal(s.total, 2);
  assert.equal(s.counts.good, 1);
  assert.equal(s.counts.sad, 1);
  assert.equal(Object.keys(dropEntry(diary, "2026-11-05")).length, 2);
  assert.equal(promptFor("2026-11-04"), promptFor("2026-11-04"));
});

test("Uyghur words are counted by whitespace", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   \n "), 0);
  assert.equal(countWords("مەن بۈگۈن مەكتەپكە باردىم."), 4);
  assert.equal(countWords("بىر\nئىككى\tئۈچ  تۆت"), 4);
  assert.equal(countWords("ئاكا-ئۇكا ۋە ئاچا-سىڭىل"), 3);
  assert.equal(countWords("ياخشى — ناھايىتى ياخشى ، !"), 3);
  assert.equal(countWords("2026-يىلى 4 كىتاب"), 3);
  assert.equal(countWords("بىر ئىككى"), 2);
});

test("sprint helpers: clock, no-delete check, prompts and validation", () => {
  assert.equal(formatClock(0), "0:00");
  assert.equal(formatClock(65), "1:05");
  assert.equal(formatClock(900), "15:00");
  assert.equal(formatClock(-4), "0:00");
  assert.ok(onlyAdds("ab", "abc"));
  assert.ok(onlyAdds("ac", "abc"));
  assert.ok(onlyAdds("", "x"));
  assert.ok(!onlyAdds("abc", "ab"));
  assert.ok(!onlyAdds("abc", "axc"));
  assert.ok(!onlyAdds("abc", "xbcd"));
  assert.ok(sprintPrompts.length >= 20);
  assert.equal(new Set(sprintPrompts).size, sprintPrompts.length);
  for (const p of sprintPrompts) assert.doesNotMatch(p, easternDigits);
  assert.notEqual(randomPrompt(sprintPrompts[0], () => 0), sprintPrompts[0]);
  assert.equal(wordsPerMinute(100, 300), 20);
  assert.equal(wordsPerMinute(3, 2), 0);
  const draft = { prompt: "p", text: "", goal: 100, minutes: 10, elapsed: 0, noDelete: true, goalHit: false };
  assert.ok(validSprintDraft(null));
  assert.ok(validSprintDraft(draft));
  assert.ok(!validSprintDraft({ ...draft, minutes: 7 }));
  assert.ok(!validSprintDraft({ ...draft, elapsed: 10 * 60000 + 1 }));
  assert.ok(!validSprintDraft({ ...draft, goal: 5 }));
  const saved = { id: "s", day: "2026-11-04", prompt: "p", text: "t", words: 1, goal: 100, minutes: 5, seconds: 300, noDelete: false, created: 1 };
  assert.ok(validSavedSprints([saved]));
  assert.ok(!validSavedSprints([saved, saved]));
  assert.ok(!validSavedSprints(Array.from({ length: 51 }, (_, i) => ({ ...saved, id: `s${i}` }))));
  assert.ok(!validSavedSprints([{ ...saved, words: 1.5 }]));
});
