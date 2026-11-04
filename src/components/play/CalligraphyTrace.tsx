import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft,
  Check,
  CircleDot,
  Eraser,
  Eye,
  EyeOff,
  NotebookPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { isRecord, strings } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import { formLabels, letterForms, letters } from "./letters";
import "./calligraphy.css";

type Point = { x: number; y: number };
type Progress = { best: Record<string, number>; paper: string[] };
const letterSet = new Set(letters.map((l) => l.letter));
const validProgress = (v: unknown): v is Progress =>
  isRecord(v) &&
  isRecord(v.best) &&
  Object.entries(v.best).every(
    ([k, n]) =>
      letterSet.has(k) &&
      typeof n === "number" &&
      Number.isFinite(n) &&
      n >= 0 &&
      n <= 100,
  ) &&
  strings(v.paper) &&
  v.paper.every((k) => letterSet.has(k));

const FONT = '"UKIJ Qolyazma", "Noto Naskh Arabic", serif';
const PASS = 70;
const NEAR = 7; // px of slack around the ink when checking coverage
const FAR = 16; // px around the glyph before ink counts as "outside"

/** Shared glyph layout so the visible guide and the scoring mask line up. */
function layout(ctx: CanvasRenderingContext2D, text: string, w: number, h: number) {
  let size = h * 0.62;
  ctx.font = `${size}px ${FONT}`;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  let m = ctx.measureText(text);
  const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const fit = Math.min(1, (w * 0.78) / (width || 1), (h * 0.78) / (height || 1));
  if (fit < 1) {
    size *= fit;
    ctx.font = `${size}px ${FONT}`;
    m = ctx.measureText(text);
  }
  const x =
    w / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
  const y = h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  return { x, y, size, brush: Math.max(6, Math.min(20, size * 0.075)) };
}

function strokePath(ctx: CanvasRenderingContext2D, strokes: Point[][], w: number, h: number) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    if (!s.length) continue;
    ctx.beginPath();
    ctx.moveTo(s[0].x * w, s[0].y * h);
    if (s.length === 1) ctx.lineTo(s[0].x * w + 0.01, s[0].y * h);
    for (const p of s.slice(1)) ctx.lineTo(p.x * w, p.y * h);
    ctx.stroke();
  }
}

/** Fraction of glyph pixels covered by ink, minus a penalty for ink far from the glyph. */
function scoreTrace(text: string, strokes: Point[][], w: number, h: number) {
  const k = Math.min(1, 360 / w);
  const W = Math.max(1, Math.round(w * k)),
    H = Math.max(1, Math.round(h * k));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.scale(k, k);
  const read = (draw: () => void) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ctx.strokeStyle = "#000";
    draw();
    return ctx.getImageData(0, 0, W, H).data;
  };
  const g = layout(ctx, text, w, h);
  const glyph = read(() => ctx.fillText(text, g.x, g.y));
  const near = read(() => {
    ctx.lineWidth = g.brush + NEAR * 2;
    strokePath(ctx, strokes, w, h);
  });
  const ink = read(() => {
    ctx.lineWidth = g.brush;
    strokePath(ctx, strokes, w, h);
  });
  const zone = read(() => {
    layout(ctx, text, w, h);
    ctx.fillText(text, g.x, g.y);
    ctx.lineWidth = FAR * 2;
    ctx.lineJoin = "round";
    ctx.strokeText(text, g.x, g.y);
  });
  let glyphPx = 0,
    covered = 0,
    inkPx = 0,
    outside = 0;
  for (let i = 3; i < glyph.length; i += 4) {
    if (glyph[i] > 96) {
      glyphPx++;
      if (near[i] > 32) covered++;
    }
    if (ink[i] > 96) {
      inkPx++;
      if (zone[i] < 32) outside++;
    }
  }
  if (!glyphPx || !inkPx) return { score: 0, outside: 0 };
  const coverage = covered / glyphPx,
    out = outside / inkPx;
  const score = Math.max(0, Math.min(1, coverage - Math.max(0, out - 0.15)));
  return { score: Math.round(score * 100), outside: out };
}

