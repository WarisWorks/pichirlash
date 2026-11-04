import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Bookmark,
  BookA,
  Check,
  Heart,
  Pin,
  Minus,
  Plus,
  Pause,
  Play,
  Square,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Art } from "@/components/demo/ArtLibrary";
import type { DemoEntry } from "@/components/demo/Studio";
import { labels } from "@/data/content";
import { isRecord } from "./model";
import { loadLocal, useLocal } from "./useLocal";
import { ScriptSwitch, StorageNotice, useScript } from "./Experience";
import { localDay } from "./model";
import WordInfo from "@/components/features/WordInfo";
import { useReadAloud } from "@/components/features/useReadAloud";
import { WORDS_KEY, addWord, validWords } from "@/components/features/wordStore";
import type { SavedWord } from "@/components/features/wordStore";
import { convertScript } from "@/lib/uyghur/script";
const VoiceNotes = lazy(() => import("./VoiceNotes"));
/** Split a paragraph into words, keeping whitespace so the text reads unchanged. */
const tokens = (text: string) => text.split(/(\s+)/).filter((t) => t !== "");
type ReaderSettings = { size: number; line: number };
type Positions = Record<string, number>;
const validSettings = (v: unknown): v is ReaderSettings =>
  isRecord(v) &&
  typeof v.size === "number" &&
  v.size >= 18 &&
  v.size <= 34 &&
  typeof v.line === "number" &&
  v.line >= 1.6 &&
  v.line <= 2.6;
const validPositions = (v: unknown): v is Positions =>
  isRecord(v) &&
  Object.values(v).every((x) => typeof x === "number" && x >= 0 && x <= 1);
