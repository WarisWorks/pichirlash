import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  Flag,
  Pause,
  Play,
  RefreshCw,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { copyText } from "./imageExport";
import { localDay, uid } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import {
  countWords,
  formatClock,
  goalPresets,
  onlyAdds,
  randomPrompt,
  sprintLimits,
  sprintMinutes,
  validSavedSprints,
  validSprintDraft,
  wordsPerMinute,
  type SavedSprint,
  type SprintDraft,
} from "./sprintPrompts";
import "./writingSprint.css";

const RING_R = 52,
  RING_C = 2 * Math.PI * RING_R;

function ProgressRing({ words, goal }: { words: number; goal: number }) {
  const ratio = Math.min(1, words / goal);
  return (
    <div
      className="wsprint-ring"
      role="progressbar"
      aria-label="سۆز نىشانى"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.min(words, goal)}
      aria-valuetext={`${words} / ${goal} سۆز`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="track" cx="60" cy="60" r={RING_R} />
        <circle
          className={ratio >= 1 ? "fill done" : "fill"}
          cx="60"
          cy="60"
          r={RING_R}
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - ratio)}
        />
      </svg>
      <span className="wsprint-ring-text" aria-hidden="true">
        <strong>{words}</strong>
        <small>/ {goal}</small>
      </span>
    </div>
  );
}

