import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, Heart, Pin, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Art } from "@/components/demo/ArtLibrary";
import type { DemoEntry } from "@/components/demo/Studio";
import { labels } from "@/data/content";
import { isRecord } from "./model";
import { loadLocal, useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
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
}: {
  entry: DemoEntry;
  saved: boolean;
  onSave: () => void;
  onFinish: () => void;
  onPin: (quote: string) => void;
}) {
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
      <h2>{entry.title}</h2>
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
        style={{ fontSize: settings.size, lineHeight: settings.line }}
        onScroll={() => {
          if (!restored.current) return;
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(record);
        }}
      >
        {entry.body.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
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
