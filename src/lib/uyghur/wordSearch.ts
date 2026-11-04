/**
 * Word-search puzzle generator for Uyghur Arabic script.
 * Pure and seeded, so a seed always produces the same puzzle.
 *
 * Grid coordinates: row 0 is the top, column 0 is the RIGHTMOST column
 * (the grid is laid out right-to-left), so a step of dc = +1 reads the way
 * Uyghur is read.
 */

const HAMZA = "ئ";
const VOWELS = new Set(["ا", "ە", "و", "ۇ", "ۆ", "ۈ", "ې", "ى"]);
const LETTER = /[؀-ۿ]/;

export type Cell = [row: number, col: number];
export type Direction = { dr: -1 | 0 | 1; dc: -1 | 0 | 1 };
export type Placement = {
  word: string;
  /** The word split into grid cells. */
  letters: string[];
  start: Cell;
  dir: Direction;
  cells: Cell[];
};
export type Puzzle = {
  size: number;
  seed: number;
  grid: string[][];
  placements: Placement[];
  /** Words that could not be fitted into the grid. */
  skipped: string[];
};
export type PuzzleOptions = { diagonal?: boolean; reversed?: boolean };

/** Splits a word into cells: every letter is one cell, ئ + vowel is one cell. */
export function splitCells(word: string): string[] {
  const chars = [...word.normalize("NFC")].filter((ch) => LETTER.test(ch) && ch !== "ـ");
  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === HAMZA && VOWELS.has(chars[i + 1] ?? "")) {
      out.push(HAMZA + chars[i + 1]);
      i++;
    } else out.push(chars[i]);
  }
  return out;
}

/** The word written without spaces or punctuation, as it appears in the grid. */
export const gridWord = (word: string) => splitCells(word).join("");

export function hashSeed(text: string) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: small, fast, deterministic. Returns floats in [0, 1). */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Filler letters, weighted towards common consonants and bare vowels. */
const FILL = [
  ..."بپتجچخدرزسشغفقكگڭلمنھۋي",
  ..."رنلمكتقسدي",
  ..."بتدرسقكلمنيغ",
  ..."اەوۇۆۈېى",
  ..."اەى",
  "ئا", "ئە", "ئو", "ئۇ", "ئۆ", "ئۈ", "ئې", "ئى",
];
export const fillLetters: readonly string[] = FILL;

export function directionsFor(options: PuzzleOptions = {}): Direction[] {
  const dirs: Direction[] = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
  ];
  if (options.diagonal ?? true) dirs.push({ dr: 1, dc: 1 }, { dr: -1, dc: 1 });
  if (options.reversed)
    for (const d of [...dirs]) dirs.push({ dr: -d.dr as Direction["dr"], dc: -d.dc as Direction["dc"] });
  return dirs;
}

export function makePuzzle(
  words: readonly string[],
  size: number,
  seed: number | string,
  options: PuzzleOptions = {},
): Puzzle {
  const numericSeed = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
  const random = seededRandom(numericSeed);
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array<string | null>(size).fill(null),
  );
  const dirs = directionsFor(options);
  const placements: Placement[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  const unique = words.filter((w) => {
    const g = gridWord(w);
    if (!g || seen.has(g)) return false;
    seen.add(g);
    return true;
  });
  // Longest first fits best; ties keep the caller's order.
  const order = unique
    .map((word, i) => ({ word, letters: splitCells(word), i }))
    .sort((a, b) => b.letters.length - a.letters.length || a.i - b.i);

  for (const { word, letters } of order) {
    const n = letters.length;
    let placed: Placement | null = null;
    if (n >= 2 && n <= size) {
      for (let attempt = 0; attempt < 300 && !placed; attempt++) {
        const dir = dirs[Math.floor(random() * dirs.length)];
        const r0 = Math.floor(random() * size);
        const c0 = Math.floor(random() * size);
        const r1 = r0 + dir.dr * (n - 1);
        const c1 = c0 + dir.dc * (n - 1);
        if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) continue;
        const cells: Cell[] = [];
        let ok = true;
        let overlaps = 0;
        for (let k = 0; k < n && ok; k++) {
          const r = r0 + dir.dr * k;
          const c = c0 + dir.dc * k;
          const v = grid[r][c];
          if (v !== null && v !== letters[k]) ok = false;
          if (v !== null) overlaps++;
          cells.push([r, c]);
        }
        // Never hide a word entirely inside another one.
        if (!ok || overlaps === n) continue;
        cells.forEach(([r, c], k) => (grid[r][c] = letters[k]));
        placed = { word, letters, start: [r0, c0], dir, cells };
      }
    }
    if (placed) placements.push(placed);
    else skipped.push(word);
  }

  const filled = grid.map((row) =>
    row.map((v) => v ?? FILL[Math.floor(random() * FILL.length)]),
  );
  // Report placements in the caller's word order.
  placements.sort((a, b) => unique.indexOf(a.word) - unique.indexOf(b.word));
  return { size, seed: numericSeed, grid: filled, placements, skipped };
}

/** Cells on the straight line from a to b, or null if a→b is not a straight line. */
export function lineCells(a: Cell, b: Cell): Cell[] | null {
  const dr = b[0] - a[0];
  const dc = b[1] - a[1];
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const n = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return Array.from({ length: n + 1 }, (_, k) => [a[0] + sr * k, a[1] + sc * k] as Cell);
}

/** Which word (if any) the selected cells spell, forwards or backwards. */
export function matchSelection(
  grid: string[][],
  cells: Cell[],
  words: readonly string[],
): string | null {
  if (cells.length < 2) return null;
  const forward = cells.map(([r, c]) => grid[r]?.[c] ?? "").join("");
  const backward = [...cells].reverse().map(([r, c]) => grid[r]?.[c] ?? "").join("");
  return words.find((w) => gridWord(w) === forward || gridWord(w) === backward) ?? null;
}
