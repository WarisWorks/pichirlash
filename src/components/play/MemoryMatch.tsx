import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { isRecord } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import { PAIR_COUNTS, faceLabel, makeDeck, memoryModes } from "./memoryData";
import type { MemoryFace, MemoryMode } from "./memoryData";
import "./memory.css";

type Score = { moves: number; seconds: number };
type Best = Record<string, Score>;
const nat = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n > 0 && n < 1e6;
const validBest = (v: unknown): v is Best =>
  isRecord(v) && Object.values(v).every((s) => isRecord(s) && nat(s.moves) && nat(s.seconds));

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const clock = () => Date.now();
const newSeed = () => Math.floor(Math.random() * 2 ** 31);
const MISMATCH_MS = 1100;

function Face({ face }: { face: MemoryFace }) {
  if (face.kind === "sticker")
    return <Sticker name={face.name} size={72} rotate={0} className="mm-sticker" />;
  return (
    <span
      className={`mm-text${[...face.text].length > 8 ? " long" : ""}`}
      lang={face.lang}
      dir={face.dir}
    >
      {face.text}
    </span>
  );
}

export default function MemoryMatch({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const { value: best, setValue: setBest, error } = useLocal<Best>(
    "pichirlash-memory-v1",
    {},
    validBest,
  );
  const [mode, setMode] = useState<MemoryMode>("picture");
  const [pairs, setPairs] = useState<number>(6);
  const [seed, setSeed] = useState(newSeed);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [finished, setFinished] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const closeTimer = useRef<number | undefined>(undefined);
  const resultRef = useRef<HTMLHeadingElement>(null);

  const deck = useMemo(() => makeDeck(mode, pairs, seed), [mode, pairs, seed]);
  const modeInfo = memoryModes.find((m) => m.id === mode)!;
  const done = finished !== null;
  const elapsed = done
    ? finished
    : startedAt === null
      ? 0
      : Math.max(0, Math.floor((now - startedAt) / 1000));
  const bestKey = `${mode}:${pairs}`;
  const bestScore = best[bestKey];

  useEffect(() => {
    if (startedAt === null || done) return;
    const id = window.setInterval(() => setNow(clock()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, done]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  useEffect(() => {
    if (done) resultRef.current?.focus();
  }, [done]);

  const reset = (next: { mode?: MemoryMode; pairs?: number } = {}) => {
    window.clearTimeout(closeTimer.current);
    if (next.mode) setMode(next.mode);
    if (next.pairs) setPairs(next.pairs);
    setSeed(newSeed());
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setStartedAt(null);
    setFinished(null);
    setMessage("كارتىلار ئارىلاشتۇرۇلدى. ئىككى كارتىنى ئېچىپ جۈپىنى تېپىڭ.");
  };

  const flip = (i: number) => {
    const card = deck[i];
    if (done || matched.includes(card.pair) || open.includes(i)) return;
    if (startedAt === null) {
      const t0 = clock();
      setStartedAt(t0);
      setNow(t0);
    }
    // A third card closes a mismatched pair straight away.
    if (open.length !== 1) {
      window.clearTimeout(closeTimer.current);
      setOpen([i]);
      setMessage(`ئېچىلدى: ${faceLabel(card.face)}`);
      return;
    }
    const first = deck[open[0]];
    const m = moves + 1;
    setMoves(m);
    setOpen([open[0], i]);
    const pairText = `${faceLabel(first.face)} — ${faceLabel(card.face)}`;
    if (first.pair !== card.pair) {
      setMessage(`ماس كەلمىدى: ${pairText}.`);
      closeTimer.current = window.setTimeout(() => setOpen([]), MISMATCH_MS);
      return;
    }
    const nextMatched = [...matched, card.pair];
    setMatched(nextMatched);
    setOpen([]);
    if (nextMatched.length < pairs) {
      setMessage(`جۈپ تېپىلدى: ${pairText}. يەنە ${pairs - nextMatched.length} جۈپ قالدى.`);
      return;
    }
    const seconds = Math.max(1, startedAt === null ? 1 : Math.round((clock() - startedAt) / 1000));
    setFinished(seconds);
    const record =
      !bestScore ||
      m < bestScore.moves ||
      (m === bestScore.moves && seconds < bestScore.seconds);
    if (record) setBest((v) => ({ ...v, [bestKey]: { moves: m, seconds } }));
    setMessage(
      `ھەممە جۈپ تېپىلدى! ${m} قەدەم، ${formatTime(seconds)}${record ? "، يېڭى رېكورت!" : ""}`,
    );
    onReward(`memory:${mode}`, `جۈپ تېپىش — ${modeInfo.label}`);
  };

  return (
    <section className="play-panel mm-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ئەستە ساقلاش ئويۇنى</span>
          <h2>جۈپ تېپىش</h2>
          <p>
            كارتىلارنى ئىككىدىن ئېچىڭ. ئوخشاش مەنىدىكى ئىككى كارتىنى تاپسىڭىز،
            ئۇلار ئوچۇق قالىدۇ. {modeInfo.hint}
          </p>
        </div>
        <Sticker name="owl" size={86} />
      </div>

      <div className="mm-toolbar">
        <div className="mm-modes" role="group" aria-label="ئويۇن تۈرى">
          {memoryModes.map((m) => (
            <button
              type="button"
              key={m.id}
              aria-pressed={mode === m.id}
              onClick={() => reset({ mode: m.id })}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mm-modes" role="group" aria-label="جۈپ سانى">
          {PAIR_COUNTS.map((n) => (
            <button
              type="button"
              key={n}
              aria-pressed={pairs === n}
              onClick={() => reset({ pairs: n })}
            >
              {n} جۈپ
            </button>
          ))}
        </div>
      </div>

      <div className="mm-status-bar">
        <span>
          قەدەم: <strong>{moves}</strong>
        </span>
        <span className="mm-timer">
          <Timer size={17} aria-hidden="true" /> ۋاقىت:{" "}
          <strong dir="ltr">{formatTime(elapsed)}</strong>
        </span>
        <span>
          جۈپ: <strong>{matched.length}</strong> / {pairs}
        </span>
        <span>
          ئەڭ ياخشى نەتىجە:{" "}
          {bestScore ? (
            <strong>
              {bestScore.moves} قەدەم، <span dir="ltr">{formatTime(bestScore.seconds)}</span>
            </strong>
          ) : (
            <strong>—</strong>
          )}
        </span>
      </div>

      <ul className="mm-grid" data-pairs={pairs} aria-label="كارتىلار">
        {deck.map((card, i) => {
          const isMatched = matched.includes(card.pair);
          const isOpen = isMatched || open.includes(i);
          const label = isOpen
            ? `${i + 1}-كارتا: ${faceLabel(card.face)}${isMatched ? "، جۈپى تېپىلدى" : ""}`
            : `${i + 1}-كارتا، يېپىق`;
          return (
            <li key={card.id}>
              <button
                type="button"
                className={`mm-card${isOpen ? " open" : ""}${isMatched ? " matched" : ""}`}
                aria-label={label}
                aria-disabled={isOpen || done}
                onClick={() => flip(i)}
              >
                {isOpen ? (
                  <span className="mm-face" aria-hidden="true">
                    <Face face={card.face} />
                  </span>
                ) : (
                  <span className="mm-back" aria-hidden="true">
                    ؟
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div role="status" aria-live="polite" className="mm-message">
        {message && <p>{message}</p>}
      </div>

      {done && (
        <article className="mm-result">
          <Sticker name="party-popper" size={84} />
          <div>
            <h3 ref={resultRef} tabIndex={-1}>
              بارىكاللا! ھەممە جۈپنى تاپتىڭىز.
            </h3>
            <p>
              {moves} قەدەم · ۋاقىت: <strong dir="ltr">{formatTime(finished ?? 0)}</strong>
            </p>
            <Button onClick={() => reset()}>
              <RotateCcw size={17} /> يەنە بىر ئويۇن
            </Button>
          </div>
        </article>
      )}

      <div className="mm-actions">
        <Button variant="outline" onClick={() => reset()}>
          <RotateCcw size={17} /> قايتا ئارىلاشتۇرۇش
        </Button>
      </div>
      <p className="local-hint">ئەڭ ياخشى نەتىجىلەر مۇشۇ توركۆرگۈچتە ساقلىنىدۇ.</p>
      {error && <StorageNotice />}
    </section>
  );
}
