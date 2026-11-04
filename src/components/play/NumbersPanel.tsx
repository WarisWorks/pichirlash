import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode, RefObject } from "react";
import { ArrowLeft, Check, Clock3, Minus, Plus, RotateCcw, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { pickVoice } from "@/components/features/useReadAloud";
import type { VoiceMode } from "@/components/features/useReadAloud";
import { convertScript } from "@/lib/uyghur/script";
import {
  MAX_NUMBER,
  dialHour,
  numberDistractors,
  numberToWords,
  ordinal,
  timeToDigits,
  timeToWords,
  westernDigits,
  wordsToNumber,
} from "@/lib/uyghur/numbers";
import { isRecord } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import { shuffled } from "./spellingData";
import "./numbers.css";

type Reward = (id: string, label: string) => void;
type Stats = {
  rounds: number;
  perfect: number;
  best: number;
  clockRounds: number;
  clockPerfect: number;
  clockBest: number;
};
const ROUND = 8;
const nat = (n: unknown) =>
  typeof n === "number" && Number.isInteger(n) && n >= 0 && n < 1e6;
const validStats = (v: unknown): v is Stats =>
  isRecord(v) &&
  Object.keys(v).length === 6 &&
  (["rounds", "perfect", "best", "clockRounds", "clockPerfect", "clockBest"] as const).every(
    (k) => nat(v[k]),
  ) &&
  Number(v.best) <= ROUND &&
  Number(v.clockBest) <= ROUND;
const emptyStats: Stats = {
  rounds: 0,
  perfect: 0,
  best: 0,
  clockRounds: 0,
  clockPerfect: 0,
  clockBest: 0,
};

/** Group digits in threes with spaces (Western digits only): 1234567 → "1 234 567". */
const grouped = (n: number) =>
  `${n < 0 ? "-" : ""}${String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
const latin = (text: string) => convertScript(text, "uly");
const minutesToWords = (t: number) => timeToWords(Math.floor(t / 60) % 12, t % 60);
const minutesToDigits = (t: number) => timeToDigits(Math.floor(t / 60) % 12, t % 60);

/** Read Uyghur text aloud: a Uyghur voice, else a Turkish one reading Latin script. */
function useSpeaker() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [mode, setMode] = useState<VoiceMode>({ kind: "none" });
  useEffect(() => {
    if (!supported) return;
    const update = () => setMode(pickVoice(speechSynthesis.getVoices()));
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", update);
      speechSynthesis.cancel();
    };
  }, [supported]);
  const speak = (text: string) => {
    if (mode.kind === "none") return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(
      mode.kind === "approx" ? latin(text).replace(/'/g, "").toLowerCase() : text,
    );
    utter.voice = mode.voice;
    utter.lang = mode.voice.lang;
    utter.rate = 0.8;
    speechSynthesis.speak(utter);
  };
  return { available: mode.kind !== "none", approx: mode.kind === "approx", speak };
}
type Speaker = ReturnType<typeof useSpeaker>;

function Listen({ speaker, text }: { speaker: Speaker; text: string }) {
  if (!speaker.available) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => speaker.speak(text)}
      aria-label={`ئاڭلاش: ${text}`}
    >
      <Volume2 size={16} aria-hidden="true" /> ئاڭلاش
    </Button>
  );
}

/* ------------------------------------------------------------------ clock */

function AnalogClock({
  total,
  onChange,
  step = 1,
  label,
}: {
  total: number;
  onChange?: (t: number) => void;
  step?: number;
  label: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const hourRef = useRef<SVGGElement>(null);
  const minuteRef = useRef<SVGGElement>(null);
  const drag = useRef<"hour" | "minute" | null>(null);
  const minute = total % 60;
  const words = minutesToWords(total);
  const interactive = !!onChange;
  const set = (t: number) => onChange?.((((Math.round(t) % 720) + 720) % 720));

  const angleAt = (e: PointerEvent) => {
    const box = svg.current!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 200 - 100;
    const y = ((e.clientY - box.top) / box.height) * 200 - 100;
    return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
  };
  const moveTo = (e: PointerEvent, hand: "hour" | "minute") => {
    const a = angleAt(e);
    if (hand === "hour") {
      const unit = Math.max(step, 5);
      set(Math.round((a * 2) / unit) * unit);
      return;
    }
    const m = (Math.round(a / 6 / step) * step) % 60;
    let base = total - minute;
    if (m - minute < -30) base += 60;
    if (m - minute > 30) base -= 60;
    set(base + m);
  };
  const keys = (e: KeyboardEvent, hand: "hour" | "minute") => {
    const unit = hand === "hour" ? 60 : step;
    const big = hand === "hour" ? 180 : 15;
    const delta: Record<string, number> = {
      ArrowUp: unit,
      ArrowRight: unit,
      ArrowDown: -unit,
      ArrowLeft: -unit,
      PageUp: big,
      PageDown: -big,
    };
    if (e.key === "Home") {
      e.preventDefault();
      set(hand === "hour" ? minute : total - minute);
    } else if (delta[e.key]) {
      e.preventDefault();
      set(total + delta[e.key]);
    }
  };
  const slider = (hand: "hour" | "minute") =>
    interactive
      ? {
          role: "slider",
          tabIndex: 0,
          "aria-label": hand === "hour" ? "سائەت تىلى" : "مىنۇت تىلى",
          "aria-valuemin": hand === "hour" ? 1 : 0,
          "aria-valuemax": hand === "hour" ? 12 : 59,
          "aria-valuenow": hand === "hour" ? dialHour(Math.floor(total / 60)) : minute,
          "aria-valuetext": `${minutesToDigits(total)} — ${words}`,
          onKeyDown: (e: KeyboardEvent) => keys(e, hand),
        }
      : {};

  return (
    <svg
      ref={svg}
      viewBox="0 0 200 200"
      className={`num-clock ${interactive ? "is-live" : ""}`}
      role={interactive ? "group" : "img"}
      aria-label={label}
      onPointerDown={
        interactive
          ? (e) => {
              const hand = (e.target as Element).closest("[data-hand='hour']")
                ? "hour"
                : "minute";
              drag.current = hand;
              svg.current?.setPointerCapture(e.pointerId);
              (hand === "hour" ? hourRef : minuteRef).current?.focus({ preventScroll: true });
              moveTo(e, hand);
            }
          : undefined
      }
      onPointerMove={(e) => {
        if (drag.current) moveTo(e, drag.current);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <circle cx="100" cy="100" r="95" className="num-clock-rim" />
      <circle cx="100" cy="100" r="89" className="num-clock-face" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="100"
          y1={i % 5 ? 15 : 13}
          x2="100"
          y2={i % 5 ? 19 : 22}
          className={i % 5 ? "num-tick" : "num-tick big"}
          transform={`rotate(${i * 6} 100 100)`}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 * Math.PI) / 180;
        return (
          <text
            key={i}
            x={100 + 64 * Math.sin(a)}
            y={100 - 64 * Math.cos(a)}
            className="num-clock-digit"
            textAnchor="middle"
            dominantBaseline="central"
            aria-hidden="true"
          >
            {i + 1}
          </text>
        );
      })}
      <g
        ref={hourRef}
        data-hand="hour"
        className="num-hand-group"
        transform={`rotate(${total * 0.5} 100 100)`}
        {...slider("hour")}
      >
        <line x1="100" y1="108" x2="100" y2="52" className="num-hand hour" />
        <circle cx="100" cy="52" r="9" className="num-hand-focus" />
        {interactive && <line x1="100" y1="96" x2="100" y2="46" className="num-hand-hit" />}
      </g>
      <g
        ref={minuteRef}
        data-hand="minute"
        className="num-hand-group"
        transform={`rotate(${minute * 6} 100 100)`}
        {...slider("minute")}
      >
        <line x1="100" y1="112" x2="100" y2="24" className="num-hand minute" />
        <circle cx="100" cy="24" r="8" className="num-hand-focus" />
        {interactive && <line x1="100" y1="58" x2="100" y2="16" className="num-hand-hit" />}
      </g>
      <circle cx="100" cy="100" r="5" className="num-clock-pin" />
    </svg>
  );
}

/* ------------------------------------------------------------ round logic */

type Answer = { correct: boolean; given: string };
type RoundRefs = {
  nextRef: RefObject<HTMLButtonElement | null>;
  questionRef: RefObject<HTMLHeadingElement | null>;
  resultRef: RefObject<HTMLHeadingElement | null>;
};
function useRoundRefs(): RoundRefs {
  return {
    nextRef: useRef<HTMLButtonElement>(null),
    questionRef: useRef<HTMLHeadingElement>(null),
    resultRef: useRef<HTMLHeadingElement>(null),
  };
}
function useRound<Q>(build: () => Q[], { nextRef, questionRef, resultRef }: RoundRefs) {
  const [round, setRound] = useState<Q[]>(build);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [step, setStep] = useState(0);
  const moved = useRef(false);
  const current = answers[step];
  const finished = step >= round.length;
  useEffect(() => {
    if (!moved.current) return;
    if (finished) resultRef.current?.focus();
    else if (current) nextRef.current?.focus();
    else questionRef.current?.focus();
  }, [step, current, finished, nextRef, questionRef, resultRef]);
  return {
    round,
    answers,
    step,
    answered: current,
    finished,
    score: answers.filter((a) => a.correct).length,
    answer: (correct: boolean, given: string) => {
      if (answers[step] || finished) return;
      moved.current = true;
      setAnswers((a) => [...a, { correct, given }]);
    },
    /** Advance; returns the final score when the round has just finished. */
    next: () => {
      moved.current = true;
      setStep(step + 1);
      return step + 1 >= round.length ? answers.filter((a) => a.correct).length : null;
    },
    restart: (from?: Q[]) => {
      moved.current = true;
      setRound(from ?? build());
      setAnswers([]);
      setStep(0);
    },
  };
}

function Progress({ total, answers, step }: { total: number; answers: Answer[]; step: number }) {
  return (
    <div className="num-progress" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={answers[i] ? (answers[i].correct ? "ok" : "bad") : i === step ? "now" : ""}
        />
      ))}
    </div>
  );
}

function Result({
  score,
  total,
  onRestart,
  headingRef,
}: {
  score: number;
  total: number;
  onRestart: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <article className="num-card num-result">
      <Sticker
        name={score === total ? "hundred" : score >= total * 0.75 ? "smiley" : "teacup"}
        size={92}
      />
      <h3 ref={headingRef} tabIndex={-1}>
        {score} / {total} توغرا
      </h3>
      <p role="status">
        {score === total
          ? "مۇكەممەل! ھەممىسى توغرا."
          : score >= total * 0.75
            ? "بەك ياخشى! يەنە ئازراق مەشىق قىلساق تېخىمۇ ياخشى بولىدۇ."
            : "ھېچقىسى يوق، خاتالاردىن ئۆگىنىمىز."}
      </p>
      <Button onClick={onRestart}>
        <RotateCcw size={17} /> يېڭى ئويۇن
      </Button>
    </article>
  );
}

function Feedback({ answer, children }: { answer?: Answer; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="num-feedback">
      {answer &&
        (answer.correct ? (
          <p className="ok">
            <strong>توغرا!</strong> {children}
          </p>
        ) : (
          <p className="bad">
            <strong>توغرىسى:</strong> {children}
          </p>
        ))}
    </div>
  );
}

/* -------------------------------------------------------------- converter */

function Converter({ speaker }: { speaker: Speaker }) {
  const id = useId();
  const [raw, setRaw] = useState("2026");
  const [text, setText] = useState("");
  const digits = westernDigits(raw).replace(/[\s,_'’.]/g, "").replace(/^−/, "-");
  const n = /^-?\d{1,12}$/.test(digits) ? Number(digits) : null;
  const ok = n !== null && Math.abs(n) <= MAX_NUMBER;
  const words = ok ? numberToWords(n) : "";
  const parsed = text.trim() ? wordsToNumber(text) : null;
  return (
    <div className="num-converter">
      <div className="num-card">
        <label htmlFor={`${id}-digits`} className="num-label">
          رەقەم يېزىڭ
        </label>
        <input
          id={`${id}-digits`}
          className="num-input num-digits"
          inputMode="numeric"
          dir="ltr"
          autoComplete="off"
          maxLength={20}
          value={raw}
          placeholder="2026"
          aria-describedby={`${id}-out`}
          onChange={(e) => setRaw(westernDigits(e.target.value))}
        />
        <div id={`${id}-out`} role="status" aria-live="polite" className="num-output">
          {!raw.trim() ? (
            <p className="num-muted">بىر سان يېزىڭ، ئۇ سۆز بىلەن كۆرسىتىلىدۇ.</p>
          ) : ok ? (
            <>
              <p className="num-big-digits" dir="ltr">
                {grouped(n)}
              </p>
              <p className="num-words" lang="ug">
                {words}
              </p>
              <p className="num-latin" lang="ug-Latn" dir="ltr">
                {latin(words).toLowerCase()}
              </p>
              {n > 0 && (
                <p className="num-ordinal">
                  تەرتىپ سان: <strong>{ordinal(n)}</strong>
                </p>
              )}
            </>
          ) : (
            <p className="num-muted">
              پەقەت رەقەم يېزىڭ (ئەڭ كۆپ 12 خانە، ئالدىغا «-» قويسىڭىزمۇ بولىدۇ).
            </p>
          )}
        </div>
        {ok && raw.trim() && (
          <div className="num-actions">
            <Listen speaker={speaker} text={words} />
          </div>
        )}
      </div>
      <div className="num-card">
        <label htmlFor={`${id}-words`} className="num-label">
          سۆزدىن رەقەمگە
        </label>
        <input
          id={`${id}-words`}
          className="num-input"
          lang="ug"
          autoComplete="off"
          value={text}
          placeholder="مەسىلەن: ئىككى مىڭ يىگىرمە ئالتە"
          aria-describedby={`${id}-parsed`}
          onChange={(e) => setText(e.target.value)}
        />
        <p id={`${id}-parsed`} role="status" aria-live="polite" className="num-output">
          {!text.trim() ? (
            <span className="num-muted">سان سۆزلىرىنى ئۇيغۇرچە يېزىڭ.</span>
          ) : parsed !== null ? (
            <span className="num-big-digits" dir="ltr">
              {grouped(parsed)}
            </span>
          ) : (
            <span className="num-muted">بۇنى سان سۈپىتىدە ئوقۇيالمىدىم. ئىملاسىنى تەكشۈرۈڭ.</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ number quiz */

const levels = [
  { id: "small", label: "ئاسان (0–20)", min: 0, max: 20 },
  { id: "tens", label: "ئونلار (0–100)", min: 0, max: 100 },
  { id: "hundreds", label: "يۈزلەر (100–1000)", min: 100, max: 1000 },
  { id: "thousands", label: "مىڭلار (1000–1000000)", min: 1000, max: 1_000_000 },
] as const;
type Level = (typeof levels)[number];
type NumQ = { n: number; kind: "pick" | "type"; options: number[] };

function buildNumberRound(level: Level): NumQ[] {
  const seen = new Set<number>();
  const out: NumQ[] = [];
  for (let guard = 0; out.length < ROUND && guard < 1000; guard++) {
    const n = level.min + Math.floor(Math.random() * (level.max - level.min + 1));
    if (seen.has(n)) continue;
    seen.add(n);
    const kind = out.length % 2 === 0 ? "pick" : "type";
    out.push({
      n,
      kind,
      options: kind === "pick" ? shuffled([n, ...numberDistractors(n, level.max)]) : [],
    });
  }
  return out;
}

function NumberQuiz({
  stats,
  setStats,
  onReward,
  speaker,
}: {
  stats: Stats;
  setStats: (f: (s: Stats) => Stats) => void;
  onReward: Reward;
  speaker: Speaker;
}) {
  const id = useId();
  const [level, setLevel] = useState<Level>(levels[0]);
  const refs = useRoundRefs();
  const { nextRef, questionRef, resultRef } = refs;
  const r = useRound(() => buildNumberRound(levels[0]), refs);
  const [typed, setTyped] = useState("");
  const q = r.round[r.step];

  const next = () => {
    setTyped("");
    const final = r.next();
    if (final === null) return;
    const perfect = final === r.round.length;
    setStats((s) => ({
      ...s,
      rounds: s.rounds + 1,
      perfect: s.perfect + (perfect ? 1 : 0),
      best: Math.max(s.best, final),
    }));
    if (perfect) onReward(`numbers:round-${stats.perfect + 1}`, "سانلار ئويۇنى — مۇكەممەل");
  };
  const checkTyped = () => {
    const value = westernDigits(typed).replace(/[\s,]/g, "");
    if (!/^\d+$/.test(value) || !q) return;
    r.answer(Number(value) === q.n, value);
  };

  return (
    <div className="num-quiz">
      <div className="num-toolbar">
        <label>
          دەرىجە:{" "}
          <select
            value={level.id}
            onChange={(e) => {
              const next = levels.find((l) => l.id === e.target.value) ?? levels[0];
              setLevel(next);
              setTyped("");
              r.restart(buildNumberRound(next));
            }}
          >
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <span className="num-stats">
          ئەڭ يۇقىرى نەتىجە: <strong>{stats.best}</strong> / {ROUND} · مۇكەممەل ئويۇن:{" "}
          <strong>{stats.perfect}</strong>
        </span>
      </div>
      {!r.finished && q && (
        <article className="num-card" key={`${q.n}-${r.step}`}>
          <Progress total={r.round.length} answers={r.answers} step={r.step} />
          <span className="eyebrow">
            سوئال {r.step + 1} / {r.round.length}
          </span>
          {q.kind === "pick" ? (
            <>
              <h3 ref={questionRef} tabIndex={-1} className="num-question">
                <span className="num-ask">بۇ سان قانداق ئوقۇلىدۇ؟</span>
                <span className="num-big-digits" dir="ltr">
                  {grouped(q.n)}
                </span>
              </h3>
              <div className="num-options" role="group" aria-label="جاۋاب تاللاش">
                {q.options.map((o) => {
                  const state = r.answered
                    ? o === q.n
                      ? "right"
                      : String(o) === r.answered.given
                        ? "wrong"
                        : "dim"
                    : "";
                  return (
                    <button
                      type="button"
                      key={o}
                      lang="ug"
                      className={state}
                      aria-disabled={!!r.answered}
                      aria-pressed={r.answered?.given === String(o)}
                      onClick={() => r.answer(o === q.n, String(o))}
                    >
                      {numberToWords(o)}
                      {state === "right" && <Check size={18} aria-hidden="true" />}
                      {state === "wrong" && <X size={18} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h3 ref={questionRef} tabIndex={-1} className="num-question">
                <span className="num-ask">بۇ ساننى رەقەم بىلەن يېزىڭ:</span>
                <span className="num-words" lang="ug">
                  {numberToWords(q.n)}
                </span>
              </h3>
              <form
                className="num-type"
                onSubmit={(e) => {
                  e.preventDefault();
                  checkTyped();
                }}
              >
                <label htmlFor={`${id}-answer`} className="sr-only">
                  جاۋاب (رەقەم)
                </label>
                <input
                  id={`${id}-answer`}
                  className="num-input num-digits"
                  inputMode="numeric"
                  dir="ltr"
                  autoComplete="off"
                  value={typed}
                  readOnly={!!r.answered}
                  onChange={(e) => setTyped(westernDigits(e.target.value))}
                />
                {!r.answered && (
                  <Button type="submit" disabled={!/\d/.test(typed)}>
                    <Check size={17} /> تەكشۈرۈش
                  </Button>
                )}
              </form>
            </>
          )}
          <Feedback answer={r.answered}>
            <bdi dir="ltr">{grouped(q.n)}</bdi> — {numberToWords(q.n)}
          </Feedback>
          {r.answered && (
            <div className="num-actions">
              <Button ref={nextRef} onClick={next}>
                {r.step + 1 < r.round.length ? "كېيىنكى سوئال" : "نەتىجىنى كۆرۈش"}
                <ArrowLeft size={17} />
              </Button>
              <Listen speaker={speaker} text={numberToWords(q.n)} />
            </div>
          )}
        </article>
      )}
      {r.finished && (
        <Result
          score={r.score}
          total={r.round.length}
          headingRef={resultRef}
          onRestart={() => {
            setTyped("");
            r.restart(buildNumberRound(level));
          }}
        />
      )}
      <p className="local-hint">
        سەككىز سوئالنىڭ ھەممىسىگە توغرا جاۋاب بەرسىڭىز، باغچىڭىزغا بىر گۈل قوشۇلىدۇ.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- clock tab */

type ClockQ = { t: number; kind: "read" | "set"; options: number[] };
const randomTime = () => Math.floor(Math.random() * 144) * 5;
function buildClockRound(): ClockQ[] {
  const out: ClockQ[] = [];
  const seen = new Set<number>();
  for (let guard = 0; out.length < ROUND && guard < 1000; guard++) {
    // Early questions use whole and half hours; later ones any 5 minutes.
    const t = out.length < 2 ? Math.floor(Math.random() * 24) * 30 : randomTime();
    if (seen.has(t)) continue;
    seen.add(t);
    const kind = out.length % 2 === 0 ? "read" : "set";
    const m = t % 60;
    const near = [t + 60, t - 60, t - m + ((60 - m) % 60), t + 5, t - 5, t + 30, t - 30]
      .map((x) => ((x % 720) + 720) % 720)
      .filter((x) => x !== t);
    const options = new Set<number>();
    for (const x of shuffled(near)) if (options.size < 3) options.add(x);
    while (options.size < 3) {
      const x = randomTime();
      if (x !== t) options.add(x);
    }
    out.push({ t, kind, options: kind === "read" ? shuffled([t, ...options]) : [] });
  }
  return out;
}

function ClockTab({
  stats,
  setStats,
  onReward,
  speaker,
}: {
  stats: Stats;
  setStats: (f: (s: Stats) => Stats) => void;
  onReward: Reward;
  speaker: Speaker;
}) {
  const [mode, setMode] = useState<"free" | "quiz">("free");
  const [free, setFree] = useState(() => {
    const d = new Date();
    return ((d.getHours() % 12) * 60 + d.getMinutes()) % 720;
  });
  const [setting, setSetting] = useState(0);
  const refs = useRoundRefs();
  const { nextRef, questionRef, resultRef } = refs;
  const r = useRound(buildClockRound, refs);
  const q = r.round[r.step];
  const words = minutesToWords(free);

  const next = () => {
    setSetting(0);
    const final = r.next();
    if (final === null) return;
    const perfect = final === r.round.length;
    setStats((s) => ({
      ...s,
      clockRounds: s.clockRounds + 1,
      clockPerfect: s.clockPerfect + (perfect ? 1 : 0),
      clockBest: Math.max(s.clockBest, final),
    }));
    if (perfect)
      onReward(`numbers:clock-${stats.clockPerfect + 1}`, "سائەت ئويۇنى — مۇكەممەل");
  };

  return (
    <div className="num-clock-tab">
      <div className="num-modes" role="group" aria-label="سائەت ئويۇنى">
        <button type="button" aria-pressed={mode === "free"} onClick={() => setMode("free")}>
          سائەتنى ئويناش
        </button>
        <button type="button" aria-pressed={mode === "quiz"} onClick={() => setMode("quiz")}>
          سائەت قانچە بولدى؟
        </button>
      </div>

      {mode === "free" && (
        <div className="num-card num-clock-card">
          <AnalogClock total={free} onChange={setFree} label="سائەت — تىللىرىنى يۆتكەڭ" />
          <div className="num-clock-info">
            <p className="num-big-digits" dir="ltr">
              {minutesToDigits(free)}
            </p>
            <p className="num-words" lang="ug" role="status" aria-live="polite">
              {words}
            </p>
            <p className="num-latin" lang="ug-Latn" dir="ltr">
              {latin(words)}
            </p>
            <div className="num-actions">
              <Button variant="outline" size="sm" onClick={() => setFree((t) => (t + 715) % 720)}>
                <Minus size={15} aria-hidden="true" /> 5 مىنۇت
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFree((t) => (t + 5) % 720)}>
                <Plus size={15} aria-hidden="true" /> 5 مىنۇت
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  setFree((d.getHours() % 12) * 60 + d.getMinutes());
                }}
              >
                <Clock3 size={15} aria-hidden="true" /> ھازىرقى ۋاقىت
              </Button>
              <Listen speaker={speaker} text={words} />
            </div>
            <p className="local-hint">
              تىللارنى چاشقىنەك ياكى بارمىقىڭىز بىلەن سۆرەڭ. كۇنۇپكا تاختىسىدا تىلنى تاللاپ،
              يۆنىلىش كۇنۇپكىلىرى بىلەن يۆتكەڭ.
            </p>
          </div>
        </div>
      )}

      {mode === "quiz" && (
        <>
          <p className="num-stats">
            ئەڭ يۇقىرى نەتىجە: <strong>{stats.clockBest}</strong> / {ROUND} · مۇكەممەل ئويۇن:{" "}
            <strong>{stats.clockPerfect}</strong>
          </p>
          {!r.finished && q && (
            <article className="num-card" key={`${q.t}-${r.step}`}>
              <Progress total={r.round.length} answers={r.answers} step={r.step} />
              <span className="eyebrow">
                سوئال {r.step + 1} / {r.round.length}
              </span>
              {q.kind === "read" ? (
                <>
                  <h3 ref={questionRef} tabIndex={-1} className="num-question">
                    <span className="num-ask">سائەت قانچە بولدى؟</span>
                  </h3>
                  <div className="num-clock-card">
                    <AnalogClock total={q.t} label={`سائەت ${minutesToDigits(q.t)}`} />
                    <div className="num-options single" role="group" aria-label="جاۋاب تاللاش">
                      {q.options.map((o) => {
                        const state = r.answered
                          ? o === q.t
                            ? "right"
                            : String(o) === r.answered.given
                              ? "wrong"
                              : "dim"
                          : "";
                        return (
                          <button
                            type="button"
                            key={o}
                            lang="ug"
                            className={state}
                            aria-disabled={!!r.answered}
                            aria-pressed={r.answered?.given === String(o)}
                            onClick={() => r.answer(o === q.t, String(o))}
                          >
                            {minutesToWords(o)}
                            {state === "right" && <Check size={18} aria-hidden="true" />}
                            {state === "wrong" && <X size={18} aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 ref={questionRef} tabIndex={-1} className="num-question">
                    <span className="num-ask">سائەتنى مۇنداق توغرىلاڭ:</span>
                    <span className="num-words" lang="ug">
                      {minutesToWords(q.t)}
                    </span>
                  </h3>
                  <div className="num-clock-card">
                    <AnalogClock
                      total={setting}
                      step={5}
                      onChange={r.answered ? undefined : setSetting}
                      label="سائەت — تىللىرىنى يۆتكەڭ"
                    />
                    <div className="num-clock-info">
                      <p className="num-big-digits" dir="ltr" aria-hidden="true">
                        {minutesToDigits(setting)}
                      </p>
                      {!r.answered && (
                        <Button
                          onClick={() => r.answer(setting === q.t, String(setting))}
                        >
                          <Check size={17} /> تەكشۈرۈش
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
              <Feedback answer={r.answered}>
                <bdi dir="ltr">{minutesToDigits(q.t)}</bdi> — {minutesToWords(q.t)}
              </Feedback>
              {r.answered && (
                <div className="num-actions">
                  <Button ref={nextRef} onClick={next}>
                    {r.step + 1 < r.round.length ? "كېيىنكى سوئال" : "نەتىجىنى كۆرۈش"}
                    <ArrowLeft size={17} />
                  </Button>
                  <Listen speaker={speaker} text={minutesToWords(q.t)} />
                </div>
              )}
            </article>
          )}
          {r.finished && (
            <Result
              score={r.score}
              total={r.round.length}
              headingRef={resultRef}
              onRestart={() => {
                setSetting(0);
                r.restart();
              }}
            />
          )}
          <p className="local-hint">
            سەككىز سوئالنىڭ ھەممىسىگە توغرا جاۋاب بەرسىڭىز، باغچىڭىزغا بىر گۈل قوشۇلىدۇ.
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ panel */

const tabs = [
  { id: "convert", label: "سان ئايلاندۇرۇش" },
  { id: "quiz", label: "سان ئويۇنى" },
  { id: "clock", label: "سائەت" },
] as const;
type Tab = (typeof tabs)[number]["id"];

export default function NumbersPanel({ onReward }: { onReward: Reward }) {
  const id = useId();
  const { value: stats, setValue: setStats, error } = useLocal<Stats>(
    "pichirlash-numbers-v1",
    emptyStats,
    validStats,
  );
  const [tab, setTab] = useState<Tab>("convert");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const speaker = useSpeaker();

  const onTabKey = (e: KeyboardEvent, i: number) => {
    // Right-to-left: ArrowLeft moves to the next tab.
    const move: Record<string, number> = {
      ArrowLeft: 1,
      ArrowRight: -1,
      Home: -i,
      End: tabs.length - 1 - i,
    };
    if (move[e.key] === undefined) return;
    e.preventDefault();
    const nextIndex = (i + move[e.key] + tabs.length) % tabs.length;
    setTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="play-panel num-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">سانلار ۋە سائەت</span>
          <h2>سانلار ئويۇنى</h2>
          <p>
            رەقەملەرنى سۆز بىلەن ئوقۇشنى ۋە يېزىشنى ئۆگىنەيلى، ئاندىن سائەتكە قاراپ ۋاقىتنى
            ئېيتىپ باقايلى.
          </p>
        </div>
        <Sticker name="calculator" size={86} />
      </div>

      <div className="num-tabs" role="tablist" aria-label="سانلار بۆلۈملىرى">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${id}-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${id}-panel-${t.id}`}
          aria-labelledby={`${id}-tab-${t.id}`}
          hidden={tab !== t.id}
          className="num-tabpanel"
        >
          {tab === t.id && t.id === "convert" && <Converter speaker={speaker} />}
          {tab === t.id && t.id === "quiz" && (
            <NumberQuiz stats={stats} setStats={setStats} onReward={onReward} speaker={speaker} />
          )}
          {tab === t.id && t.id === "clock" && (
            <ClockTab stats={stats} setStats={setStats} onReward={onReward} speaker={speaker} />
          )}
        </div>
      ))}
      {speaker.approx && (
        <p className="local-hint">
          ئۈسكۈنىڭىزدە ئۇيغۇرچە ئاۋاز يوق، شۇڭا تۈركچە ئاۋاز بىلەن تەخمىنىي ئوقۇلىدۇ.
        </p>
      )}
      {error && <StorageNotice />}
    </section>
  );
}