function feedback(score: number, outside: number) {
  const main =
    score >= 90
      ? "ئاجايىپ! ھەرپ ناھايىتى چىرايلىق يېزىلدى."
      : score >= PASS
        ? "بەللى! ھەرپنى مۇۋەپپەقىيەتلىك يازدىڭىز."
        : score >= 40
          ? "ياخشى باشلىنىش! ئىز بويىچە يەنە بىر قېتىم سىناپ بېقىڭ."
          : "ئالدىرىماڭ، ھەرپنىڭ سىزىقلىرى ئۈستىدە ئاستا يۈرۈڭ.";
  return outside > 0.25
    ? `${main} بىر قىسىم سىزىقلار ھەرپتىن سىرتقا چىقىپ كەتتى.`
    : main;
}

export default function CalligraphyTrace({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const {
    value: progress,
    setValue: setProgress,
    error,
  } = useLocal<Progress>(
    "pichirlash-trace-v1",
    { best: {}, paper: [] },
    validProgress,
  );
  const [index, setIndex] = useState(0);
  const [form, setForm] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [showDots, setShowDots] = useState(false);
  const [fontReady, setFontReady] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [result, setResult] = useState<{ score: number; text: string } | null>(
    null,
  );
  const [size, setSize] = useState({ w: 0, h: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const drawing = useRef<number | null>(null);
  const l = letters[index];
  const target = form ?? l.letter;

  useEffect(() => {
    let alive = true;
    const done = () => alive && setFontReady(true);
    if (typeof document === "undefined" || !document.fonts) done();
    else
      document.fonts
        .load(`64px "UKIJ Qolyazma"`, letters.map((x) => x.letter).join(""))
        .then(done, done);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      setSize({ w, h: Math.round(Math.min(420, Math.max(220, w * 0.68))) });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const brushFor = useCallback(
    (ctx: CanvasRenderingContext2D) => layout(ctx, target, size.w, size.h).brush,
    [target, size],
  );

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(size.w * dpr)) c.width = Math.round(size.w * dpr);
    if (c.height !== Math.round(size.h * dpr)) c.height = Math.round(size.h * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    const g = layout(ctx, target, size.w, size.h);
    // writing lines
    ctx.strokeStyle = "rgba(97, 116, 83, 0.18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 7]);
    for (const f of [0.28, 0.5, 0.72]) {
      ctx.beginPath();
      ctx.moveTo(12, size.h * f);
      ctx.lineTo(size.w - 12, size.h * f);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (fontReady && showGuide) {
      ctx.fillStyle = "rgba(97, 116, 83, 0.17)";
      ctx.fillText(target, g.x, g.y);
    }
    if (fontReady && showDots) {
      const off = document.createElement("canvas");
      off.width = size.w;
      off.height = size.h;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (o) {
        layout(o, target, size.w, size.h);
        o.fillText(target, g.x, g.y);
        const data = o.getImageData(0, 0, size.w, size.h).data;
        const step = Math.max(9, Math.round(g.brush * 1.4));
        ctx.fillStyle = "rgba(196, 122, 74, 0.75)";
        for (let y = step / 2; y < size.h; y += step)
          for (let x = step / 2; x < size.w; x += step)
            if (data[(Math.floor(y) * size.w + Math.floor(x)) * 4 + 3] > 128) {
              ctx.beginPath();
              ctx.arc(x, y, 2.4, 0, Math.PI * 2);
              ctx.fill();
            }
      }
    }
    ctx.strokeStyle = "#353e34";
    ctx.lineWidth = g.brush;
    strokePath(ctx, strokes.current, size.w, size.h);
  }, [size, target, fontReady, showGuide, showDots]);

  useEffect(redraw, [redraw]);

  const clear = () => {
    strokes.current = [];
    setHasInk(false);
    setResult(null);
    redraw();
  };
  const pick = (i: number) => {
    setIndex(i);
    setForm(null);
    strokes.current = [];
    setHasInk(false);
    setResult(null);
  };

  const point = (e: { clientX: number; clientY: number }): Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  };
  const down = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.button > 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = e.pointerId;
    strokes.current.push([point(e)]);
    setHasInk(true);
    setResult(null);
    redraw();
  };
  const move = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drawing.current !== e.pointerId) return;
    const stroke = strokes.current[strokes.current.length - 1];
    const ctx = canvasRef.current?.getContext("2d");
    if (!stroke || !ctx) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const pts = (events.length ? events : [e.nativeEvent]).map(point);
    ctx.strokeStyle = "#353e34";
    ctx.lineWidth = brushFor(ctx);
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.beginPath();
    const last = stroke[stroke.length - 1];
    ctx.moveTo(last.x * size.w, last.y * size.h);
    for (const p of pts) {
      ctx.lineTo(p.x * size.w, p.y * size.h);
      stroke.push(p);
    }
    ctx.stroke();
  };
  const up = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drawing.current === e.pointerId) drawing.current = null;
  };

  const check = () => {
    const r = scoreTrace(target, strokes.current, size.w, size.h);
    if (!r) return;
    setResult({ score: r.score, text: feedback(r.score, r.outside) });
    setProgress((p) => ({
      ...p,
      best: { ...p.best, [l.letter]: Math.max(p.best[l.letter] ?? 0, r.score) },
    }));
    if (r.score >= PASS) onReward(`trace:${l.letter}`, `${l.letter} ھەرپى مەشىقى`);
  };
  const paper = () => {
    setProgress((p) =>
      p.paper.includes(l.letter) ? p : { ...p, paper: [...p.paper, l.letter] },
    );
    onReward(`trace:${l.letter}`, `${l.letter} ھەرپى مەشىقى`);
  };
  const doneCount = letters.filter(
    (x) => (progress.best[x.letter] ?? 0) >= PASS || progress.paper.includes(x.letter),
  ).length;

  return (
    <section className="play-panel trace-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ھەرپلەرنى قەلەم بىلەن سىزايلى</span>
          <h2>خەتتاتلىق مەشىقى</h2>
          <p>
            بىر ھەرپنى تاللاڭ، سۇس ئىزنىڭ ئۈستىدە بارمىقىڭىز ياكى قەلەم بىلەن
            يېزىڭ، ئاندىن «تەكشۈرۈش» نى بېسىڭ.
          </p>
        </div>
        <Sticker name="notebook" size={86} />
      </div>

      <p className="trace-count">
        <strong>{doneCount}</strong> / {letters.length} ھەرپ مەشىق قىلىندى
      </p>
      <div className="trace-picker" role="group" aria-label="ھەرپ تاللاش">
        {letters.map((x, i) => {
          const done =
            (progress.best[x.letter] ?? 0) >= PASS ||
            progress.paper.includes(x.letter);
          return (
            <button
              type="button"
              key={x.letter}
              aria-pressed={i === index}
              aria-label={`${x.letter} — ${x.name}${done ? "، مەشىق قىلىندى" : ""}`}
              className={done ? "done" : undefined}
              onClick={() => pick(i)}
            >
              <span className="trace-pick-letter">{x.letter}</span>
              <span className="trace-pick-name">{x.name}</span>
            </button>
          );
        })}
      </div>

      <div className="trace-layout">
        <div className="trace-info">
          <div className="trace-big" aria-hidden="true">
            {l.letter}
          </div>
          <p className="trace-name">
            ھەرپ نامى: <strong>{l.name}</strong>
          </p>
          <div className="trace-forms" role="group" aria-label="ھەرپنىڭ شەكىللىرى">
            {letterForms(l).map((f) => (
              <button
                type="button"
                key={f.form}
                aria-pressed={target === f.text}
                aria-label={`${formLabels[f.form]} شەكلىنى سىزىش`}
                onClick={() => {
                  setForm(f.text);
                  strokes.current = [];
                  setHasInk(false);
                  setResult(null);
                }}
              >
                <span className="trace-form-glyph">{f.text}</span>
                <span>{formLabels[f.form]}</span>
              </button>
            ))}
          </div>
          {l.join === "right" && (
            <p className="trace-note">
              بۇ ھەرپ كېيىنكى ھەرپكە ئۇلانمايدۇ، شۇڭا ئىككىلا شەكلى بار.
            </p>
          )}
          {form && (
            <Button variant="ghost" size="sm" onClick={() => pick(index)}>
              پۈتۈن ھەرپكە قايتىش
            </Button>
          )}
          <p className="trace-word">
            <span aria-hidden="true">{l.icon}</span>
            مىسال: <strong>{l.word}</strong>
          </p>
        </div>

        <div className="trace-board">
          <div className="trace-canvas-wrap" ref={wrapRef}>
            <canvas
              ref={canvasRef}
              className="trace-canvas"
              style={{ width: "100%", height: size.h || 260 }}
              role="img"
              aria-label={`${target} ھەرپىنى سىزىش تاختىسى`}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              onLostPointerCapture={up}
            />
            {!fontReady && (
              <p className="trace-loading">خەت نۇسخىسى يۈكلىنىۋاتىدۇ…</p>
            )}
          </div>
          <div className="editor-actions trace-actions">
            <Button onClick={check} disabled={!hasInk || !fontReady}>
              <Check size={17} /> تەكشۈرۈش
            </Button>
            <Button variant="outline" onClick={clear} disabled={!hasInk}>
              <Eraser size={17} /> ئۆچۈرۈش
            </Button>
            <Button
              variant="outline"
              aria-pressed={!showGuide}
              onClick={() => setShowGuide((v) => !v)}
            >
              {showGuide ? <EyeOff size={17} /> : <Eye size={17} />}
              {showGuide ? "ئىزنى يوشۇرۇش" : "ئىزنى كۆرسىتىش"}
            </Button>
            <Button
              variant="outline"
              aria-pressed={showDots}
              onClick={() => setShowDots((v) => !v)}
            >
              <CircleDot size={17} /> چېكىت ئىشارىسى
            </Button>
            <Button variant="ghost" onClick={() => pick((index + 1) % letters.length)}>
              كېيىنكى ھەرپ <ArrowLeft size={17} />
            </Button>
          </div>
          <div role="status" aria-live="polite" className="trace-status">
            {result && (
              <div className={`trace-result ${result.score >= PASS ? "pass" : ""}`}>
                <strong>
                  <bdi dir="ltr">{result.score}%</bdi>
                </strong>
                <span>{result.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <details className="trace-help">
        <summary>نومۇر قانداق ھېسابلىنىدۇ؟</summary>
        <p>
          ھەرپ ئىزىنىڭ قانچىلىك قىسمىنى سىزىقىڭىز يېپىپ ئۆتكەنلىكى ئۆلچىنىدۇ.
          ھەرپتىن يىراق سىزىلغان سىزىقلار نومۇرنى سەل تۆۋەنلىتىدۇ.{" "}
          <bdi dir="ltr">{PASS}%</bdi> ياكى ئۇنىڭدىن يۇقىرى بولسا، مەشىق
          مۇۋەپپەقىيەتلىك ھېسابلىنىدۇ.
        </p>
        <p>
          ئەگەر ئېكراندا سىزىش قولايسىز بولسا، ھەرپنى دەپتىرىڭىزگە بىر نەچچە
          قېتىم يېزىپ مەشىق قىلىڭ.
        </p>
        <Button variant="outline" onClick={paper}>
          <NotebookPen size={17} />
          {progress.paper.includes(l.letter)
            ? "قەغەزدە مەشىق قىلىندى"
            : `${l.letter} نى قەغەزدە مەشىق قىلدىم`}
        </Button>
      </details>
      <p className="local-hint">
        ئەڭ ياخشى نەتىجىلىرىڭىز مۇشۇ توركۆرگۈچتە ساقلىنىدۇ.
      </p>
      {error && <StorageNotice />}
    </section>
  );
}
