import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { pickVoice } from "@/components/features/useReadAloud";
import type { VoiceMode } from "@/components/features/useReadAloud";
import { convertScript } from "@/lib/uyghur/script";
import { formLabels, letterForms } from "./letters";
import {
  alphabetPages,
  emptyAlphabetProgress,
  validAlphabetProgress,
} from "./alphabetData";
import type { AlphabetProgress } from "./alphabetData";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import "./alphabet.css";

const TOTAL = alphabetPages.length;
const latin = (text: string) => convertScript(text, "uly").toLowerCase();

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
      mode.kind === "approx" ? latin(text).replace(/'/g, "") : text,
    );
    utter.voice = mode.voice;
    utter.lang = mode.voice.lang;
    utter.rate = 0.75;
    speechSynthesis.speak(utter);
  };
  return { available: mode.kind !== "none", approx: mode.kind === "approx", speak };
}

export default function AlphabetBook({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const {
    value: progress,
    setValue: setProgress,
    error,
  } = useLocal<AlphabetProgress>(
    "pichirlash-alphabet-v1",
    emptyAlphabetProgress,
    validAlphabetProgress,
  );
  const speaker = useSpeaker();
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [flip, setFlip] = useState<"next" | "prev">("next");
  const index = progress.page;
  const page = alphabetPages[index];
  const learned = progress.learned.includes(page.letter);
  const count = progress.learned.length;

  const go = (to: number) => {
    const next = Math.max(0, Math.min(TOTAL - 1, to));
    if (next === index) return;
    setFlip(next > index ? "next" : "prev");
    setProgress((p) => ({ ...p, page: next }));
  };
  const toggleLearned = () => {
    if (learned) {
      setProgress((p) => ({ ...p, learned: p.learned.filter((l) => l !== page.letter) }));
      return;
    }
    const all = [...progress.learned, page.letter];
    setProgress((p) => ({ ...p, learned: [...new Set([...p.learned, page.letter])] }));
    onReward(`alphabet:${page.letter}`, `ئېلىپبە: «${page.letter}» ھەرپى`);
    if (all.length >= TOTAL) onReward("alphabet:complete", "ئېلىپبە كىتابى — تامام");
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.altKey || e.ctrlKey || e.metaKey) return;
    // Right-to-left book: the next page lies to the left.
    const moves: Record<string, number> = {
      ArrowLeft: index + 1,
      ArrowRight: index - 1,
      Home: 0,
      End: TOTAL - 1,
    };
    if (moves[e.key] === undefined) return;
    e.preventDefault();
    go(moves[e.key]);
  };
  const onPointerDown = (e: PointerEvent) => {
    swipe.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    // Swiping right pulls in the page on the left, which is the next one.
    go(dx > 0 ? index + 1 : index - 1);
  };

  return (
    <section className="play-panel abc-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">رەسىملىك كىتاب</span>
          <h2>ئېلىپبە كىتابى</h2>
          <p>
            ئۇيغۇر ئېلىپبەسىدە 32 ھەرپ بار. ھەر بەتتە بىر ھەرپ، ئۇنىڭ نامى، يېزىلىش شەكىللىرى
            ۋە مىسال سۆزلەر بار. ئۆگىنىۋالغان ھەرپلەرگە بەلگە قويۇڭ.
          </p>
        </div>
        <Sticker name="bunny" size={86} />
      </div>

      <div className="abc-meter">
        <span>
          ئۆگىنىلگەن ھەرپ: <strong>{count}</strong> / {TOTAL}
        </span>
        <span className="abc-meter-bar" aria-hidden="true">
          <span style={{ width: `${(count / TOTAL) * 100}%` }} />
        </span>
      </div>

      <div className="abc-book" onKeyDown={onKey}>
        <article
          className="abc-page"
          tabIndex={0}
          aria-roledescription="بەت"
          aria-label={`${index + 1}-بەت: «${page.letter}» ھەرپى`}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipe.current = null;
          }}
        >
          <div key={page.letter} className={`abc-spread flip-${flip}`}>
          <div className="abc-letter-side">
            <span className="abc-page-no">
              {index + 1} / {TOTAL}
            </span>
            <p className="abc-letter" lang="ug">
              {page.letter}
            </p>
            <p className="abc-name">
              نامى: <strong lang="ug">{page.name}</strong>
              <span className="abc-latin" lang="ug-Latn" dir="ltr">
                {latin(page.base)}
              </span>
            </p>
            {speaker.available && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => speaker.speak(page.name)}
                aria-label={`ھەرپنىڭ نامىنى ئاڭلاش: ${page.name}`}
              >
                <Volume2 size={16} aria-hidden="true" /> ئاڭلاش
              </Button>
            )}
            <h3 className="abc-sub">يېزىلىش شەكىللىرى</h3>
            <ul className="abc-forms">
              {letterForms(page).map((f) => (
                <li key={f.form}>
                  <span className="abc-form-glyph" lang="ug">
                    {f.text}
                  </span>
                  <span className="abc-form-label">{formLabels[f.form]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="abc-word-side">
            {page.sticker && (
              <div className="abc-picture">
                <Sticker name={page.sticker} size={120} seed={page.letter} />
              </div>
            )}
            <h3 className="abc-sub">مىسال سۆزلەر</h3>
            <ul className="abc-words">
              {page.words.map((w) => (
                <li key={w.word}>
                  <span className="abc-word" lang="ug">
                    {w.word}
                  </span>
                  <span className="abc-latin" lang="ug-Latn" dir="ltr">
                    {latin(w.word)}
                  </span>
                  {speaker.available && (
                    <button
                      type="button"
                      className="abc-listen"
                      onClick={() => speaker.speak(w.word)}
                      aria-label={`ئاڭلاش: ${w.word}`}
                    >
                      <Volume2 size={17} aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {page.note && <p className="abc-note">{page.note}</p>}
            <Button
              className="abc-learned"
              variant={learned ? "secondary" : "default"}
              aria-pressed={learned}
              onClick={toggleLearned}
            >
              <Check size={17} aria-hidden="true" />
              {learned ? "ئۆگەندىم!" : "بۇ ھەرپنى ئۆگەندىم"}
            </Button>
          </div>
          </div>
        </article>

        <div className="abc-nav">
          <Button variant="outline" disabled={index === 0} onClick={() => go(index - 1)}>
            <ArrowRight size={17} aria-hidden="true" /> ئالدىنقى بەت
          </Button>
          <p role="status" aria-live="polite" className="abc-status">
            {index + 1} / {TOTAL} · «{page.letter}»
          </p>
          <Button variant="outline" disabled={index === TOTAL - 1} onClick={() => go(index + 1)}>
            كېيىنكى بەت <ArrowLeft size={17} aria-hidden="true" />
          </Button>
        </div>

        <nav className="abc-dots" aria-label="ئېلىپبە بەتلىرى">
          {alphabetPages.map((p, i) => {
            const done = progress.learned.includes(p.letter);
            return (
              <button
                key={p.letter}
                type="button"
                lang="ug"
                className={done ? "done" : ""}
                aria-current={i === index ? "page" : undefined}
                aria-label={`«${p.letter}» ھەرپى${done ? "، ئۆگىنىلدى" : ""}`}
                onClick={() => go(i)}
              >
                {p.letter}
              </button>
            );
          })}
        </nav>
      </div>

      <div role="status" aria-live="polite">
        {count === TOTAL && (
          <p className="abc-complete">
            تەبرىكلەيمىز! ئېلىپبەدىكى 32 ھەرپنىڭ ھەممىسىنى ئۆگەندىڭىز.
          </p>
        )}
      </div>
      <p className="local-hint">
        بەت ئۆرۈش ئۈچۈن كۇنۇپكا تاختىسىدىكى يۆنىلىش كۇنۇپكىلىرىنى ئىشلىتىڭ ياكى بارمىقىڭىز بىلەن
        سۈرۈڭ. ھەر بىر ھەرپنى ئۆگەنسىڭىز باغچىڭىزغا بىر گۈل قوشۇلىدۇ.
      </p>
      {speaker.approx && (
        <p className="local-hint">
          ئۈسكۈنىڭىزدە ئۇيغۇرچە ئاۋاز يوق، شۇڭا تۈركچە ئاۋاز بىلەن تەخمىنىي ئوقۇلىدۇ.
        </p>
      )}
      {error && <StorageNotice />}
    </section>
  );
}
