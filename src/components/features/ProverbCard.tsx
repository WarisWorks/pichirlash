import { useState } from "react";
import { Quote, Shuffle, PenLine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { proverbForDay, proverbs } from "@/lib/uyghur/proverbs";
import { localDay, isRecord } from "@/components/play/model";
import { useLocal } from "@/components/play/useLocal";
import { useScript } from "@/components/play/Experience";

type Answers = Record<string, { text: string; day: string }>;
const validAnswers = (v: unknown): v is Answers =>
  isRecord(v) &&
  Object.values(v).every(
    (x) => isRecord(x) && typeof x.text === "string" && typeof x.day === "string",
  );

/** A daily proverb with a reflection prompt; answers are kept per proverb. */
export default function ProverbCard({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const today = proverbForDay(localDay());
  const [id, setId] = useState(today.id),
    [writing, setWriting] = useState(false),
    [status, setStatus] = useState("");
  const proverb = proverbs.find((p) => p.id === id) ?? today;
  const { value: answers, setValue: setAnswers } = useLocal<Answers>(
    "pichirlash-proverb-answers-v1",
    {},
    validAnswers,
  );
  const [draft, setDraft] = useState(answers[proverb.id]?.text ?? "");
  const { t, dir, lang } = useScript();
  return (
    <section className="proverb-card" aria-labelledby="proverb-title">
      <span className="washi" />
      <div className="proverb-head">
        <span className="eyebrow">
          {proverb.id === today.id ? "بۈگۈنكى ماقال-تەمسىل" : "ماقال-تەمسىل"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const others = proverbs.filter((p) => p.id !== proverb.id);
            const next = others[Math.floor(Math.random() * others.length)];
            setId(next.id);
            setDraft(answers[next.id]?.text ?? "");
            setWriting(false);
            setStatus("");
          }}
        >
          <Shuffle size={15} /> باشقىسى
        </Button>
      </div>
      <blockquote id="proverb-title" dir={dir} lang={lang}>
        <Quote size={22} aria-hidden="true" />
        {t(proverb.text)}
      </blockquote>
      <p className="proverb-meaning" dir={dir} lang={lang}>
        {t(proverb.meaning)}
      </p>
      {!writing ? (
        <Button variant="outline" onClick={() => setWriting(true)}>
          <PenLine size={16} />
          {answers[proverb.id] ? "جاۋابىمنى كۆرۈش" : "بۇ ماڭا نېمە دەيدۇ؟"}
        </Button>
      ) : (
        <form
          className="proverb-answer"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            setAnswers((v) => ({
              ...v,
              [proverb.id]: { text: draft.trim(), day: localDay() },
            }));
            onReward(`proverb:${proverb.id}`, "بىر ماقالغا جاۋاب");
            setStatus("جاۋابىڭىز ساقلاندى.");
          }}
        >
          <label className="field">
            {proverb.prompt}
            <textarea
              rows={3}
              maxLength={1000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={!draft.trim()}>
            <Check size={16} /> ساقلاش
          </Button>
          <p role="status" className="local-hint">
            {status}
          </p>
        </form>
      )}
    </section>
  );
}
