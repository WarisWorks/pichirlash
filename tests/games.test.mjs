import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  directionsFor,
  fillLetters,
  gridWord,
  lineCells,
  makePuzzle,
  matchSelection,
  splitCells,
} from "../src/lib/uyghur/wordSearch.ts";
import {
  difficulties,
  fitsGrid,
  wordSearchCategories,
} from "../src/components/play/wordSearchData.ts";
import {
  PAIR_COUNTS,
  makeDeck,
  memoryModes,
  memoryPairs,
  memoryWords,
  pictureWords,
} from "../src/components/play/memoryData.ts";
import { dictionary } from "../src/lib/uyghur/dictionary.ts";

const arabicIndic = /[٠-٩۰-۹]/;
const stickerDir = new URL("../src/lib/ink/art/stickers/", import.meta.url);
const stickerSource = readdirSync(stickerDir)
  .filter((f) => f.endsWith(".ts") && f !== "index.ts")
  .map((f) => readFileSync(new URL(f, stickerDir), "utf8"))
  .join("\n");
const stickerExists = (name) =>
  new RegExp(`^\\s*(?:'${name}'|"${name}"|${name.replace(/-/g, "_")}):\\s*\\{`, "m").test(stickerSource);

test("ئ + vowel is one cell, other letters are one cell each", () => {
  assert.deepEqual(splitCells("ئانا"), ["ئا", "ن", "ا"]);
  assert.deepEqual(splitCells("شېئىر"), ["ش", "ې", "ئى", "ر"]);
  assert.deepEqual(splitCells("ئائىلە"), ["ئا", "ئى", "ل", "ە"]);
  assert.deepEqual(splitCells("ھەسەل ھەرىسى"), [..."ھەسەلھەرىسى"]);
  assert.equal(gridWord("ئوقۇغۇچى"), "ئوقۇغۇچى");
});

const levels = Object.entries(difficulties);
const seeds = [1, 42, 2026, 987654321, "pichirlash"];

test("puzzles are deterministic for a seed and differ between seeds", () => {
  const words = wordSearchCategories[0].words.slice(0, 7);
  const a = makePuzzle(words, 10, 1234, { reversed: true });
  const b = makePuzzle(words, 10, 1234, { reversed: true });
  assert.deepEqual(a, b);
  assert.deepEqual(makePuzzle(words, 10, "seed"), makePuzzle(words, 10, "seed"));
  assert.notDeepEqual(a.grid, makePuzzle(words, 10, 1235, { reversed: true }).grid);
});

test("every placement spells its word along its direction; grid is full", () => {
  for (const [id, level] of levels) {
    const allowed = directionsFor(level).map((d) => `${d.dr},${d.dc}`);
    for (const category of wordSearchCategories) {
      for (const seed of seeds) {
        const words = category.words.filter((w) => fitsGrid(w, level.size)).slice(0, level.count);
        const p = makePuzzle(words, level.size, seed, level);
        assert.equal(p.skipped.length, 0, `${id}/${category.id}/${seed} skipped ${p.skipped}`);
        assert.equal(p.placements.length, words.length);
        assert.equal(p.grid.length, level.size);
        const owner = new Map();
        for (const pl of p.placements) {
          assert.ok(allowed.includes(`${pl.dir.dr},${pl.dir.dc}`), `${id} direction`);
          assert.deepEqual(pl.letters, splitCells(pl.word));
          assert.equal(pl.cells.length, pl.letters.length);
          pl.cells.forEach(([r, c], k) => {
            assert.equal(r, pl.start[0] + pl.dir.dr * k);
            assert.equal(c, pl.start[1] + pl.dir.dc * k);
            assert.equal(p.grid[r][c], pl.letters[k], `${pl.word} at ${r},${c}`);
            const prev = owner.get(`${r},${c}`);
            if (prev !== undefined) assert.equal(prev, pl.letters[k], "overlap conflict");
            owner.set(`${r},${c}`, pl.letters[k]);
          });
          assert.equal(matchSelection(p.grid, pl.cells, words), pl.word);
          assert.equal(matchSelection(p.grid, [...pl.cells].reverse(), words), pl.word);
        }
        for (const row of p.grid) {
          assert.equal(row.length, level.size);
          for (const cell of row) {
            assert.ok(typeof cell === "string" && cell.length > 0 && splitCells(cell).length === 1, `cell ${cell}`);
          }
        }
      }
    }
  }
});

test("reversed words only appear on hard; easy has no diagonals", () => {
  assert.deepEqual(directionsFor(difficulties.easy).map((d) => `${d.dr},${d.dc}`), ["0,1", "1,0"]);
  assert.ok(directionsFor(difficulties.medium).every((d) => d.dc >= 0 && !(d.dc === 0 && d.dr < 0)));
  assert.equal(directionsFor(difficulties.hard).length, 8);
});

test("filler letters are single cells and lines are straight", () => {
  for (const l of fillLetters) assert.equal(splitCells(l).length, 1, l);
  assert.equal(lineCells([0, 0], [2, 3]), null);
  assert.deepEqual(lineCells([2, 2], [0, 0]), [[2, 2], [1, 1], [0, 0]]);
});

test("word-search categories use dictionary words and are big enough", () => {
  const ids = new Set();
  for (const c of wordSearchCategories) {
    assert.ok(!ids.has(c.id));
    ids.add(c.id);
    assert.ok(!arabicIndic.test(c.label));
    assert.equal(new Set(c.words).size, c.words.length, c.id);
    for (const w of c.words) assert.ok(dictionary[w], `${w} in dictionary`);
    for (const level of Object.values(difficulties))
      assert.ok(c.words.filter((w) => fitsGrid(w, level.size)).length >= level.count, c.id);
  }
});

test("memory picture stickers exist and pairs are unique", () => {
  assert.ok(stickerExists("bee") && stickerExists("cat-loaf"), "sticker lookup works");
  assert.ok(!stickerExists("not-a-sticker"));
  for (const p of pictureWords) assert.ok(stickerExists(p.sticker), `sticker ${p.sticker}`);
  assert.equal(new Set(pictureWords.map((p) => p.word)).size, pictureWords.length);
  assert.equal(new Set(pictureWords.map((p) => p.sticker)).size, pictureWords.length);
  for (const w of memoryWords) assert.ok(dictionary[w], `${w} in dictionary`);
  for (const { id } of memoryModes) {
    const pairs = memoryPairs(id);
    assert.ok(pairs.length >= Math.max(...PAIR_COUNTS), id);
    const faces = pairs.flatMap((p) => [JSON.stringify(p.a), JSON.stringify(p.b)]);
    assert.equal(new Set(faces).size, faces.length, `${id} faces unique`);
    assert.equal(new Set(pairs.map((p) => p.id)).size, pairs.length);
    for (const p of pairs) {
      for (const f of [p.a, p.b]) {
        const text = f.kind === "text" ? f.text : f.label;
        assert.ok(text && !arabicIndic.test(text), `${id} ${p.word}`);
      }
    }
  }
});

test("memory decks hold each pair twice and are deterministic", () => {
  for (const { id } of memoryModes) {
    for (const n of PAIR_COUNTS) {
      const deck = makeDeck(id, n, 77);
      assert.equal(deck.length, n * 2);
      assert.deepEqual(deck, makeDeck(id, n, 77));
      const counts = new Map();
      for (const c of deck) counts.set(c.pair, (counts.get(c.pair) ?? 0) + 1);
      assert.equal(counts.size, n);
      for (const v of counts.values()) assert.equal(v, 2);
      assert.equal(new Set(deck.map((c) => c.id)).size, deck.length);
    }
  }
});
