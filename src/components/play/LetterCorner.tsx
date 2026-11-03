import { useState } from "react";
import { Mail, MailOpen, Plus, Save, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { colors, uid, validLetters } from "./model";
import type { Letter } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
const blank = (): Letter => ({
  id: uid(),
  to: "كەلگۈسىدىكى ئۆزۈمگە",
  title: "بىر ئىللىق خەت",
  body: "",
  color: "yellow",
  stamp: "sunflower",
  sealed: false,
});
export default function LetterCorner({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const {
    value: letters,
    setValue: setLetters,
    error,
  } = useLocal<Letter[]>("pichirlash-letters-v1", [], validLetters);
  const [letter, setLetter] = useState<Letter>(blank),
    [opened, setOpened] = useState(false),
    [status, setStatus] = useState("");
  const store = (sealed: boolean) => {
    if (!letter.title.trim() || !letter.body.trim()) {
      setStatus("ماۋزۇ ۋە خەت مەزمۇنىنى يېزىڭ.");
      return;
    }
    const next = { ...letter, title: letter.title.trim(), sealed };
    setLetter(next);
    setLetters((v) => [next, ...v.filter((l) => l.id !== next.id)]);
    setOpened(false);
    setStatus(
      sealed
        ? "خەت پېچەتلەندى. كونۋېرتنى چېكىپ ئاچالايسىز."
        : "خەت لايىھە سۈپىتىدە ساقلاندى.",
    );
    if (sealed) onReward(`letter:${letter.id}`, "بىر ئىللىق خەت");
  };
  return (
    <section className="play-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">مېھىرنى قەغەزگە پۈكەيلى</span>
          <h2>خەت بۇلۇڭى</h2>
          <p>
            بۇ يەردىكى خەت ئەۋەتىلمەيدۇ. ئۇ پەقەت سىزنىڭ توركۆرگۈچىڭىزدە
            ساقلىنىدۇ.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (
              !letter.sealed &&
              letter.body &&
              !confirm(
                "ساقلىمىغان ئۆزگەرتىشلەردىن ۋاز كېچىپ، يېڭى خەت باشلامسىز؟",
              )
            )
              return;
            setLetter(blank());
            setOpened(false);
            setStatus("");
          }}
        >
          <Plus size={17} /> يېڭى خەت
        </Button>
      </div>
      <div className="letter-layout">
        {!letter.sealed ? (
          <form
            className="letter-form"
            onSubmit={(e) => {
              e.preventDefault();
              store(true);
            }}
          >
            <label className="field">
              كىمگە؟
              <input
                maxLength={80}
                value={letter.to}
                onChange={(e) => setLetter({ ...letter, to: e.target.value })}
              />
            </label>
            <label className="field">
              ماۋزۇ
              <input
                required
                maxLength={80}
                value={letter.title}
                onChange={(e) =>
                  setLetter({ ...letter, title: e.target.value })
                }
              />
            </label>
            <label className="field">
              كۆڭۈل سۆزلىرى
              <textarea
                required
                maxLength={5000}
                rows={9}
                value={letter.body}
                onChange={(e) => setLetter({ ...letter, body: e.target.value })}
                placeholder="بۈگۈن سىزگە ئېيتقۇم بار…"
              />
            </label>
            <div className="editor-options">
              <label className="field">
                قەغەز
                <select
                  value={letter.color}
                  onChange={(e) =>
                    setLetter({ ...letter, color: e.target.value })
                  }
                >
                  {colors.map((c, i) => (
                    <option value={c} key={c}>
                      {["سېرىق", "ھالرەڭ", "يېشىل", "كۆك", "بىنەپشە"][i]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                پېچەت
                <select
                  value={letter.stamp}
                  onChange={(e) =>
                    setLetter({ ...letter, stamp: e.target.value })
                  }
                >
                  {["sunflower", "smiley", "teacup", "bunny"].map((name, i) => (
                    <option value={name} key={name}>
                      {["گۈل", "كۈلكە", "چاي", "توشقان"][i]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="editor-actions">
              <Button type="submit">
                <Mail size={17} /> قاتلاپ پېچەتلەش
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => store(false)}
              >
                <Save size={17} /> لايىھە ساقلاش
              </Button>
            </div>
          </form>
        ) : (
          <div className={`folded-letter ${opened ? "is-open" : ""}`}>
            <div className="envelope-stage">
              <div className="envelope-paper" />
              <div className="envelope-pocket" />
              <div className="envelope-flap" />
              <button
                className="envelope-seal"
                aria-label={opened ? "خەتنى تاقاش" : "پېچەتلەنگەن خەتنى ئېچىش"}
                aria-expanded={opened}
                onClick={() => setOpened((v) => !v)}
              >
                <Sticker name={letter.stamp} size={74} />
              </button>
            </div>
            <p className="envelope-address">{letter.to}</p>
            <Button variant="outline" onClick={() => setOpened((v) => !v)}>
              {opened ? <Mail size={17} /> : <MailOpen size={17} />}{" "}
              {opened ? "خەتنى قاتلاش" : "خەتنى ئېچىش"}
            </Button>
            {opened && (
              <article className={`opened-letter ${letter.color}`}>
                <span className="washi" />
                <h3>{letter.title}</h3>
                <p className="letter-recipient">{letter.to}</p>
                <div>{letter.body}</div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLetter({ ...letter, sealed: false });
                    setOpened(false);
                  }}
                >
                  <Pencil size={16} /> قايتا تەھرىرلەش
                </Button>
              </article>
            )}
          </div>
        )}
        {!letter.sealed && (
          <aside className={`letter-preview ${letter.color}`}>
            <Sticker name={letter.stamp} size={80} />
            <p>{letter.to}</p>
            <h3>{letter.title}</h3>
            <div>{letter.body || "سىزنىڭ ئىللىق سۆزلىرىڭىزنى كۈتۈۋاتىدۇ…"}</div>
          </aside>
        )}
      </div>
      <p role="status" className="local-hint">
        {status}
      </p>
      <h3>خەت ساندۇقۇم</h3>
      {!letters.length ? (
        <p className="local-hint">
          ساقلىغان ۋە پېچەتلىگەن خەتلىرىڭىز مۇشۇ يەردە كۆرۈنىدۇ.
        </p>
      ) : (
        <div className="letter-shelf">
          {letters.map((l) => (
            <article key={l.id}>
              <button
                onClick={() => {
                  setLetter(l);
                  setOpened(false);
                  setStatus("");
                }}
              >
                <Sticker name={l.stamp} size={45} />
                <span>
                  <strong>{l.title}</strong>
                  <small>
                    {l.to} · {l.sealed ? "پېچەتلەنگەن" : "لايىھە"}
                  </small>
                </span>
              </button>
              <button
                aria-label={`${l.title} — خەتنى ئۆچۈرۈش`}
                onClick={() => {
                  if (confirm("بۇ خەتنى ئۆچۈرەمسىز؟")) {
                    setLetters((v) => v.filter((x) => x.id !== l.id));
                    if (letter.id === l.id) setLetter(blank());
                  }
                }}
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
      )}
      {error && <StorageNotice />}
    </section>
  );
}
