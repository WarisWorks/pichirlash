import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { Lightbulb, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { WORDS_KEY, validWords } from "@/components/features/wordStore";
import type { SavedWord } from "@/components/features/wordStore";
import {
  gridWord,
  lineCells,
  makePuzzle,
  matchSelection,
  seededRandom,
  seededShuffle,
} from "@/lib/uyghur/wordSearch";
import type { Cell } from "@/lib/uyghur/wordSearch";
import { isRecord } from "./model";
import { loadLocal, useLocal } from "./useLocal";
import { StorageNotice, useScript } from "./Experience";
import {
  SAVED_CATEGORY,
  SAVED_MIN,
  dictionaryWord,
  difficulties,
  fitsGrid,
  wordSearchCategories,
} from "./wordSearchData";
import type { WordSearchDifficulty, WordSearchWord } from "./wordSearchData";
import "./wordSearch.css";

type Best = Record<string, number>;
const validBest = (v: unknown): v is Best =>
  isRecord(v) &&
  Object.values(v).every((n) => typeof n === "number" && Number.isInteger(n) && n > 0 && n < 1e6);

const key = ([r, c]: Cell) => `${r}-${c}`;
const same = (a: Cell | null, b: Cell | null) => !!a && !!b && a[0] === b[0] && a[1] === b[1];
const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const clock = () => Date.now();
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

function savedPool(saved: SavedWord[], size: number): WordSearchWord[] {
  const seen = new Set<string>();
  const out: WordSearchWord[] = [];
  for (const s of saved) {
    const w = s.word.trim();
    const g = gridWord(w);
    if (!fitsGrid(w, size) || seen.has(g) || g !== w.replace(/[‌‍]/g, "")) continue;
    seen.add(g);
    out.push({ word: w, ug: s.ug, en: s.en });
  }
  return out;
}

export default function WordSearch({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const { script, t } = useScript();
  const { value: best, setValue: setBest, error } = useLocal<Best>(
    "pichirlash-wordsearch-v1",
    {},
    validBest,
  );
  const [saved] = useState(() => loadLocal<SavedWord[]>(WORDS_KEY, [], validWords));
  const [difficulty, setDifficulty] = useState<WordSearchDifficulty>("easy");
  const [category, setCategory] = useState("nature");
  const [seed, setSeed] = useState(newSeed);
  const [found, setFound] = useState<Record<string, Cell[]>>({});
  const [hints, setHints] = useState<Cell[]>([]);
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [cursor, setCursor] = useState<Cell>([0, 0]);
  const [message, setMessage] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [finished, setFinished] = useState<number | null>(null);
  const dragging = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  const level = difficulties[difficulty];
  const savedWords = useMemo(() => savedPool(saved, level.size), [saved, level.size]);
  const hasSaved = savedWords.length >= SAVED_MIN;
  const activeCategory = category === SAVED_CATEGORY && !hasSaved ? "nature" : category;
  const categoryLabel =
    activeCategory === SAVED_CATEGORY
      ? "ساقلانغان سۆزلىرىم"
      : (wordSearchCategories.find((c) => c.id === activeCategory)?.label ?? "");

  const { puzzle, glossary } = useMemo(() => {
    const pool: WordSearchWord[] =
      activeCategory === SAVED_CATEGORY
        ? savedWords
        : (wordSearchCategories.find((c) => c.id === activeCategory)?.words ?? [])
            .filter((w) => fitsGrid(w, level.size))
            .map(dictionaryWord);
    const chosen = seededShuffle(pool, seededRandom(seed ^ 0x9e3779b9)).slice(0, level.count);
    const p = makePuzzle(
      chosen.map((w) => w.word),
      level.size,
      seed,
      { diagonal: level.diagonal, reversed: level.reversed },
    );
    return { puzzle: p, glossary: new Map(chosen.map((w) => [w.word, w])) };
  }, [activeCategory, savedWords, level, seed]);

  const words = puzzle.placements.map((p) => p.word);
  const remaining = words.filter((w) => !found[w]);
  const done = finished !== null;
  const elapsed = done
    ? finished
    : startedAt === null
      ? 0
      : Math.max(0, Math.floor((now - startedAt) / 1000));
  const bestKey = `${difficulty}:${activeCategory}`;
  const bestTime = best[bestKey];

  useEffect(() => {
    if (startedAt === null || done) return;
    const id = window.setInterval(() => setNow(clock()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, done]);

  useEffect(() => {
    if (done) resultRef.current?.focus();
  }, [done]);

  const foundCells = new Set(Object.values(found).flatMap((cells) => cells.map(key)));
  const hintCells = new Set(hints.map(key));
  const preview = new Set(
    anchor ? (hover ? (lineCells(anchor, hover) ?? [anchor]) : [anchor]).map(key) : [],
  );

  const reset = (opts: { difficulty?: WordSearchDifficulty; category?: string } = {}) => {
    if (opts.difficulty) setDifficulty(opts.difficulty);
    if (opts.category) setCategory(opts.category);
    setSeed(newSeed());
    setFound({});
    setHints([]);
    setAnchor(null);
    setHover(null);
    setCursor([0, 0]);
    setStartedAt(null);
    setFinished(null);
    setMessage("يېڭى ئويۇن تەييار. سۆزلەرنى ئىزدەڭ.");
  };

  const begin = () => {
    if (startedAt === null) {
      const t0 = clock();
      setStartedAt(t0);
      setNow(t0);
    }
  };

  const describe = (cell: Cell) =>
    `«${puzzle.grid[cell[0]][cell[1]]}» (${cell[0] + 1}-قۇر، ${cell[1] + 1}-ئىستون)`;

  const finalize = (a: Cell, b: Cell) => {
    setAnchor(null);
    setHover(null);
    const cells = lineCells(a, b);
    if (!cells) {
      setMessage("سۆزلەر تۈز سىزىق بويىچە تىزىلغان: توغرىسىغا، تىكىسىگە ياكى قىيپاش.");
      return;
    }
    const word = matchSelection(puzzle.grid, cells, remaining);
    if (!word) {
      const already = matchSelection(puzzle.grid, cells, words);
      setMessage(already ? `«${already}» ئاللىقاچان تېپىلغان.` : "بۇ سۆز تىزىملىكتە يوق. يەنە سىناپ بېقىڭ.");
      return;
    }
    const next = { ...found, [word]: cells };
    setFound(next);
    const gloss = glossary.get(word)?.ug;
    if (Object.keys(next).length < words.length) {
      setMessage(`تېپىلدى: «${word}»${gloss ? ` — ${gloss}` : ""}. يەنە ${words.length - Object.keys(next).length} سۆز قالدى.`);
      return;
    }
    const seconds = Math.max(1, startedAt === null ? 1 : Math.round((clock() - startedAt) / 1000));
    setFinished(seconds);
    const record = !bestTime || seconds < bestTime;
    if (record) setBest((v) => ({ ...v, [bestKey]: seconds }));
    setMessage(
      `ھەممە سۆز تېپىلدى! ۋاقىت: ${formatTime(seconds)}${record ? "، يېڭى رېكورت!" : ""}`,
    );
    onReward(
      `wordsearch:${difficulty}:${activeCategory}`,
      `سۆز ئىزدەش — ${level.label}، ${categoryLabel}`,
    );
  };

  /** Tap / keyboard selection: first cell is the start, second the end. */
  const select = (cell: Cell) => {
    if (done) return;
    begin();
    setCursor(cell);
    if (!anchor) {
      setAnchor(cell);
      setHover(cell);
      setMessage(`باشلىنىش: ${describe(cell)}. ئەمدى ئاخىرقى ھەرپنى تاللاڭ.`);
    } else if (same(anchor, cell)) {
      setAnchor(null);
      setHover(null);
      setMessage("تاللاش بىكار قىلىندى.");
    } else finalize(anchor, cell);
  };

  const cellAt = (x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-cell]");
    if (!el || !gridRef.current?.contains(el)) return null;
    const [r, c] = (el.dataset.cell ?? "").split("-").map(Number);
    return Number.isInteger(r) && Number.isInteger(c) ? [r, c] : null;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (done || e.button !== 0) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    if (anchor && !dragging.current) {
      select(cell);
      return;
    }
    begin();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is optional */
    }
    dragging.current = true;
    setCursor(cell);
    setAnchor(cell);
    setHover(cell);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell && !same(cell, hover)) setHover(cell);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (anchor && hover && !same(anchor, hover)) finalize(anchor, hover);
    else if (anchor)
      setMessage(`باشلىنىش: ${describe(anchor)}. ئەمدى ئاخىرقى ھەرپنى تاللاڭ.`);
  };
  const onPointerCancel = () => {
    dragging.current = false;
    setAnchor(null);
    setHover(null);
  };

  const moveTo = (cell: Cell) => {
    setCursor(cell);
    if (anchor) setHover(cell);
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${key(cell)}"]`)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = puzzle.size;
    const [r, c] = cursor;
    // The grid runs right-to-left: column 0 is on the right.
    const moves: Record<string, Cell> = {
      ArrowUp: [Math.max(0, r - 1), c],
      ArrowDown: [Math.min(n - 1, r + 1), c],
      ArrowRight: [r, Math.max(0, c - 1)],
      ArrowLeft: [r, Math.min(n - 1, c + 1)],
      Home: [r, 0],
      End: [r, n - 1],
    };
    if (moves[e.key]) {
      e.preventDefault();
      moveTo(moves[e.key]);
    } else if (e.key === "Escape" && anchor) {
      e.preventDefault();
      setAnchor(null);
      setHover(null);
      setMessage("تاللاش بىكار قىلىندى.");
    }
  };

  const hint = () => {
    if (done || remaining.length === 0) return;
    begin();
    const count = (w: string) => {
      const p = puzzle.placements.find((x) => x.word === w)!;
      return p.cells.filter((cell) => hintCells.has(key(cell))).length;
    };
    const word = [...remaining].sort((a, b) => count(a) - count(b))[0];
    const p = puzzle.placements.find((x) => x.word === word)!;
    const k = Math.min(count(word), p.cells.length - 1);
    const cell = p.cells[k];
    setHints((h) => [...h, cell]);
    setMessage(
      k === 0
        ? `ئىشارە: «${word}» سۆزى يورۇتۇلغان ${describe(cell)} ھەرپتىن باشلىنىدۇ.`
        : `ئىشارە: «${word}» سۆزىنىڭ يەنە بىر ھەرپى يورۇتۇلدى: ${describe(cell)}.`,
    );
    moveTo(cell);
  };

  return (
    <section className="play-panel ws-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ھەرپ تورى ئويۇنى</span>
          <h2>سۆز ئىزدەش</h2>
          <p>
            تورنىڭ ئىچىگە يوشۇرۇنغان سۆزلەرنى تېپىڭ. سۆزنىڭ بىرىنچى ھەرپىدىن
            ئاخىرقى ھەرپىگىچە سىزىڭ ياكى ئىككى ئۇچىنى بىر-بىرلەپ چېكىڭ.
          </p>
        </div>
        <Sticker name="magnifier" size={86} />
      </div>

      <div className="ws-toolbar">
        <div className="ws-levels" role="group" aria-label="قىيىنلىق دەرىجىسى">
          {(Object.keys(difficulties) as WordSearchDifficulty[]).map((d) => (
            <button
              type="button"
              key={d}
              aria-pressed={difficulty === d}
              onClick={() => reset({ difficulty: d })}
            >
              {difficulties[d].label}
              <small>
                {difficulties[d].size}×{difficulties[d].size}
              </small>
            </button>
          ))}
        </div>
        <label className="ws-category">
          تېما:{" "}
          <select
            value={activeCategory}
            onChange={(e) => reset({ category: e.target.value })}
          >
            {wordSearchCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
            {hasSaved && <option value={SAVED_CATEGORY}>ساقلانغان سۆزلىرىم</option>}
          </select>
        </label>
      </div>

      <div className="ws-status-bar">
        <span className="ws-timer">
          <Timer size={17} aria-hidden="true" /> ۋاقىت:{" "}
          <strong dir="ltr">{formatTime(elapsed)}</strong>
        </span>
        <span>
          ئەڭ ياخشى ۋاقىت:{" "}
          <strong dir="ltr">{bestTime ? formatTime(bestTime) : "—"}</strong>
        </span>
        <span>
          تېپىلدى: <strong>{words.length - remaining.length}</strong> / {words.length}
        </span>
      </div>

      <div className="ws-layout">
        <div className="ws-board">
          <div
            ref={gridRef}
            className="ws-grid"
            role="group"
            aria-label={`ھەرپ تورى: ${puzzle.size} قۇر، ${puzzle.size} ئىستون`}
            aria-describedby="ws-help"
            style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
            data-size={puzzle.size}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onKeyDown={onKeyDown}
          >
            {puzzle.grid.map((row, r) =>
              row.map((letter, c) => {
                const k = `${r}-${c}`;
                const isFound = foundCells.has(k);
                const isStart = same(anchor, [r, c]);
                const cls = [
                  isFound && "found",
                  preview.has(k) && "picked",
                  isStart && "start",
                  hintCells.has(k) && !isFound && "hint",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    type="button"
                    key={k}
                    data-cell={k}
                    className={cls}
                    tabIndex={same(cursor, [r, c]) ? 0 : -1}
                    aria-pressed={isStart}
                    aria-label={`${letter}، ${r + 1}-قۇر، ${c + 1}-ئىستون${isFound ? "، تېپىلغان" : ""}${hintCells.has(k) && !isFound ? "، ئىشارە" : ""}`}
                    onFocus={() => {
                      if (!same(cursor, [r, c])) setCursor([r, c]);
                    }}
                    onClick={(e) => {
                      // Pointer clicks are handled by the pointer events above;
                      // keyboard and assistive-technology clicks have detail 0.
                      if (e.detail === 0) select([r, c]);
                    }}
                  >
                    <span aria-hidden="true">{letter}</span>
                  </button>
                );
              }),
            )}
          </div>
          <p id="ws-help" className="ws-help">
            كۇنۇپكا تاختىسى: يۆنىلىش كۇنۇپكىلىرى بىلەن مېڭىڭ، Enter ياكى بوشلۇق
            كۇنۇپكىسى بىلەن باشلىنىش ۋە ئاخىرلىشىش ھەرپىنى تاللاڭ، Esc بىكار
            قىلىدۇ.
          </p>
        </div>

        <aside className="ws-side">
          <h3>تېپىلىدىغان سۆزلەر</h3>
          <ul className="ws-words">
            {words.map((w) => {
              const g = glossary.get(w);
              const isFound = !!found[w];
              return (
                <li key={w} className={isFound ? "found" : ""}>
                  <span className="ws-word" lang="ug-Arab" dir="rtl">
                    {w}
                  </span>
                  {isFound && <span className="sr-only"> — تېپىلدى</span>}
                  {script !== "uey" && (
                    <span className="ws-translit" dir="ltr">
                      {t(w)}
                    </span>
                  )}
                  {isFound && g && (g.ug || g.en) && (
                    <span className="ws-gloss">
                      {g.ug}
                      {g.en && (
                        <>
                          {" "}
                          <span lang="en" dir="ltr">
                            ({g.en})
                          </span>
                        </>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="ws-actions">
            <Button variant="outline" onClick={hint} disabled={done}>
              <Lightbulb size={17} /> ئىشارە
            </Button>
            <Button variant="outline" onClick={() => reset()}>
              <RotateCcw size={17} /> يېڭى ئويۇن
            </Button>
          </div>
          {hints.length > 0 && (
            <p className="local-hint">ئىشارە سانى: {hints.length}</p>
          )}
        </aside>
      </div>

      <div role="status" aria-live="polite" className="ws-message">
        {message && <p>{message}</p>}
      </div>

      {done && (
        <article className="ws-result">
          <Sticker name={hints.length === 0 ? "first-place" : "smiley"} size={84} />
          <div>
            <h3 ref={resultRef} tabIndex={-1}>
              بارىكاللا! ھەممە سۆزنى تاپتىڭىز.
            </h3>
            <p>
              ۋاقىت: <strong dir="ltr">{formatTime(finished ?? 0)}</strong>
              {hints.length > 0 && <> · ئىشارە: {hints.length}</>}
            </p>
            <Button onClick={() => reset()}>
              <RotateCcw size={17} /> يەنە بىر ئويۇن
            </Button>
          </div>
        </article>
      )}

      <p className="local-hint">
        ئەڭ ياخشى ۋاقىتلار مۇشۇ توركۆرگۈچتە ساقلىنىدۇ.
        {!hasSaved &&
          ` ساقلانغان سۆزلىرىڭىز ${SAVED_MIN} ياكى ئۇنىڭدىن كۆپ بولسا، ئۇلار بىلەنمۇ ئوينىيالايسىز.`}
      </p>
      {error && <StorageNotice />}
    </section>
  );
}
