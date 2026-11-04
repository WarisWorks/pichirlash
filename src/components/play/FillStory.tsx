import { useEffect, useRef, useState } from "react";
import { BookOpen, Pencil, Plus, Shuffle, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { isRecord, localDay, uid } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import {
  blankTypeLabels,
  findTemplate,
  storyParts,
  storyTemplates,
} from "./fillStoryData";
import type { StoryTemplate } from "./fillStoryData";
import "./fillStory.css";

type SavedStory = {
  id: string;
  templateId: string;
  words: Record<string, string>;
  day: string;
};
const MAX_SAVED = 20;
const MAX_WORD = 40;
const validWords = (t: StoryTemplate | undefined, w: unknown) =>
  !!t &&
  isRecord(w) &&
  t.blanks.every(
    (b) =>
      typeof w[b.key] === "string" &&
      (w[b.key] as string).trim().length > 0 &&
      (w[b.key] as string).length <= MAX_WORD,
  );
const validSaved = (v: unknown): v is SavedStory[] =>
  Array.isArray(v) &&
  v.length <= MAX_SAVED &&
  v.every(
    (s) =>
      isRecord(s) &&
      typeof s.id === "string" &&
      typeof s.templateId === "string" &&
      typeof s.day === "string" &&
      validWords(findTemplate(s.templateId), s.words),
  );

const pickOne = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

function StoryText({
  template,
  words,
}: {
  template: StoryTemplate;
  words: Record<string, string>;
}) {
  const types = Object.fromEntries(template.blanks.map((b) => [b.key, b.type]));
  return (
    <p className="fill-text">
      {storyParts(template.text).map((p, i) =>
        p.key ? (
          <mark key={i} className={`fill-word fill-${types[p.key] ?? "thing"}`}>
            {words[p.key]?.trim() || "…"}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </p>
  );
}

export default function FillStory({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const {
    value: saved,
    setValue: setSaved,
    error,
  } = useLocal<SavedStory[]>("pichirlash-fillstory-v1", [], validSaved);
  const [templateId, setTemplateId] = useState(storyTemplates[0].id);
  const [words, setWords] = useState<Record<string, string>>({});
  const [reading, setReading] = useState<SavedStory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const paperRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef<"paper" | "form" | null>(null);
  const template = findTemplate(templateId) ?? storyTemplates[0];
  const missing = template.blanks.filter((b) => !words[b.key]?.trim()).length;

  useEffect(() => {
    if (focusNext.current === "paper") paperRef.current?.focus();
    if (focusNext.current === "form") formRef.current?.focus();
    focusNext.current = null;
  }, [reading, templateId]);

  const chooseTemplate = (id: string) => {
    setTemplateId(id);
    setWords({});
    setReading(null);
    setEditingId(null);
    focusNext.current = "form";
  };
  const setWord = (key: string, value: string) =>
    setWords((w) => ({ ...w, [key]: value.slice(0, MAX_WORD) }));
  const fillRandom = () =>
    setWords((w) => {
      const next = { ...w };
      for (const b of template.blanks)
        if (!next[b.key]?.trim()) next[b.key] = pickOne(b.suggestions);
      return next;
    });
  const finish = () => {
    if (missing) return;
    const clean = Object.fromEntries(
      template.blanks.map((b) => [b.key, words[b.key].trim()]),
    );
    const story: SavedStory = {
      id: editingId ?? uid(),
      templateId: template.id,
      words: clean,
      day: localDay(),
    };
    setSaved((list) =>
      [story, ...list.filter((s) => s.id !== story.id)].slice(0, MAX_SAVED),
    );
    setEditingId(null);
    setReading(story);
    focusNext.current = "paper";
    onReward(`fill:${template.id}`, `ھېكايە: ${template.title}`);
  };
  const open = (s: SavedStory) => {
    setTemplateId(s.templateId);
    setWords(s.words);
    setEditingId(null);
    setReading(s);
    focusNext.current = "paper";
  };
  const remove = (id: string) => {
    setSaved((list) => list.filter((s) => s.id !== id));
    if (reading?.id === id) setReading(null);
    if (editingId === id) setEditingId(null);
  };
  const readTemplate = reading ? findTemplate(reading.templateId) : undefined;

  return (
    <section className="play-panel fill-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">كۈلكىلىك ھېكايىلەر ئويۇنى</span>
          <h2>بوش ئورۇنلۇق ھېكايە</h2>
          <p>
            ئاۋۋال ھېكايىنى تاللاڭ، ئاندىن ھەر بىر بوش ئورۇنغا خالىغان سۆزنى
            يېزىڭ. ھېكايىنى ئوقۇغاندىلا ئۇنىڭ قانچىلىك كۈلكىلىك بولغانلىقىنى
            بىلىسىز!
          </p>
        </div>
        <Sticker name="bunny" size={86} />
      </div>

      <div className="fill-templates" role="group" aria-label="ھېكايە تاللاش">
        {storyTemplates.map((t) => (
          <button
            type="button"
            key={t.id}
            aria-pressed={t.id === templateId}
            onClick={() => chooseTemplate(t.id)}
          >
            <Sticker name={t.art} size={54} shadow={false} />
            <span>{t.title}</span>
          </button>
        ))}
      </div>

      <ol className="fill-steps" aria-label="قەدەملەر">
        <li aria-current={!reading ? "step" : undefined}>1. سۆزلەرنى يېزىڭ</li>
        <li aria-current={reading ? "step" : undefined}>2. ھېكايىنى ئوقۇڭ</li>
      </ol>

      {!reading && (
        <form
          className="fill-form"
          onSubmit={(e) => {
            e.preventDefault();
            finish();
          }}
        >
          <h3 ref={formRef} tabIndex={-1}>
            {template.title}
          </h3>
          <div className="fill-fields">
            {template.blanks.map((b) => {
              const id = `fill-${template.id}-${b.key}`;
              return (
                <div className="fill-field" key={b.key}>
                  <label htmlFor={id}>
                    <span className={`fill-tag fill-${b.type}`}>
                      {blankTypeLabels[b.type]}
                    </span>
                    {b.hint}
                  </label>
                  <div className="fill-input-row">
                    <input
                      id={id}
                      value={words[b.key] ?? ""}
                      maxLength={MAX_WORD}
                      autoComplete="off"
                      dir="auto"
                      onChange={(e) => setWord(b.key, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${b.hint}: تاسادىپىي سۆز`}
                      title="تاسادىپىي سۆز"
                      onClick={() => setWord(b.key, pickOne(b.suggestions))}
                    >
                      <Shuffle size={16} />
                    </Button>
                  </div>
                  <div className="fill-chips" role="group" aria-label={`${b.hint}: تەۋسىيەلەر`}>
                    {b.suggestions.map((s) => (
                      <button
                        type="button"
                        key={s}
                        aria-pressed={words[b.key] === s}
                        onClick={() => setWord(b.key, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="editor-actions fill-actions">
            <Button type="submit" disabled={missing > 0}>
              <BookOpen size={17} /> ھېكايىنى كۆرۈش
            </Button>
            <Button type="button" variant="outline" onClick={fillRandom}>
              <Wand2 size={17} /> قالغانلىرىنى تاسادىپىي تولدۇرۇش
            </Button>
          </div>
          <p className="local-hint" role="status">
            {missing
              ? `يەنە ${missing} بوش ئورۇن قالدى.`
              : "ھەممە بوش ئورۇن تولدى. ھېكايىنى كۆرەيلى!"}
          </p>
        </form>
      )}

      {reading && readTemplate && (
        <article className="fill-paper" aria-labelledby="fill-paper-title">
          <span className="fill-washi" aria-hidden="true" />
          <Sticker name={readTemplate.art} size={104} className="fill-paper-art" />
          <h3 id="fill-paper-title" ref={paperRef} tabIndex={-1}>
            {readTemplate.title}
          </h3>
          <StoryText template={readTemplate} words={reading.words} />
          <p className="fill-paper-day">{reading.day}</p>
          <div className="editor-actions fill-actions">
            <Button
              variant="outline"
              onClick={() => {
                setWords(reading.words);
                setEditingId(reading.id);
                setReading(null);
                focusNext.current = "form";
              }}
            >
              <Pencil size={17} /> سۆزلەرنى ئۆزگەرتىش
            </Button>
            <Button onClick={() => chooseTemplate(readTemplate.id)}>
              <Plus size={17} /> يېڭى ھېكايە
            </Button>
          </div>
        </article>
      )}

      <section className="fill-saved" aria-labelledby="fill-saved-title">
        <h3 id="fill-saved-title">مېنىڭ ھېكايىلىرىم</h3>
        {saved.length === 0 ? (
          <p className="local-hint">تېخى ساقلانغان ھېكايە يوق.</p>
        ) : (
          <ul>
            {saved.map((s) => {
              const t = findTemplate(s.templateId);
              if (!t) return null;
              return (
                <li key={s.id} className={reading?.id === s.id ? "current" : undefined}>
                  <Sticker name={t.art} size={40} shadow={false} />
                  <span className="fill-saved-title">
                    {t.title}
                    <small>
                      {s.words[t.blanks[0].key]} · {s.day}
                    </small>
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => open(s)}>
                    ئېچىش
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`«${t.title}» نى ئۆچۈرۈش`}
                    onClick={() => remove(s.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="local-hint">
          ھېكايىلەر مۇشۇ توركۆرگۈچتە ساقلىنىدۇ. ئەڭ كۆپ {MAX_SAVED} ھېكايە
          ساقلىنىدۇ؛ يېڭىسى قوشۇلسا ئەڭ كونىسى ئۆچۈرۈلىدۇ.
        </p>
      </section>
      {error && <StorageNotice />}
    </section>
  );
}
