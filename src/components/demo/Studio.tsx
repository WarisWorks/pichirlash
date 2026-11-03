import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Art } from "./ArtLibrary";
import type { Decoration } from "./ArtLibrary";
import { labels } from "@/data/content";
import type { Entry } from "@/data/content";
export type DemoEntry = Entry & { draft?: boolean; art?: Decoration };
const blank = (art?: Decoration, type: Entry["type"] = "poem"): DemoEntry => ({
  id: `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: "",
  body: "",
  excerpt: "",
  type,
  color: "pink",
  time: "١ مىنۇت",
  draft: true,
  art,
});
export default function Studio({
  items,
  onChange,
  onRead,
  decoration,
  onDone,
  initialType = "poem",
}: {
  items: DemoEntry[];
  onChange: (items: DemoEntry[]) => void;
  onRead: (item: DemoEntry) => void;
  decoration?: Decoration;
  onDone: () => void;
  initialType?: Entry["type"];
}) {
  const [edit, setEdit] = useState<DemoEntry | null>(() =>
      decoration ? blank(decoration, initialType) : null,
    ),
    [preview, setPreview] = useState(false),
    [message, setMessage] = useState("");
  const persist = (draft: boolean) => {
    if (!edit || !edit.title.trim() || !edit.body.trim()) return;
    const item = {
      ...edit,
      title: edit.title.trim(),
      body: edit.body.trim(),
      excerpt: edit.excerpt.trim() || edit.body.slice(0, 95),
      draft,
      time: `${Math.max(1, Math.ceil(edit.body.length / 600)).toLocaleString("ar")} مىنۇت`,
    };
    onChange([item, ...items.filter((x) => x.id !== edit.id)]);
    setEdit(null);
    setMessage(draft ? "لايىھە ساقلاندى." : "يازما دېمو بەتتە كۆرسىتىلدى.");
    onDone();
  };
  return (
    <section className="studio-section">
      <div className="studio-title">
        <div>
          <span className="eyebrow">مېنىڭ يېزىقچىلىق بۇلۇڭۇم</span>
          <h2>يېڭى بىر بەت ئاچايلى</h2>
          <p>
            بۇ سىناق نۇسخىسى. يازمىلىرىڭىز پەقەت مۇشۇ توركۆرگۈچتە ساقلىنىدۇ.
          </p>
        </div>
        <Button
          onClick={() => {
            setEdit(blank(undefined, initialType));
            setPreview(false);
            setMessage("");
          }}
        >
          <Plus size={18} /> يېڭى يازما
        </Button>
      </div>
      {message && (
        <p className="success" role="status">
          <Check size={18} />
          {message}
        </p>
      )}
      <div className="studio-stats">
        <span>
          بارلىق يازمىلار <strong>{items.length.toLocaleString("ar")}</strong>
        </span>
        <span>
          لايىھەلەر{" "}
          <strong>
            {items.filter((x) => x.draft).length.toLocaleString("ar")}
          </strong>
        </span>
        <span>
          كۆرسىتىلگەن{" "}
          <strong>
            {items.filter((x) => !x.draft).length.toLocaleString("ar")}
          </strong>
        </span>
      </div>
      {edit ? (
        <div className="editor-layout">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              persist(false);
            }}
            className="writing-form"
          >
            <label className="field">
              ماۋزۇ
              <input
                required
                maxLength={100}
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </label>
            <div className="editor-options">
              <label className="field">
                تۈرى
                <select
                  value={edit.type}
                  onChange={(e) =>
                    setEdit({ ...edit, type: e.target.value as Entry["type"] })
                  }
                >
                  {Object.entries(labels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                قەغەز رەڭگى
                <select
                  value={edit.color}
                  onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                >
                  {["pink", "green", "blue", "yellow", "lavender", "peach"].map(
                    (color, i) => (
                      <option key={color} value={color}>
                        {
                          [
                            "ھالرەڭ",
                            "يېشىل",
                            "كۆك",
                            "سېرىق",
                            "بىنەپشە",
                            "شاپتۇل رەڭ",
                          ][i]
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <label className="field">
              قىسقىچە تونۇشتۇرۇش
              <input
                maxLength={180}
                value={edit.excerpt}
                onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })}
              />
            </label>
            <label className="field">
              مەزمۇنى
              <textarea
                required
                rows={10}
                maxLength={10000}
                value={edit.body}
                onChange={(e) => setEdit({ ...edit, body: e.target.value })}
              />
            </label>
            <p className="privacy-note">
              {edit.body.length.toLocaleString("ar")} / ١٠٬٠٠٠
            </p>
            <div className="editor-actions">
              <Button type="submit">
                <Check size={18} /> دېمو بەتتە كۆرسىتىش
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => persist(true)}
              >
                لايىھە ساقلاش
              </Button>
              <button type="button" onClick={() => setPreview((v) => !v)}>
                <Eye size={18} /> ئالدىن كۆرۈش
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("ئۆزگەرتىشلەرنى ساقلىماي چىقامسىز؟"))
                    setEdit(null);
                }}
              >
                ۋاز كېچىش
              </button>
            </div>
          </form>
          <aside
            className={`editor-preview ${edit.color} ${preview ? "show-preview" : ""}`}
          >
            <span className="washi" />
            {edit.art ? (
              <Art art={edit.art} size={86} />
            ) : (
              <Art art={{ kind: "sticker", name: "sunflower" }} size={86} />
            )}
            <span className="eyebrow">{labels[edit.type]}</span>
            <h2>{edit.title || "يازما ماۋزۇسى"}</h2>
            <p>{edit.body || "بۇ يەردە سۆزلىرىڭىز جانلىنىدۇ…"}</p>
            {edit.art && (
              <button onClick={() => setEdit({ ...edit, art: undefined })}>
                بېزەكنى ئېلىۋېتىش
              </button>
            )}
          </aside>
        </div>
      ) : (
        <div className="management-list">
          {items.map((item) => (
            <article key={item.id}>
              <span className={`mini-paper ${item.color}`}>
                {item.art ? (
                  <Art art={item.art} size={40} />
                ) : (
                  <Pencil size={22} />
                )}
              </span>
              <div>
                <h3>{item.title}</h3>
                <span>
                  {labels[item.type]} · {item.draft ? "لايىھە" : "كۆرسىتىلگەن"}
                </span>
              </div>
              <div className="row-actions">
                <button
                  aria-label={`${item.title} — ئوقۇش`}
                  onClick={() => onRead(item)}
                >
                  <Eye size={18} />
                </button>
                <button
                  aria-label={`${item.title} — تەھرىرلەش`}
                  onClick={() => {
                    setEdit(item);
                    setPreview(false);
                  }}
                >
                  <Pencil size={18} />
                </button>
                <button
                  aria-label={`${item.title} — ئۆچۈرۈش`}
                  onClick={() => {
                    if (confirm("بۇ يازمىنى ئۆچۈرەمسىز؟"))
                      onChange(items.filter((x) => x.id !== item.id));
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
