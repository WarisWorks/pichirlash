import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  Save,
  Trash2,
  ImageDown,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { colors, moveWord, uid, validPoems } from "./model";
import type { Poem } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import PoemMeter from "@/components/features/PoemMeter";
import ShareLinkButton from "@/components/features/ShareLinkButton";
export type CardContent = {
  title: string;
  text: string;
  art: string;
  color: string;
};
const banks = {
  nature: {
    label: "تەبىئەت",
    words: [
      "باھار",
      "شامال",
      "گۈل",
      "يوپۇرماق",
      "قۇياش",
      "ئاي",
      "يۇلتۇز",
      "يامغۇر",
      "باغ",
      "تاغ",
      "دېڭىز",
      "نۇر",
    ],
  },
  feeling: {
    label: "كۆڭۈل",
    words: [
      "مېھىر",
      "ئۈمىد",
      "ئارزۇ",
      "دوستلۇق",
      "كۈلۈمسىرەش",
      "خۇشاللىق",
      "ئەسلىمە",
      "يۈرەك",
      "ئىللىق",
      "گۈزەل",
      "تاتلىق",
      "ئاستا",
    ],
  },
  joining: {
    label: "سۆزلەر",
    words: [
      "بۈگۈن",
      "ئەتە",
      "مەن",
      "سەن",
      "بىز",
      "بىر",
      "بىلەن",
      "ۋە",
      "كەلدى",
      "ئاچتى",
      "كۈلدى",
      "بولدى",
      "كۆڭلۈمگە",
      "سۆزلىرىڭ",
      "ھەر",
      "كۈن",
      "يېڭى",
      "ھايات",
      "،",
      ".",
    ],
  },
};
const blank = (): Poem => ({
  id: uid(),
  title: "مېنىڭ كىچىك شېئىرىم",
  words: [],
  color: "pink",
  art: "sunflower",
});
export default function PoetryPlayground({
  onReward,
  onCard,
}: {
  onReward: (key: string, label: string) => void;
  onCard: (content: CardContent) => void;
}) {
  const {
    value: poems,
    setValue: setPoems,
    error,
  } = useLocal<Poem[]>("pichirlash-poems-v1", [], validPoems);
  const [poem, setPoem] = useState<Poem>(blank),
    [bank, setBank] = useState<keyof typeof banks>("nature"),
    [selected, setSelected] = useState(-1),
    [status, setStatus] = useState("");
  const add = (word: string) => {
    if (poem.words.length >= 60) {
      setStatus("بىر شېئىرغا ئەڭ كۆپ 60 سۆز قوشالايسىز.");
      return;
    }
    setPoem((v) => ({ ...v, words: [...v.words, word] }));
    setSelected(poem.words.length);
  };
  const drop = (e: React.DragEvent, to: number) => {
    e.preventDefault();
    e.stopPropagation();
    const source = e.dataTransfer.getData("application/x-pichirlash-word");
    if (source.startsWith("move:")) {
      const from = Number(source.slice(5));
      if (Number.isInteger(from)) {
        const target = Math.min(to, poem.words.length - 1);
        setPoem((v) => ({ ...v, words: moveWord(v.words, from, target) }));
        setSelected(target);
      }
    } else if (Object.values(banks).some((b) => b.words.includes(source)))
      add(source);
  };
  const save = () => {
    if (!poem.title.trim() || !poem.words.length) {
      setStatus("ماۋزۇ ۋە كەم دېگەندە بىر سۆز قوشۇڭ.");
      return;
    }
    setPoems((v) => [
      { ...poem, title: poem.title.trim() },
      ...v.filter((x) => x.id !== poem.id),
    ]);
    onReward(`poem:${poem.id}`, "بىر كىچىك شېئىر");
    setStatus("شېئىرىڭىز ساقلاندى. باغچىڭىزدىكى گۈلنى كۆرۈپ بېقىڭ!");
  };
  return (
    <section className="play-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">سۆزلەر بىلەن ئوينايلى</span>
          <h2>شېئىر مەيدانچىسى</h2>
          <p>
            سۆزنى چېكىڭ ياكى قەغەزگە سۆرەڭ. تاللانغان سۆزنىڭ ئورنىنى كۇنۇپكىلار
            بىلەنمۇ ئالماشتۇرالايسىز.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (
              poem.words.length &&
              !confirm(
                "يېڭى شېئىر باشلامسىز؟ ساقلىمىغان ئۆزگەرتىشلەر يوقىلىدۇ.",
              )
            )
              return;
            setPoem(blank());
            setSelected(-1);
            setStatus("");
          }}
        >
          <Plus size={17} /> يېڭى شېئىر
        </Button>
      </div>
      <div className="poetry-layout">
        <aside className="word-bank">
          <h3>سۆز ساندۇقى</h3>
          <div className="tabs">
            {Object.entries(banks).map(([key, b]) => (
              <button
                key={key}
                className={bank === key ? "tab selected" : "tab"}
                aria-pressed={bank === key}
                onClick={() => setBank(key as keyof typeof banks)}
              >
                {b.label}
              </button>
            ))}
          </div>
          <div className="word-tiles">
            {banks[bank].words.map((word) => (
              <button
                key={word}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-pichirlash-word", word);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => add(word)}
                aria-label={`${word} — شېئىرغا قوشۇش`}
              >
                {word}
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => add("\n")}>
            <CornerDownLeft size={17} /> يېڭى قۇر
          </Button>
          <label className="field">
            قەغەز
            <select
              value={poem.color}
              onChange={(e) => setPoem({ ...poem, color: e.target.value })}
            >
              {colors.map((c, i) => (
                <option key={c} value={c}>
                  {["سېرىق", "ھالرەڭ", "يېشىل", "كۆك", "بىنەپشە"][i]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            بېزەك
            <select
              value={poem.art}
              onChange={(e) => setPoem({ ...poem, art: e.target.value })}
            >
              {["sunflower", "owl", "comet", "teacup", "bunny"].map(
                (name, i) => (
                  <option key={name} value={name}>
                    {["گۈل", "قۇش", "يۇلتۇز", "چاي", "توشقان"][i]}
                  </option>
                ),
              )}
            </select>
          </label>
        </aside>
        <div>
          <div
            className={`poem-paper ${poem.color}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => drop(e, poem.words.length)}
          >
            <span className="washi" />
            <Sticker name={poem.art} size={72} />
            <label className="field">
              ماۋزۇ
              <input
                maxLength={64}
                value={poem.title}
                onChange={(e) => setPoem({ ...poem, title: e.target.value })}
              />
            </label>
            <div
              className="poem-word-area"
              role="group"
              aria-label="شېئىر قەغىزى"
            >
              {!poem.words.length && (
                <p className="empty-verse">بىر سۆزدىن باشلاڭ…</p>
              )}
              {poem.words.map((word, i) => (
                <span key={i} className={word === "\n" ? "poem-break" : ""}>
                  {word === "\n" && <br />}
                  <button
                    aria-label={`${i + 1}. ${word === "\n" ? "يېڭى قۇر" : word} — تاللاش`}
                    aria-pressed={selected === i}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/x-pichirlash-word",
                        `move:${i}`,
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => drop(e, i)}
                    onClick={() => setSelected(i)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                        const to = i + (e.key === "ArrowUp" ? -1 : 1);
                        setPoem((v) => ({
                          ...v,
                          words: moveWord(v.words, i, to),
                        }));
                        if (to >= 0 && to < poem.words.length) setSelected(to);
                      }
                    }}
                  >
                    {word === "\n" ? <CornerDownLeft size={13} /> : word}
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="poem-tools">
            <span>{poem.words.length.toLocaleString("en-US")} / 60</span>
            <Button
              variant="ghost"
              disabled={selected <= 0}
              onClick={() => {
                setPoem((v) => ({
                  ...v,
                  words: moveWord(v.words, selected, selected - 1),
                }));
                setSelected((v) => v - 1);
              }}
              aria-label="سۆزنى ئالدىغا يۆتكەش"
            >
              <ArrowRight size={17} />
            </Button>
            <Button
              variant="ghost"
              disabled={selected < 0 || selected >= poem.words.length - 1}
              onClick={() => {
                setPoem((v) => ({
                  ...v,
                  words: moveWord(v.words, selected, selected + 1),
                }));
                setSelected((v) => v + 1);
              }}
              aria-label="سۆزنى كەينىگە يۆتكەش"
            >
              <ArrowLeft size={17} />
            </Button>
            <Button
              variant="ghost"
              disabled={selected < 0}
              onClick={() => {
                setPoem((v) => ({
                  ...v,
                  words: v.words.filter((_, i) => i !== selected),
                }));
                setSelected(-1);
              }}
              aria-label="تاللانغان سۆزنى ئۆچۈرۈش"
            >
              <Trash2 size={17} />
            </Button>
          </div>
          <PoemMeter text={poem.words.join(" ").replace(/ ?\n ?/g, "\n")} />
          <div className="editor-actions">
            <Button onClick={save}>
              <Save size={17} /> شېئىرنى ساقلاش
            </Button>
            <Button
              variant="outline"
              disabled={!poem.words.length}
              onClick={() =>
                onCard({
                  title: poem.title,
                  text: poem.words.join(" ").replace(/ \n /g, "\n"),
                  art: poem.art,
                  color: poem.color,
                })
              }
            >
              <ImageDown size={17} /> پوچتا كارتىسىغا ئايلاندۇرۇش
            </Button>
          </div>
          <ShareLinkButton
            disabled={!poem.words.length}
            item={() => ({
              kind: "poem",
              title: poem.title,
              text: poem.words.join(" ").replace(/ ?\n ?/g, "\n"),
              color: poem.color,
              art: poem.art,
            })}
          />
          <p role="status" className="local-hint">
            {status}
          </p>
        </div>
      </div>
      <h3>ساقلىغان شېئىرلىرىم</h3>
      {!poems.length ? (
        <p className="local-hint">تۇنجى شېئىرىڭىز مۇشۇ يەردە كۆرۈنىدۇ.</p>
      ) : (
        <div className="saved-creations">
          {poems.map((p) => (
            <article key={p.id} className={p.color}>
              <button
                onClick={() => {
                  setPoem(p);
                  setSelected(-1);
                  setStatus("شېئىر ئېچىلدى. ئۆزگەرتىپ قايتا ساقلىيالايسىز.");
                }}
              >
                <Sticker name={p.art} size={40} />
                <strong>{p.title}</strong>
                <span>{p.words.join(" ").slice(0, 80)}</span>
              </button>
              <button
                aria-label={`${p.title} — ئۆچۈرۈش`}
                onClick={() => {
                  if (confirm("بۇ شېئىرنى ئۆچۈرەمسىز؟"))
                    setPoems((v) => v.filter((x) => x.id !== p.id));
                }}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
      {error && <StorageNotice />}
    </section>
  );
}
