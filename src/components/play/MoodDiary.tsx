import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  BatteryLow,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Laugh,
  Lock,
  Meh,
  NotebookPen,
  Save,
  Smile,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { localDay } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import {
  addDays,
  diaryLimits,
  diaryTags,
  dropEntry,
  isoWeekId,
  longDate,
  monthGrid,
  monthNames,
  monthSummary,
  moodOf,
  moods,
  parseDay,
  promptFor,
  putEntry,
  validDiary,
  weekdayIndex,
  weekdayNames,
  type Diary,
  type MoodKey,
  type TagKey,
} from "./diaryModel";
import "./moodDiary.css";

const moodIcons: Record<MoodKey, LucideIcon> = {
  great: Laugh,
  good: Smile,
  okay: Meh,
  tired: BatteryLow,
  sad: CloudRain,
};

type Draft = { mood: MoodKey | null; tags: TagKey[]; text: string };
const draftFor = (diary: Diary, day: string): Draft => {
  const e = diary[day];
  return e ? { mood: e.mood, tags: [...e.tags], text: e.text } : { mood: null, tags: [], text: "" };
};
const sameDraft = (a: Draft, b: Draft) =>
  a.mood === b.mood && a.text === b.text && a.tags.join() === b.tags.join();

export default function MoodDiary({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const store = useLocal<Diary>("pichirlash-mood-diary-v1", {}, validDiary);
  const diary = store.value,
    setDiary = store.setValue;
  const today = localDay();
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState(() => {
    const p = parseDay(today)!;
    return { y: p.y, m0: p.m0 };
  });
  const [draft, setDraft] = useState<Draft>(() => draftFor(diary, today));
  const [status, setStatus] = useState("");
  const focusDay = useRef(false);
  const grid = useRef<HTMLTableElement>(null);

  const dirty = !sameDraft(draft, draftFor(diary, selected));
  const entry = diary[selected];
  const weeks = monthGrid(view.y, view.m0);
  const summary = monthSummary(diary, view.y, view.m0);
  const viewKey = `${view.y}-${String(view.m0 + 1).padStart(2, "0")}`;
  const isFutureMonth = viewKey >= today.slice(0, 7);
  const inView = weeks.flat().includes(selected);
  // Exactly one day button is in the tab order.
  const tabDay = inView ? selected : `${viewKey}-01`;

  useEffect(() => {
    if (!focusDay.current) return;
    focusDay.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${selected}"]`)?.focus();
  }, [selected, view]);

  const choose = (day: string, focus = false) => {
    if (day > today) return;
    if (day !== selected) {
      if (
        dirty &&
        !window.confirm("بۇ كۈندىكى ساقلانمىغان خاتىرە يوقىلىدۇ. داۋاملاشتۇرامسىز؟")
      )
        return;
      setDraft(draftFor(diary, day));
      setSelected(day);
      setStatus("");
    }
    const p = parseDay(day)!;
    if (p.y !== view.y || p.m0 !== view.m0) setView({ y: p.y, m0: p.m0 });
    focusDay.current = focus;
  };

  const shiftMonth = (n: number) =>
    setView((v) => {
      const t = v.m0 + n;
      return { y: v.y + Math.floor(t / 12), m0: ((t % 12) + 12) % 12 };
    });

  const onGridKey = (e: KeyboardEvent<HTMLTableElement>) => {
    // Right-to-left: the next day is to the left.
    const moves: Record<string, number> = {
      ArrowLeft: 1,
      ArrowRight: -1,
      ArrowDown: 7,
      ArrowUp: -7,
    };
    const from = tabDay;
    let next: string | null = null;
    if (e.key in moves) next = addDays(from, moves[e.key]);
    else if (e.key === "Home" || e.key === "End") {
      const p = parseDay(from)!,
        wd = weekdayIndex(p.y, p.m0, p.d);
      next = addDays(from, e.key === "Home" ? -wd : 6 - wd);
    }
    if (!next) return;
    e.preventDefault();
    if (next > today) next = today;
    choose(next, true);
  };

  const toggleTag = (key: TagKey) =>
    setDraft((d) =>
      d.tags.includes(key)
        ? { ...d, tags: d.tags.filter((t) => t !== key) }
        : d.tags.length >= diaryLimits.tags
          ? d
          : { ...d, tags: [...d.tags, key] },
    );

  const save = () => {
    if (!draft.mood) {
      setStatus("ئالدى بىلەن كەيپىياتىڭىزنى تاللاڭ.");
      return;
    }
    const next = putEntry(diary, {
      day: selected,
      mood: draft.mood,
      tags: draft.tags,
      text: draft.text.slice(0, diaryLimits.text),
      updated: Date.now(),
    });
    if (!next) {
      setStatus(
        `ئەڭ كۆپ ${diaryLimits.entries} كۈنلۈك خاتىرە ساقلىغىلى بولىدۇ. كونا خاتىرىلەردىن بىرنەچچىنى ئۆچۈرۈڭ.`,
      );
      return;
    }
    setDiary(next);
    setStatus("خاتىرە بۇ ئۈسكۈنىدە ساقلاندى.");
    onReward(`diary:week-${isoWeekId(selected)}`, "كۈندىلىك خاتىرە");
  };

  const remove = () => {
    if (!entry || !window.confirm(`${longDate(selected)} كۈنىدىكى خاتىرىنى ئۆچۈرەمسىز؟`)) return;
    setDiary(dropEntry(diary, selected));
    setDraft({ mood: null, tags: [], text: "" });
    setStatus("خاتىرە ئۆچۈرۈلدى.");
  };

  return (
    <section className="play-panel mdiary">
      <div className="play-heading">
        <div>
          <span className="eyebrow">كۆڭۈل خاتىرىسى</span>
          <h2>كەيپىيات كۈندىلىكى</h2>
          <p>
            ھەر كۈنى كەيپىياتىڭىزنى تاللاپ، بىر نەچچە قۇر يېزىڭ. ئاي ئاخىرىدا
            كۆڭلىڭىزنىڭ رەڭلىرىنى كۆرىسىز.
          </p>
        </div>
        <NotebookPen size={35} aria-hidden="true" />
      </div>

      <p className="mdiary-privacy">
        <Lock size={16} aria-hidden="true" />
        بۇ كۈندىلىك پەقەت مۇشۇ ئۈسكۈنىدە ساقلىنىدۇ؛ ھېچيەرگە يوللانمايدۇ.
        ئورتاق كومپيۇتېردا يازسىڭىز، باشقىلار كۆرۈپ قېلىشى مۇمكىن.
      </p>

      <div className="mdiary-layout">
        <div className="mdiary-calendar">
          <div className="mdiary-month-nav">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="ئالدىنقى ئاي"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </Button>
            <h3 id="mdiary-month" aria-live="polite">
              {view.y}-يىلى {monthNames[view.m0]}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="كېيىنكى ئاي"
              disabled={isFutureMonth}
              onClick={() => shiftMonth(1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </Button>
          </div>
          <table className="mdiary-grid" ref={grid} aria-labelledby="mdiary-month" onKeyDown={onGridKey}>
            <thead>
              <tr>
                {weekdayNames.map((w) => (
                  <th key={w.name} scope="col" abbr={w.name}>
                    <span className="mdiary-wd-full">{w.name}</span>
                    <span className="mdiary-wd-short" aria-hidden="true">
                      {w.short}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, i) => (
                <tr key={i}>
                  {week.map((day, j) => {
                    if (!day) return <td key={j} />;
                    const e = diary[day];
                    const Icon = e ? moodIcons[e.mood] : null;
                    const future = day > today;
                    return (
                      <td key={day}>
                        <button
                          type="button"
                          data-day={day}
                          className={[
                            "mdiary-day",
                            day === selected && "selected",
                            day === today && "today",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={e ? { background: moodOf(e.mood).color } : undefined}
                          tabIndex={day === tabDay ? 0 : -1}
                          disabled={future}
                          aria-pressed={day === selected}
                          aria-label={`${longDate(day)}${e ? `، ${moodOf(e.mood).name}` : ""}${day === today ? "، بۈگۈن" : ""}`}
                          onClick={() => choose(day)}
                        >
                          <span>{Number(day.slice(8))}</span>
                          {Icon && <Icon size={14} aria-hidden="true" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {!inView && (
            <Button type="button" variant="outline" size="sm" onClick={() => choose(today)}>
              بۈگۈنگە قايتىش
            </Button>
          )}
          <div className="mdiary-summary">
            <h4>بۇ ئايدىكى كەيپىيات</h4>
            {summary.total === 0 ? (
              <p className="local-hint">بۇ ئايدا تېخى خاتىرە يوق.</p>
            ) : (
              <ul>
                {moods.map((m) => {
                  const Icon = moodIcons[m.key];
                  const n = summary.counts[m.key];
                  return (
                    <li key={m.key}>
                      <Icon size={16} aria-hidden="true" />
                      <span className="mdiary-summary-name">{m.name}</span>
                      <span className="mdiary-bar" aria-hidden="true">
                        <span
                          style={{
                            width: `${(n / summary.total) * 100}%`,
                            background: m.color,
                          }}
                        />
                      </span>
                      <span className="mdiary-summary-n">{n} كۈن</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <form
          className="mdiary-editor"
          aria-labelledby="mdiary-day-title"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <h3 id="mdiary-day-title">{longDate(selected)}</h3>
          <p className="mdiary-prompt">{promptFor(selected)}</p>
          <fieldset className="mdiary-moods">
            <legend>كەيپىياتىڭىز قانداق؟</legend>
            <div>
              {moods.map((m) => (
                <label key={m.key} className={draft.mood === m.key ? "on" : undefined}>
                  <input
                    type="radio"
                    name="mdiary-mood"
                    className="sr-only"
                    checked={draft.mood === m.key}
                    onChange={() => setDraft((d) => ({ ...d, mood: m.key }))}
                  />
                  <Sticker name={m.sticker} size={44} rotate={0} shadow={false} />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mdiary-tags">
            <legend>
              نېمە ھەققىدە؟ (ئەڭ كۆپ {diaryLimits.tags})
            </legend>
            <div>
              {diaryTags.map((t) => {
                const on = draft.tags.includes(t.key);
                return (
                  <label key={t.key} className={on ? "on" : undefined}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      disabled={!on && draft.tags.length >= diaryLimits.tags}
                      onChange={() => toggleTag(t.key)}
                    />
                    {t.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="field">
            خاتىرە
            <textarea
              rows={8}
              maxLength={diaryLimits.text}
              value={draft.text}
              placeholder="بۈگۈن…"
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
            />
          </label>
          <p className="local-hint mdiary-count">
            {draft.text.length} / {diaryLimits.text}
          </p>
          <div className="mdiary-actions">
            <Button type="submit" disabled={!draft.mood || !dirty}>
              <Save size={17} aria-hidden="true" />
              ساقلاش
            </Button>
            {entry && (
              <Button type="button" variant="ghost" onClick={remove}>
                <Trash2 size={17} aria-hidden="true" />
                ئۆچۈرۈش
              </Button>
            )}
          </div>
          <p role="status" className="local-hint">
            {dirty ? "ساقلانمىغان ئۆزگەرتىش بار. " : ""}
            {status}
          </p>
        </form>
      </div>
      {store.error && <StorageNotice />}
    </section>
  );
}
