import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { isRecord } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import {
  pickRound,
  shuffled,
  spellingCategories,
  spellingQuestions,
} from "./spellingData";
import type { SpellingCategory, SpellingQuestion } from "./spellingData";
import "./spelling.css";

type Filter = SpellingCategory | "all";
type Stats = { rounds: number; perfect: number; best: number };
type Answer = { question: SpellingQuestion; chosen: string };
const nat = (n: unknown) =>
  typeof n === "number" && Number.isInteger(n) && n >= 0 && n < 1e6;
const validStats = (v: unknown): v is Stats =>
  isRecord(v) && nat(v.rounds) && nat(v.perfect) && nat(v.best) && Number(v.best) <= 8;

const build = (filter: Filter, from?: SpellingQuestion[]) =>
  (from ?? pickRound(filter)).map((q) => ({ ...q, options: shuffled(q.options) }));

export default function SpellingPractice({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const {
    value: stats,
    setValue: setStats,
    error,
  } = useLocal<Stats>(
    "pichirlash-spelling-v1",
    { rounds: 0, perfect: 0, best: 0 },
    validStats,
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [round, setRound] = useState(() => build("all"));
  const [review, setReview] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [step, setStep] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const q = round[step];
  const current = answers[step];
  const finished = step >= round.length;
  const score = answers.filter((a) => a.chosen === a.question.answer).length;
  const mistakes = answers.filter((a) => a.chosen !== a.question.answer);

  useEffect(() => {
    if (!moved.current) return;
    if (finished) resultRef.current?.focus();
    else if (current) nextRef.current?.focus();
    else questionRef.current?.focus();
  }, [step, current, finished]);

  const start = (f: Filter, from?: SpellingQuestion[]) => {
    moved.current = true;
    setRound(build(f, from));
    setReview(!!from);
    setAnswers([]);
    setStep(0);
  };
  const choose = (option: string) => {
    if (current || !q) return;
    moved.current = true;
    setAnswers((a) => [...a, { question: q, chosen: option }]);
  };
  const next = () => {
    moved.current = true;
    const s = step + 1;
    setStep(s);
    if (s < round.length || review) return;
    const total = answers.filter((a) => a.chosen === a.question.answer).length;
    const perfect = total === round.length && round.length >= 8;
    setStats((v) => ({
      rounds: v.rounds + 1,
      perfect: v.perfect + (perfect ? 1 : 0),
      best: Math.max(v.best, total),
    }));
    if (perfect)
      onReward(`spelling:round-${stats.perfect + 1}`, "ئىملا مەشىقى — مۇكەممەل");
  };
  const count = (c: Filter) =>
    spellingQuestions.filter((x) => c === "all" || x.category === c).length;

  return (
    <section className="play-panel spell-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">توغرا يېزىش ئويۇنى</span>
          <h2>ئىملا مەشىقى</h2>
          <p>
            ھەر قېتىم سەككىز سوئال بار. ئىزاھقا ماس كېلىدىغان توغرا يېزىلىشنى
            تاللاڭ: ې ۋە ى، ۆ ۋە ۈ، و ۋە ۇ، شۇنداقلا ئ نىڭ ئورنى.
          </p>
        </div>
        <Sticker name="owl" size={86} />
      </div>

      <div className="spell-toolbar">
        <label>
          تۈر:{" "}
          <select
            value={filter}
            onChange={(e) => {
              const f = e.target.value as Filter;
              setFilter(f);
              start(f);
            }}
          >
            <option value="all">ھەممىسى ({count("all")})</option>
            {spellingCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({count(c.id)})
              </option>
            ))}
          </select>
        </label>
        <span className="spell-stats">
          ئەڭ يۇقىرى نەتىجە: <strong>{stats.best}</strong> / 8 · مۇكەممەل ئويۇن:{" "}
          <strong>{stats.perfect}</strong>
        </span>
      </div>

      {!finished && q && (
        <article className="spell-card" key={`${q.id}-${step}`}>
          <div className="spell-progress" aria-hidden="true">
            {round.map((x, i) => (
              <span
                key={x.id}
                className={
                  answers[i]
                    ? answers[i].chosen === x.answer
                      ? "ok"
                      : "bad"
                    : i === step
                      ? "now"
                      : ""
                }
              />
            ))}
          </div>
          <span className="eyebrow">
            {review ? "قايتا ئىشلەش · " : ""}سوئال {step + 1} / {round.length}
          </span>
          <h3 ref={questionRef} tabIndex={-1} className="spell-clue">
            {q.clue}
          </h3>
          <p className="spell-ask">قايسى يېزىلىش توغرا؟</p>
          <div className="spell-options" role="group" aria-label="جاۋاب تاللاش">
            {q.options.map((o) => {
              const state = current
                ? o === q.answer
                  ? "right"
                  : o === current.chosen
                    ? "wrong"
                    : "dim"
                : "";
              return (
                <button
                  type="button"
                  key={o}
                  className={state}
                  aria-disabled={!!current}
                  aria-pressed={current?.chosen === o}
                  onClick={() => choose(o)}
                >
                  {o}
                  {state === "right" && <Check size={20} aria-hidden="true" />}
                  {state === "wrong" && <X size={20} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div role="status" aria-live="polite" className="spell-feedback">
            {current &&
              (current.chosen === q.answer ? (
                <p className="ok">
                  <strong>توغرا!</strong> {q.explain}
                </p>
              ) : (
                <p className="bad">
                  <strong>توغرىسى: «{q.answer}».</strong> {q.explain}
                </p>
              ))}
          </div>
          {current && (
            <Button ref={nextRef} onClick={next}>
              {step + 1 < round.length ? "كېيىنكى سوئال" : "نەتىجىنى كۆرۈش"}
              <ArrowLeft size={17} />
            </Button>
          )}
        </article>
      )}

      {finished && (
        <article className="spell-card spell-result">
          <Sticker
            name={score === round.length ? "comet" : score >= round.length * 0.75 ? "smiley" : "teacup"}
            size={96}
          />
          <h3 ref={resultRef} tabIndex={-1}>
            {score} / {round.length} توغرا
          </h3>
          <p role="status">
            {score === round.length
              ? "مۇكەممەل! ھەممىسى توغرا."
              : score >= round.length * 0.75
                ? "بەك ياخشى! يەنە ئازراق مەشىق قىلساق تېخىمۇ ياخشى بولىدۇ."
                : "ھېچقىسى يوق، خاتالاردىن ئۆگىنىمىز."}
          </p>
          <div className="editor-actions">
            <Button onClick={() => start(filter)}>
              <RotateCcw size={17} /> يېڭى ئويۇن
            </Button>
            {mistakes.length > 0 && (
              <Button
                variant="outline"
                onClick={() =>
                  start(
                    filter,
                    mistakes.map((m) => m.question),
                  )
                }
              >
                خاتالارنى قايتا ئىشلەش
              </Button>
            )}
          </div>
          {mistakes.length > 0 && (
            <div className="spell-review">
              <h4>قايتا كۆرۈپ چىقايلى</h4>
              <ul>
                {mistakes.map((m) => (
                  <li key={m.question.id}>
                    <p className="spell-review-clue">{m.question.clue}</p>
                    <p>
                      <span className="spell-chosen">
                        سىزنىڭ جاۋابىڭىز: <s>{m.chosen}</s>
                      </span>
                      <span className="spell-correct">
                        توغرىسى: <strong>{m.question.answer}</strong>
                      </span>
                    </p>
                    <p className="spell-explain">{m.question.explain}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review && (
            <p className="local-hint">
              قايتا ئىشلەش نەتىجىسى ئومۇمىي ھېسابقا قوشۇلمايدۇ.
            </p>
          )}
        </article>
      )}
      <p className="local-hint">
        سەككىز سوئالنىڭ ھەممىسىگە توغرا جاۋاب بەرسىڭىز، باغچىڭىزغا بىر گۈل
        قوشۇلىدۇ.
      </p>
      {error && <StorageNotice />}
    </section>
  );
}
