import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  Headphones,
  Mic,
  Pencil,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { localDay, uid } from "./model";
import {
  MAX_SECONDS,
  VoiceStoreError,
  audioExtension,
  deleteNote,
  formatDuration,
  getAudio,
  listNotes,
  pickMimeType,
  renameNote,
  saveNote,
  type VoiceNote,
} from "./voiceStore";
import "./voiceNotes.css";

type Phase = "idle" | "starting" | "recording" | "review" | "saving";
type Recorded = {
  blob: Blob;
  url: string;
  duration: number;
  type: string;
  created: number;
};
type Support = "ok" | "insecure" | "unsupported";

const now = () => Date.now();
const TITLE_MAX = 80,
  SPEAKER_MAX = 40;

function detectSupport(): Support {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return "unsupported";
  if (!window.isSecureContext) return "insecure";
  if (
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== "function" ||
    typeof MediaRecorder === "undefined"
  )
    return "unsupported";
  return "ok";
}

const supportMessage: Record<Exclude<Support, "ok">, string> = {
  insecure:
    "ئاۋاز خاتىرىلەش پەقەت بىخەتەر (https) ئادرېستا ئىشلەيدۇ. بەتنى https ئارقىلىق ئېچىپ قايتا سىناڭ.",
  unsupported:
    "بۇ توركۆرگۈچ ئاۋاز خاتىرىلەشنى قوللىمايدۇ. يېڭىراق بىر توركۆرگۈچتە سىناپ بېقىڭ.",
};

function micMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError")
    return "مىكروفونغا ئىجازەت بېرىلمىدى. توركۆرگۈچ تەڭشىكىدىن بۇ بەتكە مىكروفون ئىجازىتى بېرىپ، قايتا سىناڭ.";
  if (name === "SecurityError") return supportMessage.insecure;
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "مىكروفون تېپىلمىدى. مىكروفوننى ئۇلاپ قايتا سىناڭ.";
  if (name === "NotReadableError" || name === "AbortError")
    return "مىكروفوننى باشقا بىر پروگرامما ئىشلىتىۋاتقان بولۇشى مۇمكىن. ئۇنى تاقاپ قايتا سىناڭ.";
  return "خاتىرىلەشنى باشلىغىلى بولمىدى. قايتا سىناڭ.";
}

function storeMessage(error: unknown): string {
  const code = error instanceof VoiceStoreError ? error.code : "failed";
  if (code === "unavailable")
    return "بۇ توركۆرگۈچتە ئاۋازنى ساقلىغىلى بولمايدۇ (مەخپىي كۆزنەكتە بولۇشىڭىز مۇمكىن). خاتىرىنى ھۆججەت قىلىپ چۈشۈرۈۋېلىڭ.";
  if (code === "quota")
    return "ئۈسكۈنىدە بوشلۇق يېتىشمىدى. كونا خاتىرىلەرنى چۈشۈرۈپ ئۆچۈرۈڭ، ئاندىن قايتا سىناڭ.";
  if (code === "missing") return "بۇ خاتىرىنىڭ ئاۋازى تېپىلمىدى.";
  return "ئاۋاز ئامبىرىدا خاتالىق كۆرۈلدى. قايتا سىناڭ.";
}

const fileName = (note: Pick<VoiceNote, "created" | "type">) =>
  `pichirlash-voice-${localDay(new Date(note.created))}.${audioExtension(note.type)}`;

