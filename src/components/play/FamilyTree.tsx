import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import {
  Download,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import {
  describePath,
  emptyFamily,
  familyLimits,
  familyStickers,
  generationName,
  isDirect,
  kinSteps,
  kinTerm,
  kinTerms,
  linksTo,
  parseYear,
  placeFamily,
  removePerson,
  resolvePath,
  stepWords,
  upsertPerson,
  validFamily,
  type FamilyPerson,
  type FamilyState,
  type KinKey,
  type KinStep,
  type KinTerm,
} from "@/lib/uyghur/kinship";
import { exportFontCSS, forgetFontCSS } from "./imageExport";
import { uid } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import "./familyTree.css";

const stickerNames: Record<(typeof familyStickers)[number], string> = {
  sunflower: "كۈنگابېقار",
  owl: "مۈشۈكياپىلاق",
  bunny: "توشقان",
  bee: "ھەسەل ھەرىسى",
  teacup: "چاي",
  "cat-loaf": "مۈشۈك",
  fox: "تۈلكە",
  puppy: "كۈچۈك",
  turtle: "تاشپاقا",
  frog: "پاقا",
  "potted-plant": "گۈلدان",
  rainbow: "ھەسەن-ھۈسەن",
  "moon-sleepy": "ئاي",
  "sun-shades": "قۇياش",
};

type Draft = {
  id: string | null;
  name: string;
  mode: "me" | "via";
  key: KinKey;
  of: string;
  step: KinStep;
  year: string;
  memory: string;
  sticker: string;
};
const blankDraft = (): Draft => ({
  id: null,
  name: "",
  mode: "me",
  key: "mother",
  of: "",
  step: "mother",
  year: "",
  memory: "",
  sticker: "",
});
const gens = [...new Set(kinTerms.map((t) => t.gen))].sort((a, b) => b - a);
const keyOrder = new Map(kinTerms.map((t, i) => [t.key, i]));

type Line = { id: string; d: string };
const timestamp = () => Date.now();

function TermInfo({ term }: { term: KinTerm }) {
  return (
    <div className="ftree-term">
      <p className="ftree-term-word">
        <strong>{term.term}</strong>
        {term.verify && (
          <span className="ftree-verify" title="ئائىلىدىكى چوڭلاردىن سوراپ بېقىڭ">
            جايغا قاراپ ئوخشىمايدۇ
          </span>
        )}
      </p>
      <p>{term.note}</p>
      {term.variants && (
        <ul className="ftree-variants">
          {term.variants.map((v) => (
            <li key={v.word}>
              <strong>{v.word}</strong> — {v.where}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FamilyTree({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const store = useLocal<FamilyState>("pichirlash-family-tree-v1", emptyFamily, validFamily);
  const family = store.value,
    setFamily = store.setValue;
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [exportedURL, setExportedURL] = useState("");
  const [path, setPath] = useState<KinStep[]>(["father", "olderSister"]);
  const [lines, setLines] = useState<Line[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const tree = useRef<HTMLDivElement>(null),
    cards = useRef(new Map<string, HTMLElement>()),
    nameInput = useRef<HTMLInputElement>(null),
    downloadURL = useRef("");

  const places = useMemo(() => placeFamily(family), [family]);
  const rows = useMemo(() => {
    const byGen = new Map<number, FamilyPerson[]>();
    for (const p of family.people) {
      const g = places.get(p.id)?.gen ?? 0;
      byGen.set(g, [...(byGen.get(g) ?? []), p]);
    }
    if (!byGen.has(0)) byGen.set(0, []);
    const rank = (p: FamilyPerson) => {
      const k = places.get(p.id)?.key;
      return k && k !== "self" ? keyOrder.get(k)! : 99;
    };
    return [...byGen.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([gen, people]) => ({
        gen,
        people: [...people].sort((a, b) => rank(a) - rank(b) || a.created - b.created),
      }));
  }, [family.people, places]);

  // Connecting lines are measured from the laid-out cards.
  useLayoutEffect(() => {
    const el = tree.current;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect();
      const rect = (id: string) => {
        const r = cards.current.get(id)?.getBoundingClientRect();
        return r
          ? {
              x: r.left - base.left + r.width / 2,
              top: r.top - base.top,
              bottom: r.bottom - base.top,
              left: r.left - base.left,
              right: r.right - base.left,
              mid: r.top - base.top + r.height / 2,
            }
          : null;
      };
      const next: Line[] = [];
      for (const p of family.people) {
        const a = rect(places.get(p.id)?.anchor ?? "me"),
          b = rect(p.id);
        if (!a || !b) continue;
        if (Math.abs(a.mid - b.mid) < 20) {
          const [l, r] = a.x < b.x ? [a, b] : [b, a];
          next.push({ id: p.id, d: `M${l.right} ${l.mid} L${r.left} ${r.mid}` });
          continue;
        }
        const [up, down] = a.mid < b.mid ? [a, b] : [b, a];
        const y1 = up.bottom,
          y2 = down.top,
          my = (y1 + y2) / 2;
        next.push({
          id: p.id,
          d: `M${up.x} ${y1} C${up.x} ${my} ${down.x} ${my} ${down.x} ${y2}`,
        });
      }
      setLines(next);
      setBox({ w: el.offsetWidth, h: el.offsetHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [family.people, places, family.me]);

  useEffect(
    () => () => {
      if (downloadURL.current) URL.revokeObjectURL(downloadURL.current);
    },
    [],
  );

  const edit = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // People that can be "the other person" without creating a loop.
  const linkable = family.people.filter(
    (p) => !draft.id || (p.id !== draft.id && !linksTo(family.people, p.id, draft.id)),
  );

  const save = () => {
    const name = draft.name.trim();
    if (!name) {
      setStatus("ئالدى بىلەن ئىسىم يېزىڭ.");
      nameInput.current?.focus();
      return;
    }
    const year = parseYear(draft.year);
    if (year === undefined) {
      setStatus(
        `تۇغۇلغان يىلىنى 4 خانىلىق سان بىلەن يېزىڭ (${familyLimits.minYear}–${familyLimits.maxYear})، ياكى بوش قالدۇرۇڭ.`,
      );
      return;
    }
    if (draft.mode === "via" && !linkable.some((p) => p.id === draft.of)) {
      setStatus("قايسى كىشىگە باغلىنىدىغانلىقىنى تاللاڭ.");
      return;
    }
    const old = family.people.find((p) => p.id === draft.id);
    const person: FamilyPerson = {
      id: draft.id ?? uid(),
      name,
      rel:
        draft.mode === "me"
          ? { to: "me", key: draft.key }
          : { to: draft.of, step: draft.step },
      birthYear: year,
      memory: draft.memory.trim().slice(0, familyLimits.memory),
      sticker: draft.sticker,
      created: old?.created ?? timestamp(),
    };
    const next = upsertPerson(family, person);
    if (!next) {
      setStatus(`شەجەرىگە ئەڭ كۆپ ${familyLimits.people} كىشى قوشقىلى بولىدۇ.`);
      return;
    }
    setFamily(next);
    setDraft(blankDraft());
    const place = placeFamily(next).get(person.id);
    setStatus(
      place?.key === "self"
        ? `«${name}» سىزنىڭ ئۆزىڭىز بولۇپ قالدى؛ مۇناسىۋەتنى تەكشۈرۈپ بېقىڭ.`
        : `«${name}» ${old ? "ئۆزگەرتىلدى" : "شەجەرىگە قوشۇلدى"}.`,
    );
    if (next.people.length >= 3) onReward("family:tree", "ئائىلە شەجەرىسى");
  };

  const startEdit = (p: FamilyPerson) => {
    setDraft({
      ...blankDraft(),
      id: p.id,
      name: p.name,
      ...(isDirect(p.rel)
        ? { mode: "me" as const, key: p.rel.key }
        : { mode: "via" as const, of: p.rel.to, step: p.rel.step }),
      year: p.birthYear === null ? "" : String(p.birthYear),
      memory: p.memory,
      sticker: p.sticker,
    });
    setStatus(`«${p.name}» ئۆزگەرتىلىۋاتىدۇ.`);
    nameInput.current?.focus();
    nameInput.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const remove = (p: FamilyPerson) => {
    if (!window.confirm(`«${p.name}»نى شەجەرىدىن ئۆچۈرەمسىز؟`)) return;
    const result = removePerson(family, p.id);
    if ("blocked" in result) {
      setStatus(
        `«${p.name}» ئارقىلىق باغلانغان ${result.blocked.map((n) => `«${n}»`).join("، ")} بار. ئالدى بىلەن ئۇلارنىڭ مۇناسىۋىتىنى ئۆزگەرتىڭ.`,
      );
      return;
    }
    setFamily(result.state);
    if (draft.id === p.id) setDraft(blankDraft());
    setStatus(`«${p.name}» ئۆچۈرۈلدى.`);
  };

  const download = async () => {
    if (!tree.current || busy) return;
    setBusy(true);
    setStatus("رەسىم تەييارلىنىۋاتىدۇ…");
    try {
      await Promise.all([
        document.fonts.load(`28px "UKIJ Qolyazma"`),
        document.fonts.load(`16px "Noto Naskh Arabic"`),
      ]);
      const css =
        (await exportFontCSS("UKIJ Qolyazma")) + (await exportFontCSS("Noto Naskh Arabic"));
      const el = tree.current;
      const blob = await toBlob(el, {
        width: el.offsetWidth,
        height: el.offsetHeight,
        pixelRatio: 2,
        fontEmbedCSS: css,
        backgroundColor: "#fffdf5",
        filter: (node) => !(node instanceof HTMLElement && node.dataset.noExport !== undefined),
      });
      if (!blob) throw Error("image");
      if (downloadURL.current) URL.revokeObjectURL(downloadURL.current);
      downloadURL.current = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadURL.current;
      link.download = "pichirlash-family-tree.png";
      link.click();
      setExportedURL(downloadURL.current);
      setStatus("رەسىم تەييار بولدى. چۈشۈرۈش باشلاندى.");
    } catch {
      setStatus("رەسىم تەييارلاش مۇۋەپپەقىيەتلىك بولمىدى. قايتا سىناڭ.");
      forgetFontCSS("UKIJ Qolyazma");
      forgetFontCSS("Noto Naskh Arabic");
    } finally {
      setBusy(false);
    }
  };

  const setStep = (i: number, s: KinStep) =>
    setPath((p) => p.map((x, j) => (j === i ? s : x)));
  const answer = resolvePath(path);

  const cardRef = (id: string) => (node: HTMLElement | null) => {
    if (node) cards.current.set(id, node);
    else cards.current.delete(id);
  };

  return (
    <section className="play-panel ftree">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ئۇرۇق-تۇغقانلىرىمىز</span>
          <h2>ئائىلە شەجەرىسى</h2>
          <p>
            ئائىلىڭىزدىكىلەرنى قوشۇپ، ئۇلارنى ئۇيغۇرچە قانداق ئاتايدىغانلىقىمىزنى
            ئۆگىنىڭ. ھەر بىرىگە بىر كىچىك ئەسلىمە يېزىپ قويۇڭ.
          </p>
        </div>
        <Users size={35} aria-hidden="true" />
      </div>

      <div className="ftree-layout">
        <form
          className="ftree-form"
          aria-labelledby="ftree-form-title"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <h3 id="ftree-form-title">
            {draft.id ? "كىشىنى ئۆزگەرتىش" : "يېڭى كىشى قوشۇش"}
          </h3>
          <label className="field">
            ئىسمى
            <input
              ref={nameInput}
              maxLength={familyLimits.name}
              value={draft.name}
              placeholder="مەسىلەن: ئايگۈل"
              onChange={(e) => edit("name", e.target.value)}
            />
          </label>
          <fieldset className="ftree-mode">
            <legend>مۇناسىۋىتى</legend>
            <label>
              <input
                type="radio"
                name="ftree-mode"
                checked={draft.mode === "me"}
                onChange={() => edit("mode", "me")}
              />
              ماڭا نىسبەتەن
            </label>
            <label>
              <input
                type="radio"
                name="ftree-mode"
                checked={draft.mode === "via"}
                disabled={linkable.length === 0}
                onChange={() =>
                  setDraft((d) => ({ ...d, mode: "via", of: d.of || linkable[0]?.id || "" }))
                }
              />
              باشقا بىر كىشىگە نىسبەتەن
            </label>
          </fieldset>
          {draft.mode === "me" ? (
            <label className="field">
              ئۇ مېنىڭ…
              <select value={draft.key} onChange={(e) => edit("key", e.target.value as KinKey)}>
                {gens.map((g) => (
                  <optgroup key={g} label={generationName(g)}>
                    {kinTerms
                      .filter((t) => t.gen === g)
                      .map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.term} — {t.path}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
          ) : (
            <div className="ftree-via">
              <label className="field">
                كىمنىڭ
                <select value={draft.of} onChange={(e) => edit("of", e.target.value)}>
                  {linkable.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                نېمىسى
                <select value={draft.step} onChange={(e) => edit("step", e.target.value as KinStep)}>
                  {kinSteps.map((s) => (
                    <option key={s} value={s}>
                      {stepWords[s].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="ftree-pair">
            <label className="field">
              تۇغۇلغان يىلى (ئىختىيارىي)
              <input
                inputMode="numeric"
                dir="ltr"
                maxLength={4}
                value={draft.year}
                placeholder="1960"
                onChange={(e) => edit("year", e.target.value)}
              />
            </label>
            <label className="field">
              چاپلاق
              <select value={draft.sticker} onChange={(e) => edit("sticker", e.target.value)}>
                <option value="">يوق</option>
                {familyStickers.map((s) => (
                  <option key={s} value={s}>
                    {stickerNames[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            بىر كىچىك ئەسلىمە
            <textarea
              rows={3}
              maxLength={familyLimits.memory}
              value={draft.memory}
              placeholder="مەسىلەن: ھەر يازدا بىزگە ئۈرۈك ئەكېلەتتى."
              onChange={(e) => edit("memory", e.target.value)}
            />
          </label>
          <p className="local-hint ftree-count">
            {draft.memory.length} / {familyLimits.memory}
          </p>
          <div className="ftree-actions">
            <Button type="submit">
              <UserPlus size={17} aria-hidden="true" />
              {draft.id ? "ساقلاش" : "قوشۇش"}
            </Button>
            {draft.id && (
              <Button type="button" variant="ghost" onClick={() => setDraft(blankDraft())}>
                <X size={17} aria-hidden="true" />
                بىكار قىلىش
              </Button>
            )}
          </div>
          <p role="status" className="local-hint">
            {status}
          </p>
        </form>

        <div className="ftree-view">
          <div className="ftree-toolbar">
            <label className="field ftree-me">
              مېنىڭ ئىسمىم
              <input
                maxLength={familyLimits.name}
                value={family.me}
                placeholder="مەن"
                onChange={(e) => setFamily((f) => ({ ...f, me: e.target.value }))}
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || family.people.length === 0}
              onClick={() => void download()}
            >
              <Download size={17} aria-hidden="true" />
              {busy ? "تەييارلىنىۋاتىدۇ…" : "PNG رەسىم چۈشۈرۈش"}
            </Button>
          </div>

          <div className="ftree-tree" ref={tree}>
            <svg
              className="ftree-lines"
              width={box.w}
              height={box.h}
              viewBox={`0 0 ${box.w || 1} ${box.h || 1}`}
              aria-hidden="true"
            >
              {lines.map((l) => (
                <path
                  key={l.id}
                  d={l.d}
                  fill="none"
                  stroke="#b6a487"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                />
              ))}
            </svg>
            <p className="ftree-title">
              {family.me.trim() ? `${family.me.trim()}نىڭ ئائىلە شەجەرىسى` : "ئائىلە شەجەرىسى"}
            </p>
            {rows.map((row) => (
              <section key={row.gen} className="ftree-row" aria-label={generationName(row.gen)}>
                <h4 className="ftree-row-title">{generationName(row.gen)}</h4>
                <ul>
                  {row.gen === 0 && (
                    <li className="ftree-card me" ref={cardRef("me")}>
                      <Sticker name="sunflower" size={40} rotate={0}/>
                      <strong>{family.me.trim() || "مەن"}</strong>
                      {family.me.trim() && <span className="ftree-card-term">مەن</span>}
                    </li>
                  )}
                  {row.people.map((p) => {
                    const place = places.get(p.id);
                    const term =
                      place?.key === "self" ? "مەن" : place?.key ? kinTerm(place.key).term : "";
                    return (
                      <li key={p.id} className="ftree-card" ref={cardRef(p.id)}>
                        {p.sticker && (
                          <Sticker name={p.sticker} size={40} seed={p.id} />
                        )}
                        <strong>{p.name}</strong>
                        {term && <span className="ftree-card-term">{term}</span>}
                        <small>{place?.desc}</small>
                        {p.birthYear !== null && (
                          <small>
                            تۇغۇلغان يىلى: <bdi>{p.birthYear}</bdi>
                          </small>
                        )}
                        {p.memory && <p className="ftree-card-memory">{p.memory}</p>}
                        <span className="ftree-card-tools" data-no-export="">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`«${p.name}»نى ئۆزگەرتىش`}
                            onClick={() => startEdit(p)}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`«${p.name}»نى ئۆچۈرۈش`}
                            onClick={() => remove(p)}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </Button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {family.people.length === 0 && (
              <p className="ftree-empty">
                تېخى ھېچكىم قوشۇلمىدى. ئاپىڭىز ياكى دادىڭىزدىن باشلاڭ!
              </p>
            )}
            <p className="ftree-foot">پىچىرلاش · ئائىلە شەجەرىسى</p>
          </div>
        </div>
      </div>

      <div className="ftree-helper" role="group" aria-labelledby="ftree-helper-title">
        <h3 id="ftree-helper-title">
          <HelpCircle size={22} aria-hidden="true" /> ئۇنى نېمە دەپ ئاتايمەن؟
        </h3>
        <p className="local-hint">
          سىزدىن باشلاپ يولنى تاللاڭ: مەسىلەن «دادا ← ئاچا» دېگىنى دادىڭىزنىڭ ئاچىسى.
        </p>
        <div className="ftree-path">
          <span>مەن</span>
          {path.map((s, i) => (
            <span key={i} className="ftree-path-step">
              <span aria-hidden="true">←</span>
              <select
                aria-label={`${i + 1}-قەدەم`}
                value={s}
                onChange={(e) => setStep(i, e.target.value as KinStep)}
              >
                {kinSteps.map((k) => (
                  <option key={k} value={k}>
                    {stepWords[k].noun}
                  </option>
                ))}
              </select>
              {i === path.length - 1 && path.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="ئاخىرقى قەدەمنى ئېلىۋېتىش"
                  onClick={() => setPath((p) => p.slice(0, -1))}
                >
                  <X size={15} aria-hidden="true" />
                </Button>
              )}
            </span>
          ))}
          {path.length < 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPath((p) => [...p, "son"])}
            >
              <Plus size={15} aria-hidden="true" />
              قەدەم قوشۇش
            </Button>
          )}
        </div>
        <div className="ftree-answer" aria-live="polite">
          <p className="ftree-answer-path">«{describePath(path)}»</p>
          {answer === "self" ? (
            <p>بۇ — سىزنىڭ ئۆزىڭىز!</p>
          ) : answer ? (
            <TermInfo term={kinTerm(answer)} />
          ) : (
            <p>
              بۇنىڭ ئايرىم بىر ئاتىلىشى يوق ياكى ياش، جىنس قاتارلىقلارغا قاراپ
              ئۆزگىرىدۇ. «{describePath(path)}» دەپ تەسۋىرلەپ ئېيتسىڭىز بولىدۇ.
            </p>
          )}
        </div>
      </div>

      <details className="ftree-glossary">
        <summary>ئۇرۇق-تۇغقانچىلىق ئاتالغۇلىرى لۇغىتى</summary>
        <p className="local-hint">
          ئاتاشلار جايغا ۋە ئائىلىگە قاراپ ئوخشىمايدۇ. «جايغا قاراپ ئوخشىمايدۇ»
          بەلگىسى بارلىرىنى ئائىلىڭىزدىكى چوڭلاردىن سوراپ بېقىڭ.
        </p>
        <dl>
          {kinTerms.map((t) => (
            <div key={t.key}>
              <dt>{t.path}</dt>
              <dd>
                <TermInfo term={t} />
              </dd>
            </div>
          ))}
        </dl>
      </details>

      {exportedURL && (
        <details className="export-preview" open>
          <summary>ئاخىرقى تەييارلانغان رەسىم</summary>
          <p>تېلېفوندا رەسىمنى ئۇزۇن بېسىپمۇ ساقلىيالايسىز.</p>
          <a href={exportedURL} download="pichirlash-family-tree.png">
            رەسىمنى قايتا چۈشۈرۈش
          </a>
          <img src={exportedURL} alt="تەييارلانغان ئائىلە شەجەرىسى" />
        </details>
      )}
      <p className="local-hint">
        شەجەرە پەقەت مۇشۇ ئۈسكۈنىدە ساقلىنىدۇ؛ تورغا يوللانمايدۇ.
      </p>
      {store.error && <StorageNotice />}
    </section>
  );
}