export default function ReadingRoom({
  entry,
  saved,
  onSave,
  onFinish,
  onPin,
  onReadDay,
  onReward,
}: {
  entry: DemoEntry;
  saved: boolean;
  onSave: () => void;
  onFinish: () => void;
  onPin: (quote: string) => void;
  onReadDay?: () => void;
  onReward?: (id: string, label: string) => void;
}) {
  const { script, dir, lang } = useScript();
  const [lookup, setLookup] = useState(false),
    [word, setWord] = useState(""),
    [voiceOpen, setVoiceOpen] = useState(false);
  const { value: words, setValue: setWords } = useLocal<SavedWord[]>(
    WORDS_KEY,
    [],
    validWords,
  );
  const paragraphs = entry.body.split("\n\n").map(tokens);
  const spokenWords = paragraphs.map((p) => p.filter((t) => !/^\s+$/.test(t)));
  const aloud = useReadAloud(spokenWords);
  const countedDay = useRef(false);
  const countDay = () => {
    if (countedDay.current) return;
    countedDay.current = true;
    onReadDay?.();
  };
  const {
    value: settings,
    setValue: setSettings,
    error: settingsError,
  } = useLocal<ReaderSettings>(
    "pichirlash-reader-settings-v1",
    { size: 23, line: 2 },
    validSettings,
  );
  const {
    value: positions,
    setValue: setPositions,
    error,
  } = useLocal<Positions>(
    "pichirlash-reading-positions-v1",
    {},
    validPositions,
  );
  const [progress, setProgress] = useState(positions[entry.id] ?? 0),
    [status, setStatus] = useState("");
  const content = useRef<HTMLDivElement>(null),
    restored = useRef(false),
    frame = useRef(0);
  useEffect(() => {
    let cancelled = false;
    const saved =
      loadLocal<Positions>(
        "pichirlash-reading-positions-v1",
        {},
        validPositions,
      )[entry.id] ?? 0;
    void document.fonts.ready.then(() => {
      if (cancelled || !content.current) return;
      const el = content.current;
      el.scrollTop = saved * (el.scrollHeight - el.clientHeight);
      restored.current = true;
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame.current);
    };
  }, [entry.id]);
  const record = () => {
    const el = content.current;
    if (!el) return;
    const ratio =
      el.scrollHeight <= el.clientHeight
        ? 0
        : el.scrollTop / (el.scrollHeight - el.clientHeight);
    const bounded = Math.max(0, Math.min(1, ratio));
    setProgress(bounded);
    if (bounded >= 0.6) countDay();
    setPositions((v) => ({
      ...Object.fromEntries(Object.entries(v).slice(-99)),
      [entry.id]: bounded,
    }));
  };
  const pin = () => {
    const selection = window.getSelection();
    const quote =
      selection &&
      selection.rangeCount &&
      content.current?.contains(selection.getRangeAt(0).commonAncestorContainer)
        ? selection.toString().trim()
        : "";
    onPin((quote || entry.body.slice(0, 140)).slice(0, 140));
  };
  return (
    <div className="reading-room">
      <span className="eyebrow">
        {labels[entry.type]} · {entry.time}
      </span>
      {entry.art && <Art art={entry.art} size={80} />}
      <h2 dir={dir} lang={lang}>
        {convertScript(entry.title, script)}
      </h2>
      <div className="reading-tools">
        <ScriptSwitch compact />
        <Button
          size="sm"
          variant={lookup ? "default" : "outline"}
          aria-pressed={lookup}
          onClick={() => {
            setLookup((v) => !v);
            setWord("");
          }}
        >
          <BookA size={16} /> سۆز لۇغىتى
        </Button>
        {aloud.supported && aloud.mode.kind !== "none" && (
          <span className="read-aloud" role="group" aria-label="ئۈنلۈك ئوقۇش">
            {aloud.state === "playing" ? (
              <Button size="sm" variant="outline" onClick={aloud.pause}>
                <Pause size={16} /> توختىتىش
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={aloud.play}>
                <Play size={16} />
                {aloud.state === "paused" ? "داۋاملاشتۇرۇش" : "ئۈنلۈك ئوقۇش"}
              </Button>
            )}
            {aloud.state !== "idle" && (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="ئوقۇشنى توختىتىش"
                onClick={aloud.stop}
              >
                <Square size={14} />
              </Button>
            )}
            <label className="rate">
              سۈرئەت
              <input
                type="range"
                min={0.6}
                max={1.2}
                step={0.05}
                value={aloud.rate}
                onChange={(e) => aloud.setRate(+e.target.value)}
              />
            </label>
          </span>
        )}
        <Button
          size="sm"
          variant={voiceOpen ? "default" : "ghost"}
          aria-pressed={voiceOpen}
          onClick={() => setVoiceOpen((v) => !v)}
        >
          <Mic size={16} /> ئائىلە ئاۋازى
        </Button>
      </div>
      {aloud.mode.kind === "approx" && aloud.state !== "idle" && (
        <p className="local-hint">
          ئۈسكۈنىڭىزدە ئۇيغۇرچە ئاۋاز يوق، شۇڭا لاتىن يېزىقىدىكى تېكىست
          يېقىن تىلدىكى ئاۋاز بىلەن ئوقۇلۇۋاتىدۇ — تەلەپپۇز تەخمىنىي.
        </p>
      )}
      {aloud.supported && aloud.mode.kind === "none" && (
        <p className="local-hint">
          بۇ توركۆرگۈچتە ئۈنلۈك ئوقۇيدىغان ئاۋاز تېپىلمىدى.
        </p>
      )}
      <div className="reading-controls">
        <span>يېزىق چوڭلۇقى</span>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="يېزىقنى كىچىكلىتىش"
          disabled={settings.size <= 18}
          onClick={() =>
            setSettings({ ...settings, size: Math.max(18, settings.size - 2) })
          }
        >
          <Minus size={16} />
        </Button>
        <span>{settings.size}</span>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="يېزىقنى چوڭايتىش"
          disabled={settings.size >= 34}
          onClick={() =>
            setSettings({ ...settings, size: Math.min(34, settings.size + 2) })
          }
        >
          <Plus size={16} />
        </Button>
        <label>
          قۇر ئارىلىقى
          <select
            value={settings.line}
            onChange={(e) =>
              setSettings({ ...settings, line: +e.target.value })
            }
          >
            <option value={1.6}>يىغىنچاق</option>
            <option value={2}>ئوتتۇرا</option>
            <option value={2.6}>كەڭ</option>
          </select>
        </label>
      </div>
      <div
        className="focus-reading"
        tabIndex={0}
        ref={content}
        aria-label="ئوقۇش بوشلۇقى"
        dir={dir}
        lang={lang}
        data-lookup={lookup || undefined}
        style={{ fontSize: settings.size, lineHeight: settings.line }}
        onScroll={() => {
          if (!restored.current) return;
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(record);
        }}
      >
        {paragraphs.map((parts, i) => {
          const shown = tokens(convertScript(parts.join(""), script));
          const aligned = shown.length === parts.length;
          let wordIndex = -1;
          return (
            <p key={i}>
              {parts.map((part, j) => {
                const text = aligned ? shown[j] : convertScript(part, script);
                if (/^\s+$/.test(part)) return text;
                wordIndex++;
                const speaking =
                  aloud.current?.[0] === i && aloud.current[1] === wordIndex;
                return lookup ? (
                  <button
                    key={j}
                    type="button"
                    className="reading-word"
                    aria-pressed={word === part}
                    data-speaking={speaking || undefined}
                    onClick={() => setWord(part)}
                  >
                    {text}
                  </button>
                ) : (
                  <span
                    key={j}
                    className="reading-word"
                    data-speaking={speaking || undefined}
                  >
                    {text}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
      {lookup && !word && (
        <p className="local-hint">بىر سۆزنى چېكىڭ — يىلتىزى، قوشۇمچىلىرى ۋە مەنىسى كۆرۈنىدۇ.</p>
      )}
      {lookup && word && (
        <WordInfo
          word={word}
          saved={words.some((w) => w.word === word)}
          onClose={() => setWord("")}
          onSave={(root, ug, en) => {
            const next = addWord(words, { word, root, ug, en, day: localDay(), known: 0 });
            setWords(next);
            if (next.length >= 5) onReward?.("words:5", "5 يېڭى سۆز");
            if (next.length >= 20) onReward?.("words:20", "20 يېڭى سۆز");
          }}
        />
      )}
      {voiceOpen && (
        <Suspense fallback={<p role="status">ئاۋاز بۆلىكى ئېچىلىۋاتىدۇ…</p>}>
          <VoiceNotes
            compact
            entryId={entry.id}
            entryTitle={entry.title}
            onReward={onReward}
          />
        </Suspense>
      )}
      <div className="reading-bookmark">
        <Bookmark size={15} />
        <span>
          ئوقۇغان ئورنىڭىز ئاپتوماتىك ساقلىنىدۇ.{" "}
          {Math.round(progress * 100).toLocaleString("en-US")}%
        </span>
      </div>
      <div className="editor-actions">
        <Button variant="outline" onClick={onSave}>
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
          {saved ? "ساقلاندى" : "ياقتۇردۇم"}
        </Button>
        <Button
          variant="outline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={pin}
        >
          <Pin size={16} /> نەقىلنى ئۈستەلگە قاداش
        </Button>
        <Button
          onClick={() => {
            setProgress(1);
            setPositions((v) => ({ ...v, [entry.id]: 1 }));
            onFinish();
            countDay();
            setStatus("ئوقۇش تاماملاندى. يەنە بىر ياخشى قەدەم!");
          }}
        >
          <Check size={16} /> ئوقۇپ بولدۇم
        </Button>
      </div>
      <p className="local-hint">
        نەقىل ئۈچۈن بىر پارچە تېكىست تاللاڭ؛ تاللىمىسىڭىز يازمىنىڭ بېشىدىن
        قادىلىدۇ.
      </p>
      <p role="status">{status}</p>
      {(error || settingsError) && <StorageNotice />}
    </div>
  );
}