export default function VoiceNotes({
  entryId,
  entryTitle,
  compact = false,
  onReward,
}: {
  entryId?: string;
  entryTitle?: string;
  compact?: boolean;
  onReward?: (id: string, label: string) => void;
}) {
  const [support] = useState<Support>(detectSupport);
  const [phase, setPhase] = useState<Phase>("idle"),
    [elapsed, setElapsed] = useState(0),
    [recorded, setRecorded] = useState<Recorded | null>(null),
    [title, setTitle] = useState(""),
    [speaker, setSpeaker] = useState(""),
    [notes, setNotes] = useState<VoiceNote[]>([]),
    [loaded, setLoaded] = useState(false),
    [listError, setListError] = useState(""),
    [status, setStatus] = useState(""),
    [playing, setPlaying] = useState<{ id: string; url: string } | null>(null),
    [editing, setEditing] = useState<{
      id: string;
      title: string;
      speaker: string;
    } | null>(null);

  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    audioCtx = useRef<AudioContext | null>(null),
    frame = useRef(0),
    timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined),
    startedAt = useRef(0),
    cancelled = useRef(false),
    mounted = useRef(true),
    meter = useRef<HTMLSpanElement>(null),
    urls = useRef(new Set<string>());

  const makeURL = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urls.current.add(url);
    return url;
  };
  const dropURL = (url: string) => {
    URL.revokeObjectURL(url);
    urls.current.delete(url);
  };

  const releaseMic = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = undefined;
    cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void audioCtx.current?.close().catch(() => undefined);
    audioCtx.current = null;
  }, []);

  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  useEffect(() => {
    let live = true;
    listNotes(entryId)
      .then((list) => {
        if (!live) return;
        setNotes(list);
        setListError("");
      })
      .catch((error: unknown) => {
        if (live) setListError(storeMessage(error));
      })
      .finally(() => {
        if (live) setLoaded(true);
      });
    return () => {
      live = false;
    };
  }, [entryId, version]);

  useEffect(() => {
    mounted.current = true;
    const owned = urls.current;
    return () => {
      mounted.current = false;
      cancelled.current = true;
      if (recorder.current && recorder.current.state !== "inactive") {
        try {
          recorder.current.stop();
        } catch {
          /* already stopped */
        }
      }
      releaseMic();
      owned.forEach((url) => URL.revokeObjectURL(url));
      owned.clear();
    };
  }, [releaseMic]);

  const stop = useCallback(() => {
    const r = recorder.current;
    if (r && r.state !== "inactive") r.stop();
  }, []);

  const startMeter = (media: MediaStream) => {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(media).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        const level = Math.min(1, Math.sqrt(sum / data.length) * 3.2);
        if (meter.current) meter.current.style.transform = `scaleX(${level})`;
        frame.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* The meter is only decoration; recording still works without it. */
    }
  };

  const start = async () => {
    if (support !== "ok" || phase !== "idle") return;
    setPhase("starting");
    setStatus("مىكروفون ئېچىلىۋاتىدۇ…");
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (error) {
      if (!mounted.current) return;
      setPhase("idle");
      setStatus(micMessage(error));
      return;
    }
    if (!mounted.current) {
      media.getTracks().forEach((t) => t.stop());
      return;
    }
    stream.current = media;
    const mime = pickMimeType((t) => MediaRecorder.isTypeSupported(t));
    let r: MediaRecorder;
    try {
      r = mime
        ? new MediaRecorder(media, { mimeType: mime })
        : new MediaRecorder(media);
    } catch {
      try {
        r = new MediaRecorder(media);
      } catch (error) {
        releaseMic();
        setPhase("idle");
        setStatus(micMessage(error));
        return;
      }
    }
    const chunks: Blob[] = [];
    cancelled.current = false;
    r.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    r.onstop = () => {
      const duration = Math.min(
        MAX_SECONDS,
        (now() - startedAt.current) / 1000,
      );
      releaseMic();
      recorder.current = null;
      if (!mounted.current) return;
      if (cancelled.current) {
        setPhase("idle");
        setElapsed(0);
        setStatus("خاتىرىلەش بىكار قىلىندى.");
        return;
      }
      const type = r.mimeType || mime || "audio/webm";
      const blob = new Blob(chunks, { type });
      if (!blob.size) {
        setPhase("idle");
        setStatus("ھېچقانداق ئاۋاز خاتىرىلەنمىدى. قايتا سىناڭ.");
        return;
      }
      setRecorded({ blob, url: makeURL(blob), duration, type, created: now() });
      setPhase("review");
      setStatus(
        "خاتىرىلەش تامام. ئاڭلاپ بېقىپ، ماۋزۇ ۋە ئىسىم يېزىپ ساقلاڭ.",
      );
    };
    r.onerror = () => {
      cancelled.current = true;
      stop();
      if (mounted.current) setStatus("خاتىرىلەشتە خاتالىق كۆرۈلدى. قايتا سىناڭ.");
    };
    recorder.current = r;
    startedAt.current = now();
    setElapsed(0);
    r.start(1000);
    startMeter(media);
    timer.current = setInterval(() => {
      const seconds = (now() - startedAt.current) / 1000;
      setElapsed(seconds);
      if (seconds >= MAX_SECONDS) {
        stop();
        setStatus("ئەڭ ئۇزۇن ۋاقىت (10 مىنۇت) توشتى؛ خاتىرىلەش توختىدى.");
      }
    }, 250);
    setPhase("recording");
    setStatus("خاتىرىلىنىۋاتىدۇ…");
  };

  const cancelRecording = () => {
    cancelled.current = true;
    stop();
  };

  const discard = () => {
    if (
      recorded &&
      !window.confirm("بۇ خاتىرىنى ساقلىماي تاشلىۋېتەمسىز؟")
    )
      return;
    if (recorded) dropURL(recorded.url);
    setRecorded(null);
    setPhase("idle");
    setElapsed(0);
    setStatus("خاتىرە تاشلىۋېتىلدى.");
  };

  const save = async () => {
    if (!recorded || phase === "saving") return;
    setPhase("saving");
    const meta: VoiceNote = {
      id: uid(),
      title:
        title.trim().slice(0, TITLE_MAX) ||
        (entryTitle ? `«${entryTitle}» ئاۋازلىق ئوقۇلۇشى` : "ئائىلە ئاۋازى"),
      speaker: speaker.trim().slice(0, SPEAKER_MAX),
      created: recorded.created,
      duration: Math.round(recorded.duration),
      type: recorded.type,
      ...(entryId ? { entryId } : {}),
      ...(entryTitle ? { entryTitle } : {}),
    };
    try {
      await saveNote(meta, recorded.blob);
      void navigator.storage?.persist?.().catch(() => false);
      if (!mounted.current) return;
      dropURL(recorded.url);
      setRecorded(null);
      setTitle("");
      setElapsed(0);
      setPhase("idle");
      setStatus(`«${meta.title}» مۇشۇ ئۈسكۈنىدە ساقلاندى.`);
      onReward?.("voice:first", "ئائىلە ئاۋازى");
      refresh();
    } catch (error) {
      if (!mounted.current) return;
      setPhase("review");
      setStatus(storeMessage(error));
    }
  };

  const togglePlay = async (note: VoiceNote) => {
    if (playing) dropURL(playing.url);
    if (playing?.id === note.id) {
      setPlaying(null);
      return;
    }
    setPlaying(null);
    try {
      const blob = await getAudio(note.id);
      if (!mounted.current) return;
      setPlaying({ id: note.id, url: makeURL(blob) });
    } catch (error) {
      setStatus(storeMessage(error));
    }
  };

  const download = async (note: VoiceNote) => {
    try {
      const blob = await getAudio(note.id);
      const url = makeURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = fileName(note);
      link.click();
      setTimeout(() => dropURL(url), 30000);
      setStatus("ھۆججەت چۈشۈرۈلۈۋاتىدۇ.");
    } catch (error) {
      setStatus(storeMessage(error));
    }
  };

  const remove = async (note: VoiceNote) => {
    if (
      !window.confirm(
        `«${note.title}» خاتىرىسىنى ئۆچۈرەمسىز؟ ئۇنى قايتۇرغىلى بولمايدۇ.`,
      )
    )
      return;
    try {
      await deleteNote(note.id);
      if (playing?.id === note.id) {
        dropURL(playing.url);
        setPlaying(null);
      }
      setStatus(`«${note.title}» ئۆچۈرۈلدى.`);
      refresh();
    } catch (error) {
      setStatus(storeMessage(error));
    }
  };

  const saveRename = async () => {
    if (!editing) return;
    const next = editing.title.trim();
    if (!next) {
      setStatus("ماۋزۇ بوش قالمىسۇن.");
      return;
    }
    try {
      await renameNote(editing.id, {
        title: next.slice(0, TITLE_MAX),
        speaker: editing.speaker.trim().slice(0, SPEAKER_MAX),
      });
      setEditing(null);
      setStatus("ئۆزگەرتىش ساقلاندى.");
      refresh();
    } catch (error) {
      setStatus(storeMessage(error));
    }
  };

  const remaining = MAX_SECONDS - elapsed;

  const recorderUI =
    support !== "ok" ? (
      <p className="voice-warning" role="status">
        {supportMessage[support]}
      </p>
    ) : (
      <div className="voice-recorder">
        {(phase === "idle" || phase === "starting") && (
          <Button
            type="button"
            onClick={() => void start()}
            disabled={phase === "starting"}
          >
            <Mic size={17} aria-hidden="true" />
            {phase === "starting" ? "ئېچىلىۋاتىدۇ…" : "خاتىرىلەشنى باشلاش"}
          </Button>
        )}
        {phase === "recording" && (
          <div className="voice-live">
            <span className="voice-dot" aria-hidden="true" />
            <span
              className="voice-timer"
              role="timer"
              aria-label="خاتىرىلەنگەن ۋاقىت"
              dir="ltr"
            >
              {formatDuration(elapsed)}
            </span>
            <span className="voice-meter" aria-hidden="true">
              <span ref={meter} />
            </span>
            <div className="voice-live-actions">
              <Button type="button" onClick={stop}>
                <Square size={15} aria-hidden="true" />
                توختىتىش
              </Button>
              <Button type="button" variant="ghost" onClick={cancelRecording}>
                <X size={16} aria-hidden="true" />
                بىكار قىلىش
              </Button>
            </div>
            {remaining <= 60 && (
              <p className="voice-small">
                يەنە{" "}
                <span dir="ltr">{formatDuration(remaining)}</span> قالدى.
              </p>
            )}
          </div>
        )}
        {(phase === "review" || phase === "saving") && recorded && (
          <form
            className="voice-review"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <audio controls src={recorded.url} preload="metadata">
              توركۆرگۈچىڭىز ئاۋاز قويۇشنى قوللىمايدۇ.
            </audio>
            <p className="voice-small">
              ئۇزۇنلۇقى:{" "}
              <span dir="ltr">{formatDuration(recorded.duration)}</span>
            </p>
            <div className="voice-fields">
              <label className="field">
                ماۋزۇ
                <input
                  value={title}
                  maxLength={TITLE_MAX}
                  placeholder={
                    entryTitle ? `«${entryTitle}»` : "مەسىلەن: بالىلىق ھېكايىسى"
                  }
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="field">
                كىمنىڭ ئاۋازى
                <input
                  value={speaker}
                  maxLength={SPEAKER_MAX}
                  placeholder="مەسىلەن: مومام"
                  onChange={(e) => setSpeaker(e.target.value)}
                />
              </label>
            </div>
            <div className="voice-live-actions">
              <Button type="submit" disabled={phase === "saving"}>
                <Check size={16} aria-hidden="true" />
                {phase === "saving" ? "ساقلىنىۋاتىدۇ…" : "ساقلاش"}
              </Button>
              <a
                className="voice-link"
                href={recorded.url}
                download={fileName(recorded)}
              >
                <Download size={15} aria-hidden="true" /> ھۆججەت قىلىپ چۈشۈرۈش
              </a>
              <Button
                type="button"
                variant="ghost"
                onClick={discard}
                disabled={phase === "saving"}
              >
                <Trash2 size={15} aria-hidden="true" />
                تاشلىۋېتىش
              </Button>
            </div>
          </form>
        )}
        {phase === "idle" && (
          <p className="voice-small">ئەڭ ئۇزۇن 10 مىنۇت خاتىرىلىگىلى بولىدۇ.</p>
        )}
      </div>
    );

  const list = (
    <div className="voice-list-wrap">
      {!compact && <h3>ساقلانغان ئاۋازلار</h3>}
      {listError ? (
        <p className="voice-warning" role="alert">
          {listError}
        </p>
      ) : loaded && notes.length === 0 ? (
        !compact && (
          <p className="voice-small">
            تېخى ئاۋاز خاتىرىسى يوق. تۇنجى ئاۋازنى خاتىرىلەپ بېقىڭ.
          </p>
        )
      ) : (
        <ul className="voice-list">
          {notes.map((note) => (
            <li key={note.id}>
              {editing?.id === note.id ? (
                <form
                  className="voice-rename"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveRename();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditing(null);
                  }}
                >
                  <label className="field">
                    ماۋزۇ
                    <input
                      autoFocus
                      value={editing.title}
                      maxLength={TITLE_MAX}
                      onChange={(e) =>
                        setEditing({ ...editing, title: e.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    كىمنىڭ ئاۋازى
                    <input
                      value={editing.speaker}
                      maxLength={SPEAKER_MAX}
                      onChange={(e) =>
                        setEditing({ ...editing, speaker: e.target.value })
                      }
                    />
                  </label>
                  <div className="voice-live-actions">
                    <Button type="submit" size="sm">
                      <Check size={15} aria-hidden="true" /> ساقلاش
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(null)}
                    >
                      بىكار قىلىش
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="voice-note-head">
                    <strong>{note.title}</strong>
                    <span className="voice-small">
                      {note.speaker && <>{note.speaker} · </>}
                      <bdi dir="ltr">{localDay(new Date(note.created))}</bdi> ·{" "}
                      <bdi dir="ltr">{formatDuration(note.duration)}</bdi>
                    </span>
                    {!entryId && note.entryTitle && (
                      <span className="voice-entry">
                        ئوقۇش بېتى: {note.entryTitle}
                      </span>
                    )}
                  </div>
                  <div className="voice-note-actions">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-pressed={playing?.id === note.id}
                      aria-label={`«${note.title}» خاتىرىسىنى ئاڭلاش`}
                      onClick={() => void togglePlay(note)}
                    >
                      <Headphones size={15} aria-hidden="true" />
                      {playing?.id === note.id ? "يېپىش" : "ئاڭلاش"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`«${note.title}» خاتىرىسىنىڭ نامىنى ئۆزگەرتىش`}
                      onClick={() =>
                        setEditing({
                          id: note.id,
                          title: note.title,
                          speaker: note.speaker,
                        })
                      }
                    >
                      <Pencil size={15} aria-hidden="true" />
                      نامىنى ئۆزگەرتىش
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`«${note.title}» خاتىرىسىنى چۈشۈرۈش`}
                      onClick={() => void download(note)}
                    >
                      <Download size={15} aria-hidden="true" />
                      چۈشۈرۈش
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`«${note.title}» خاتىرىسىنى ئۆچۈرۈش`}
                      onClick={() => void remove(note)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      ئۆچۈرۈش
                    </Button>
                  </div>
                  {playing?.id === note.id && (
                    <audio controls autoPlay src={playing.url}>
                      توركۆرگۈچىڭىز ئاۋاز قويۇشنى قوللىمايدۇ.
                    </audio>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const privacy = (
    <p className="voice-privacy">
      ئاۋازلار پەقەت مۇشۇ ئۈسكۈنىدىكى توركۆرگۈچتە ساقلىنىدۇ؛ تورغا
      يوللانمايدۇ. توركۆرگۈچ سانلىق مەلۇماتىنى تازىلىسىڭىز ئۆچۈپ كېتىدۇ،
      شۇڭا مۇھىم ئاۋازلارنى چۈشۈرۈپ ساقلاپ قويۇڭ.
    </p>
  );

  if (compact)
    return (
      <section className="voice-notes compact" aria-label="ئائىلە ئاۋاز خاتىرىلىرى">
        <div className="voice-compact-head">
          <Mic size={20} aria-hidden="true" />
          <h3>بۇ بەتنى بىر ياشانغان ئادەمنىڭ ئاۋازى بىلەن خاتىرىلەڭ</h3>
        </div>
        {recorderUI}
        <p role="status" className="voice-status">
          {status}
        </p>
        {list}
        <p className="voice-privacy">
          ئاۋازلار پەقەت مۇشۇ ئۈسكۈنىدە ساقلىنىدۇ؛ تورغا يوللانمايدۇ.
        </p>
      </section>
    );

  return (
    <section className="play-panel voice-notes">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ئائىلىدىكى ئاۋازلار</span>
          <h2>مومام-بوۋامنىڭ ئاۋازى</h2>
          <p>
            مومىڭىز، بوۋىڭىز ياكى ئائىلىدىكى چوڭلارنىڭ ھېكايە، ناخشا ۋە
            نەسىھەتلىرىنى ئۆز ئاۋازى بىلەن خاتىرىلەپ قويۇڭ.
          </p>
        </div>
        <Mic size={35} aria-hidden="true" />
      </div>
      {privacy}
      {recorderUI}
      <p role="status" className="voice-status">
        {status}
      </p>
      {list}
    </section>
  );
}