export default function WritingSprint({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const draftStore = useLocal<SprintDraft | null>(
    "pichirlash-sprint-draft-v1",
    null,
    validSprintDraft,
  );
  const listStore = useLocal<SavedSprint[]>("pichirlash-sprints-v1", [], validSavedSprints);
  const draft = draftStore.value,
    setDraft = draftStore.setValue,
    saved = listStore.value,
    setSaved = listStore.setValue;

  const [minutes, setMinutes] = useState<number>(10);
  const [goal, setGoal] = useState("100");
  const [prompt, setPrompt] = useState(() => randomPrompt());
  const [noDelete, setNoDelete] = useState(false);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<{ sprint: SavedSprint; stored: boolean } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [live, setLive] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const blockedAt = useRef(0);

  const total = (draft?.minutes ?? minutes) * 60000;
  const elapsed = draft ? Math.min(total, draft.elapsed + (startAt ? now - startAt : 0)) : 0;
  const words = draft ? countWords(draft.text) : 0;
  const running = startAt !== null;

  const tick = useRef(() => {});
  useEffect(() => {
    if (startAt === null) return;
    const id = window.setInterval(() => tick.current(), 250);
    return () => window.clearInterval(id);
  }, [startAt]);

  const hint = () => {
    if (Date.now() - blockedAt.current < 4000) return;
    blockedAt.current = Date.now();
    setLive("«ئۆچۈرمەسلىك» ھالىتى ئوچۇق: پەقەت ئالدىغا يېزىڭ!");
  };

  // Native beforeinput catches deletes from on-screen keyboards too.
  useEffect(() => {
    const el = area.current;
    if (!el || !draft?.noDelete) return;
    const block = (e: InputEvent) => {
      if (e.inputType.startsWith("delete") || e.inputType === "historyUndo") {
        e.preventDefault();
        hint();
      }
    };
    el.addEventListener("beforeinput", block);
    return () => el.removeEventListener("beforeinput", block);
  });

  const commit = (at = Date.now()) => {
    if (!draft || startAt === null) return draft;
    const next = { ...draft, elapsed: Math.min(total, draft.elapsed + at - startAt) };
    setDraft(next);
    return next;
  };

  const finish = (from: SprintDraft | null = commit(), timeUp = false) => {
    setStartAt(null);
    if (!from) return;
    const sprint: SavedSprint = {
      id: uid(),
      day: localDay(),
      prompt: from.prompt,
      text: from.text,
      words: countWords(from.text),
      goal: from.goal,
      minutes: from.minutes,
      seconds: Math.round(from.elapsed / 1000),
      noDelete: from.noDelete,
      created: Date.now(),
    };
    let stored = false;
    if (sprint.words > 0 && saved.length < sprintLimits.saved) {
      setSaved([sprint, ...saved]);
      stored = true;
    }
    setResult({ sprint, stored });
    setDraft(null);
    setLive(timeUp ? "ۋاقىت توشتى. ئوبدان يازدىڭىز!" : "مەشىق تاماملاندى.");
  };

  // Each tick: end when time is up, and keep the stored time fresh.
  useEffect(() => {
    tick.current = () => {
      const t = Date.now();
      setNow(t);
      if (startAt === null || !draft) return;
      if (draft.elapsed + t - startAt >= total) {
        finish({ ...draft, elapsed: total }, true);
      } else if (t - startAt > 5000) {
        setDraft({ ...draft, elapsed: draft.elapsed + t - startAt });
        setStartAt(t);
      }
    };
  });

  const goalNumber = Math.round(Number(goal));
  const goalOk =
    Number.isInteger(goalNumber) &&
    goalNumber >= sprintLimits.minGoal &&
    goalNumber <= sprintLimits.maxGoal;

  const start = () => {
    if (!goalOk) {
      setStatus(`سۆز نىشانىنى ${sprintLimits.minGoal} بىلەن ${sprintLimits.maxGoal} ئارىلىقىدا يېزىڭ.`);
      return;
    }
    setResult(null);
    setStatus("");
    setDraft({ prompt, text: "", goal: goalNumber, minutes, elapsed: 0, noDelete, goalHit: false });
    const t = Date.now();
    setNow(t);
    setStartAt(t);
    window.setTimeout(() => area.current?.focus(), 0);
  };

  const pause = () => {
    commit();
    setStartAt(null);
    setLive("توختىتىلدى. تەييار بولغاندا داۋاملاشتۇرۇڭ.");
  };
  useEffect(() => {
    if (startAt === null) return;
    // Leaving the tab pauses the clock.
    const away = () => {
      if (document.visibilityState === "hidden") pause();
    };
    document.addEventListener("visibilitychange", away);
    return () => document.removeEventListener("visibilitychange", away);
  });
  const resume = () => {
    const t = Date.now();
    setNow(t);
    setStartAt(t);
    setLive("");
    window.setTimeout(() => area.current?.focus(), 0);
  };
  const discard = () => {
    if (draft && countWords(draft.text) > 0 && !window.confirm("بۇ قېتىم يازغانلىرىڭىز ساقلانمايدۇ. توختىتامسىز؟"))
      return;
    setStartAt(null);
    setDraft(null);
  };

  const write = (value: string) => {
    if (!draft || !running) return;
    if (draft.noDelete && !onlyAdds(draft.text, value)) {
      hint();
      return;
    }
    const text = value.slice(0, sprintLimits.text);
    const n = countWords(text),
      before = countWords(draft.text);
    let goalHit = draft.goalHit;
    if (!goalHit && n >= draft.goal) {
      goalHit = true;
      onReward(`sprint:${localDay()}`, "تېز يېزىش مەشىقى");
      setLive(`ئاپىرىن! ${draft.goal} سۆزلۈك نىشانغا يەتتىڭىز.`);
    } else if (before < draft.goal / 2 && n >= draft.goal / 2) {
      setLive("نىشاننىڭ يېرىمىغا يەتتىڭىز!");
    }
    setDraft({ ...draft, text, goalHit });
  };

  const copy = async (text: string) => {
    try {
      await copyText(text);
      setStatus("كۆچۈرۈلدى.");
    } catch {
      setStatus("كۆچۈرگىلى بولمىدى؛ تېكىستنى تاللاپ ئۆزىڭىز كۆچۈرۈڭ.");
    }
  };
  const remove = (s: SavedSprint) => {
    if (!window.confirm(`${s.day} كۈنىدىكى ${s.words} سۆزلۈك يازمىنى ئۆچۈرەمسىز؟`)) return;
    setSaved(saved.filter((x) => x.id !== s.id));
    if (openId === s.id) setOpenId(null);
    setStatus("يازما ئۆچۈرۈلدى.");
  };

  const remaining = Math.max(0, (total - elapsed) / 1000);
  const writing = draft !== null;

  return (
    <section className={writing ? "play-panel wsprint focus" : "play-panel wsprint"}>
      <div className="play-heading">
        <div>
          <span className="eyebrow">قەلەمنى توختاتماي يېزىڭ</span>
          <h2>تېز يېزىش مەشىقى</h2>
          <p>
            ۋاقىت ۋە سۆز نىشانى تاللاڭ، ئاندىن تېمىدىن باشلاپ توختىماي يېزىڭ.
            خاتالىقلارنى كېيىن تۈزىتىسىز — ھازىر پەقەت يېزىڭ!
          </p>
        </div>
        <Timer size={35} aria-hidden="true" />
      </div>

      <p className="sr-only" aria-live="polite">
        {live}
      </p>

      {!writing && (
        <form
          className="wsprint-setup"
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          {result && (
            <div className="wsprint-end" role="region" aria-labelledby="wsprint-end-title">
              <Sticker
                name={result.sprint.words >= result.sprint.goal ? "party-popper" : "teacup"}
                size={64}
              />
              <div>
                <h3 id="wsprint-end-title">
                  {result.sprint.words >= result.sprint.goal
                    ? "ئاپىرىن، نىشانغا يەتتىڭىز!"
                    : result.sprint.words > 0
                      ? "ياخشى يازدىڭىز! ھەر بىر سۆز بىر قەدەم."
                      : "بۇ قېتىم ھېچنېمە يېزىلمىدى؛ يەنە سىناپ بېقىڭ."}
                </h3>
                <dl className="wsprint-stats">
                  <div>
                    <dt>سۆز</dt>
                    <dd>{result.sprint.words}</dd>
                  </div>
                  <div>
                    <dt>نىشان</dt>
                    <dd>{result.sprint.goal}</dd>
                  </div>
                  <div>
                    <dt>ۋاقىت</dt>
                    <dd dir="ltr">{formatClock(result.sprint.seconds)}</dd>
                  </div>
                  <div>
                    <dt>مىنۇتىغا</dt>
                    <dd>{wordsPerMinute(result.sprint.words, result.sprint.seconds)} سۆز</dd>
                  </div>
                </dl>
                <p className="local-hint">
                  {result.stored
                    ? "يازمىڭىز تۆۋەندىكى تىزىملىككە ساقلاندى."
                    : result.sprint.words > 0
                      ? `ساقلاش ئورنى تولدى (${sprintLimits.saved}). كونا يازمىلاردىن بىرىنى ئۆچۈرۈڭ؛ بۇ يازمىنى ھازىر كۆچۈرۈۋېلىڭ.`
                      : ""}
                </p>
                {result.sprint.words > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copy(result.sprint.text)}
                  >
                    <Copy size={15} aria-hidden="true" />
                    يازمىنى كۆچۈرۈش
                  </Button>
                )}
              </div>
            </div>
          )}

          <fieldset className="wsprint-choice">
            <legend>قانچە مىنۇت؟</legend>
            <div>
              {sprintMinutes.map((m) => (
                <label key={m} className={minutes === m ? "on" : undefined}>
                  <input
                    type="radio"
                    name="wsprint-minutes"
                    className="sr-only"
                    checked={minutes === m}
                    onChange={() => setMinutes(m)}
                  />
                  {m} مىنۇت
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="wsprint-choice">
            <legend>سۆز نىشانى</legend>
            <div>
              {goalPresets.map((g) => (
                <label key={g} className={goal === String(g) ? "on" : undefined}>
                  <input
                    type="radio"
                    name="wsprint-goal"
                    className="sr-only"
                    checked={goal === String(g)}
                    onChange={() => setGoal(String(g))}
                  />
                  {g}
                </label>
              ))}
              <label className="wsprint-goal-input">
                <span className="sr-only">باشقا سان</span>
                <input
                  type="number"
                  inputMode="numeric"
                  dir="ltr"
                  min={sprintLimits.minGoal}
                  max={sprintLimits.maxGoal}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
                سۆز
              </label>
            </div>
          </fieldset>
          <div className="wsprint-prompt-box">
            <p className="wsprint-label">بۈگۈنكى تېما</p>
            <p className="wsprint-prompt" aria-live="polite">
              {prompt}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPrompt((p) => randomPrompt(p))}
            >
              <RefreshCw size={15} aria-hidden="true" />
              باشقا تېما
            </Button>
          </div>
          <label className="wsprint-toggle">
            <input
              type="checkbox"
              checked={noDelete}
              onChange={(e) => setNoDelete(e.target.checked)}
            />
            <span>
              <strong>ئۆچۈرمەسلىك ھالىتى</strong>
              <small>
                Backspace ۋە Delete ئىشلىمەيدۇ — ئارقىغا قارىماي، ئالدىغا يېزىڭ.
              </small>
            </span>
          </label>
          <Button type="submit" size="lg" disabled={!goalOk}>
            <Play size={18} aria-hidden="true" />
            باشلاش
          </Button>
          <p role="status" className="local-hint">
            {status}
          </p>
        </form>
      )}

      {draft && (
        <div className="wsprint-desk">
          <div className="wsprint-bar">
            <ProgressRing words={words} goal={draft.goal} />
            <div className="wsprint-clock">
              <span className="wsprint-label">قالغان ۋاقىت</span>
              <span role="timer" dir="ltr" className="wsprint-time">
                {formatClock(Math.ceil(remaining))}
              </span>
              {draft.noDelete && <span className="wsprint-badge">ئۆچۈرمەسلىك ھالىتى</span>}
            </div>
            <div className="wsprint-controls">
              {running ? (
                <Button type="button" variant="secondary" onClick={pause}>
                  <Pause size={17} aria-hidden="true" />
                  توختىتىش
                </Button>
              ) : (
                <Button type="button" onClick={resume}>
                  <Play size={17} aria-hidden="true" />
                  {draft.elapsed > 0 ? "داۋاملاشتۇرۇش" : "باشلاش"}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => finish()}>
                <Flag size={17} aria-hidden="true" />
                تامام
              </Button>
              <Button type="button" variant="ghost" onClick={discard}>
                <X size={17} aria-hidden="true" />
                بىكار قىلىش
              </Button>
            </div>
          </div>
          <p className="wsprint-prompt">{draft.prompt}</p>
          <label className="sr-only" htmlFor="wsprint-text">
            يازمىڭىز
          </label>
          <textarea
            id="wsprint-text"
            ref={area}
            className="wsprint-text"
            value={draft.text}
            readOnly={!running}
            maxLength={sprintLimits.text}
            spellCheck={false}
            placeholder={running ? "شۇ يەردىن باشلاڭ…" : "«داۋاملاشتۇرۇش»نى بېسىپ يېزىشنى داۋاملاشتۇرۇڭ."}
            onChange={(e) => write(e.target.value)}
            onKeyDown={(e) => {
              if (!draft.noDelete) return;
              const mod = e.ctrlKey || e.metaKey;
              if (
                e.key === "Backspace" ||
                e.key === "Delete" ||
                (mod && ["x", "z"].includes(e.key.toLowerCase()))
              ) {
                e.preventDefault();
                hint();
              }
            }}
            onCut={(e) => {
              if (draft.noDelete) {
                e.preventDefault();
                hint();
              }
            }}
            onDrop={(e) => {
              if (draft.noDelete) e.preventDefault();
            }}
          />
          {!running && draft.elapsed > 0 && (
            <p className="local-hint">
              توختىتىلدى. يازغانلىرىڭىز بۇ ئۈسكۈنىدە ساقلىنىپ تۇرىدۇ.
            </p>
          )}
        </div>
      )}

      {!writing && (
        <div className="wsprint-saved">
          <h3>
            ساقلانغان يازمىلار ({saved.length} / {sprintLimits.saved})
          </h3>
          {saved.length === 0 ? (
            <p className="local-hint">تېخى ساقلانغان يازما يوق. تۇنجى مەشىقىڭىزنى باشلاڭ!</p>
          ) : (
            <ul>
              {saved.map((s) => (
                <li key={s.id}>
                  <div className="wsprint-saved-head">
                    <span className="wsprint-saved-name">
                      <strong>{s.prompt}</strong>
                      <small>
                        <bdi dir="ltr">{s.day}</bdi> · {s.words} سۆز · {s.minutes} مىنۇت
                        {s.words >= s.goal ? " · نىشانغا يەتتى" : ""}
                      </small>
                    </span>
                    <span className="wsprint-saved-tools">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-expanded={openId === s.id}
                        aria-controls={`wsprint-read-${s.id}`}
                        onClick={() => setOpenId(openId === s.id ? null : s.id)}
                      >
                        {openId === s.id ? (
                          <EyeOff size={15} aria-hidden="true" />
                        ) : (
                          <Eye size={15} aria-hidden="true" />
                        )}
                        {openId === s.id ? "يېپىش" : "ئوقۇش"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`${s.day} كۈنىدىكى يازمىنى كۆچۈرۈش`}
                        onClick={() => void copy(s.text)}
                      >
                        <Copy size={15} aria-hidden="true" />
                        كۆچۈرۈش
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`${s.day} كۈنىدىكى يازمىنى ئۆچۈرۈش`}
                        onClick={() => remove(s)}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        ئۆچۈرۈش
                      </Button>
                    </span>
                  </div>
                  {openId === s.id && (
                    <div
                      id={`wsprint-read-${s.id}`}
                      className="wsprint-read"
                      tabIndex={0}
                      aria-label="يازما (پەقەت ئوقۇش ئۈچۈن)"
                    >
                      {s.text}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="local-hint">
            يازمىلار پەقەت مۇشۇ ئۈسكۈنىدە ساقلىنىدۇ؛ تورغا يوللانمايدۇ.
          </p>
        </div>
      )}
      {(draftStore.error || listStore.error) && <StorageNotice />}
    </section>
  );
}
