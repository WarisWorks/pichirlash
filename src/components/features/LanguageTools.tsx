import { useState } from "react";
import { ArrowLeftRight, Copy, Eye, RotateCcw, ThumbsUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/components/play/imageExport";
import { useLocal } from "@/components/play/useLocal";
import { StorageNotice } from "@/components/play/Experience";
import { convertScript, latinToArabic } from "@/lib/uyghur/script";
import { WORDS_KEY, validWords } from "./wordStore";
import type { SavedWord } from "./wordStore";

const sample = "ئۇيغۇر تىلى — دىلىمىزنىڭ ئاچقۇچى. بۈگۈن بىر يېڭى سۆز ئۆگىنەيلى!";

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={!text.trim()}
      onClick={() =>
        copyText(text)
          .then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1800);
          })
          .catch(() => setDone(false))
      }
    >
      <Copy size={15} /> {done ? "كۆچۈرۈلدى" : "كۆچۈرۈش"}
    </Button>
  );
}

function Converter() {
  const [direction, setDirection] = useState<"fromArabic" | "fromLatin">("fromArabic");
  const [text, setText] = useState(sample);
  const arabic = direction === "fromArabic" ? text : latinToArabic(text);
  const outputs = [
    { id: "uey", label: "ئەرەب يېزىقى (UEY)", text: arabic, dir: "rtl", lang: "ug" },
    { id: "uly", label: "Latin (ULY)", text: convertScript(arabic, "uly"), dir: "ltr", lang: "ug-Latn" },
    { id: "usy", label: "Кирил (USY)", text: convertScript(arabic, "usy"), dir: "ltr", lang: "ug-Cyrl" },
  ].filter((o) => !(direction === "fromArabic" && o.id === "uey"));
  return (
    <div className="lang-card">
      <h3>يېزىق ئالماشتۇرغۇچ</h3>
      <p className="local-hint">
        ئۇيغۇرچە تېكىستنى بىر يېزىقتىن يەنە بىر يېزىققا ئايلاندۇرۇڭ — چەتئەلدىكى
        بالىلار ۋە ئۆگەنگۈچىلەر ئۈچۈن.
      </p>
      <div className="converter-direction">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (direction === "fromArabic") {
              setText(convertScript(text, "uly"));
              setDirection("fromLatin");
            } else {
              setText(latinToArabic(text));
              setDirection("fromArabic");
            }
          }}
        >
          <ArrowLeftRight size={15} />
          {direction === "fromArabic" ? "ئەرەب يېزىقىدىن" : "لاتىن يېزىقىدىن"}
        </Button>
      </div>
      <label className="field">
        {direction === "fromArabic" ? "ئۇيغۇرچە (ئەرەب يېزىقى)" : "Uyghurche (Latin)"}
        <textarea
          rows={4}
          maxLength={5000}
          dir={direction === "fromArabic" ? "rtl" : "ltr"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <div className="converter-outputs">
        {outputs.map((o) => (
          <div key={o.id} className="converter-output">
            <div>
              <strong>{o.label}</strong>
              <CopyButton text={o.text} />
            </div>
            <p dir={o.dir} lang={o.lang}>
              {o.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordNotebook() {
  const { value: words, setValue: setWords, error } = useLocal<SavedWord[]>(
    WORDS_KEY,
    [],
    validWords,
  );
  const [index, setIndex] = useState(0),
    [revealed, setRevealed] = useState(false);
  const queue = [...words].sort((a, b) => a.known - b.known);
  const card = queue[index % Math.max(1, queue.length)];
  return (
    <div className="lang-card">
      <h3>سۆز دەپتىرىم</h3>
      {!words.length ? (
        <p className="local-hint">
          ئوقۇش بېتىدە «سۆز لۇغىتى» نى ئېچىپ، سۆزلەرنى چېكىپ بۇ يەرگە قوشۇڭ.
        </p>
      ) : (
        <>
          <div className="flashcard" aria-live="polite">
            <strong lang="ug">{card.word}</strong>
            <span dir="ltr">{convertScript(card.word, "uly")}</span>
            {revealed ? (
              <p>
                يىلتىزى: <b>{card.root}</b>
                {card.ug && <> — {card.ug}</>}
                {card.en && (
                  <span dir="ltr" lang="en">
                    {card.en}
                  </span>
                )}
              </p>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setRevealed(true)}>
                <Eye size={15} /> مەنىسىنى كۆرۈش
              </Button>
            )}
          </div>
          <div className="editor-actions">
            <Button
              size="sm"
              onClick={() => {
                setWords((v) =>
                  v.map((w) => (w.word === card.word ? { ...w, known: w.known + 1 } : w)),
                );
                setIndex((i) => i + 1);
                setRevealed(false);
              }}
            >
              <ThumbsUp size={15} /> بىلىمەن
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIndex((i) => i + 1);
                setRevealed(false);
              }}
            >
              <RotateCcw size={15} /> يەنە كۆرەي
            </Button>
          </div>
          <ul className="word-list">
            {words.map((w) => (
              <li key={w.word}>
                <span lang="ug">{w.word}</span>
                <small>{w.en || w.ug}</small>
                <button
                  aria-label={`${w.word} — ئۆچۈرۈش`}
                  onClick={() => setWords((v) => v.filter((x) => x.word !== w.word))}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {error && <StorageNotice />}
    </div>
  );
}

export default function LanguageTools() {
  return (
    <section className="play-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ئۈچ يېزىق، بىر تىل</span>
          <h2>تىل ئۈستەلى</h2>
          <p>
            يېزىق ئالماشتۇرۇش، لاتىنچە يېزىپ ئۇيغۇرچىغا ئايلاندۇرۇش ۋە
            ساقلىغان سۆزلىرىڭىزنى تەكرارلاش.
          </p>
        </div>
      </div>
      <div className="lang-grid">
        <Converter />
        <WordNotebook />
      </div>
    </section>
  );
}
