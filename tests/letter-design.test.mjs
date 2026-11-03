import test from "node:test";
import assert from "node:assert/strict";
import {
  paginateLetter,
  letterMailto,
  letterPlainText,
  validRecipientEmail,
  formatLetterDate,
  designOf,
  stationery,
  letterExamples,
} from "../src/components/play/letterDesign.ts";
import { validLetters } from "../src/components/play/model.ts";
const old = {
  id: "saved-before-templates",
  to: "قەدىرلىك دوستۇم",
  title: "بىر ئىللىق خەت",
  body: "بىرىنچى قۇر.\n\nئىككىنچى قۇر.",
  color: "yellow",
  stamp: "sunflower",
  sealed: true,
};
test("old saved letters survive the template upgrade and new metadata is validated", () => {
  assert.equal(validLetters([old]), true);
  assert.equal(designOf(undefined).id, "ivory");
  assert.equal(designOf("unrecognized").id, "ivory");
  for (const design of stationery)
    assert.equal(
      validLetters([
        {
          ...old,
          design: design.id,
          from: "ۋارىس",
          date: "2026-11-04",
          email: "",
        },
      ]),
      true,
    );
  assert.equal(validLetters([{ ...old, design: "unknown" }]), false);
  assert.equal(validLetters([{ ...old, from: 123 }]), false);
});
test("pagination preserves every Uyghur character, whitespace and paragraph break", () => {
  const text = "  ئۇيغۇرچە بىر ئىللىق خەت.\n\nيەنە بىر قۇر.  \n".repeat(12);
  const pages = paginateLetter(text, (candidate) => candidate.length <= 90, 20);
  assert.ok(pages.length > 1);
  assert.equal(pages.join(""), text);
  assert.ok(pages.every((page) => page.length <= 90));
});
test("long unbroken text is split without losing Unicode characters or combining marks", () => {
  const text = "ئۈمِيد".repeat(80);
  const pages = paginateLetter(text, (candidate) => candidate.length <= 75, 20);
  assert.equal(pages.join(""), text);
  assert.ok(pages.every((page) => page.length <= 75));
  assert.ok(pages.every((page) => !/^\p{M}/u.test(page)));
});
test("a page cap fails visibly rather than silently truncating a letter", () => {
  assert.throws(
    () => paginateLetter("a ".repeat(100), (text) => text.length <= 5, 3),
    /too-many-pages/,
  );
  assert.throws(() => paginateLetter("a", () => false), /page-too-small/);
  assert.deepEqual(
    paginateLetter("", () => true),
    [""],
  );
});
test("email drafts encode the exact content and never add unintended mail headers", () => {
  const letter = {
    ...old,
    title: "رەھمەت & سالام ?cc=not-a-recipient",
    from: "ۋارىس",
    date: "2026-11-04",
    email: "friend@example.com",
  };
  const link = letterMailto(letter),
    query = new URL(link).searchParams;
  assert.equal(
    decodeURIComponent(new URL(link).pathname),
    "friend@example.com",
  );
  assert.equal(query.get("subject"), letter.title);
  assert.equal(query.get("body"), letterPlainText(letter));
  assert.equal(query.has("cc"), false);
  assert.ok(query.get("body").includes(letter.from));
  assert.ok(query.get("body").includes("نويابىر"));
  assert.equal(letterMailto({ ...letter, email: "broken-address" }), null);
  assert.equal(letterMailto({ ...letter, body: "  " }), null);
  assert.ok(
    letterMailto({ ...letter, email: "" }).startsWith("mailto:?subject="),
  );
});
test("recipient validation rejects header separators while allowing an empty composer recipient", () => {
  for (const address of ["", "friend@example.com", "a+b@example.co.jp"])
    assert.equal(validRecipientEmail(address), true);
  for (const address of [
    "x@host",
    "a@b.com\ncc:c@d.com",
    "a@b.com,c@d.com",
    "a@b.com;c@d.com",
  ])
    assert.equal(validRecipientEmail(address), false);
});
test("dates are formatted without parsing the date through UTC", () => {
  assert.ok(formatLetterDate("2026-11-04").includes("نويابىر"));
  assert.equal(formatLetterDate("2026-02-30"), "");
  assert.equal(formatLetterDate(""), "");
  assert.equal(formatLetterDate("bad-date"), "");
});
test("all example letters are original, complete demo text and can be paginated", () => {
  assert.equal(letterExamples.length, 5);
  for (const example of letterExamples) {
    assert.ok(example.to && example.title && example.body);
    assert.equal(
      paginateLetter(example.body, (s) => s.length < 180, 10).join(""),
      example.body,
    );
  }
});
