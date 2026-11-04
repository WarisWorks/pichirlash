import { useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { exportFontCSS, forgetFontCSS } from "./imageExport";
import { Download, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { colors, isRecord, localDay } from "./model";
import { useLocal } from "./useLocal";
import type { CardContent } from "./PoetryPlayground";
import { StorageNotice } from "./Experience";
import ShareLinkButton from "@/components/features/ShareLinkButton";
type Card = CardContent & {
  font: "Karton" | "UKIJ Qolyazma" | "Noto Naskh Arabic";
  size: number;
};
const defaultCard: Card = {
  title: "بىر كىچىك ئۈمىد",
  text: "ھەر بىر يېڭى كۈن\nبىر يېڭى بەت.\n\nئارزۇلىرىڭىزنى\nمېھىر بىلەن ئاسراڭ.",
  art: "sunflower",
  color: "yellow",
  font: "Karton",
  size: 32,
};
const valid = (v: unknown): v is Card =>
  isRecord(v) &&
  ["title", "text", "art", "color"].every((k) => typeof v[k] === "string") &&
  ["Karton", "UKIJ Qolyazma", "Noto Naskh Arabic"].includes(String(v.font)) &&
  typeof v.size === "number" &&
  v.size >= 24 &&
  v.size <= 40;
export default function PostcardMaker({
  incoming,
  onReward,
}: {
  incoming?: CardContent;
  onReward: (id: string, label: string) => void;
}) {
  const {
    value: card,
    setValue: setCard,
    error,
  } = useLocal<Card>(
    "pichirlash-postcard-v1",
    defaultCard,
    valid,
    incoming
      ? {
          ...defaultCard,
          ...incoming,
          text: incoming.text,
          title: incoming.title.slice(0, 64),
        }
      : undefined,
  );
  const [scale, setScale] = useState(0.7),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [fitSize, setFitSize] = useState(card.size),
    [overflow, setOverflow] = useState(false),
    [exportedURL, setExportedURL] = useState("");
  const message = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null),
    design = useRef<HTMLDivElement>(null),
    downloadURL = useRef("");
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const resize = () => setScale(Math.min(1, el.clientWidth / 600));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(
    () => () => {
      if (downloadURL.current) URL.revokeObjectURL(downloadURL.current);
    },
    [],
  );
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled || !message.current) return;
      const el = message.current;
      let size = card.size;
      el.style.fontSize = `${size}px`;
      while (el.scrollHeight > el.clientHeight + 2 && size > 18) {
        size--;
        el.style.fontSize = `${size}px`;
      }
      setFitSize(size);
      setOverflow(el.scrollHeight > el.clientHeight + 2);
    });
    return () => {
      cancelled = true;
    };
  }, [card]);
  const download = async () => {
    if (!design.current || busy) return;
    if (overflow || card.text.length > 280) {
      setStatus("سۆزلەر قەغەزگە سىغمىدى. بىر ئاز قىسقارتىپ قايتا سىناڭ.");
      return;
    }
    if (!card.text.trim()) {
      setStatus("ئالدى بىلەن بىر قانچە سۆز يېزىڭ.");
      return;
    }
    setBusy(true);
    setStatus("رەسىم تەييارلىنىۋاتىدۇ…");
    try {
      await document.fonts.load(`${card.size}px "${card.font}"`);
      // The chosen local font is embedded explicitly; no remote font stylesheet is needed for export.
      const css = await exportFontCSS(card.font);
      const blob = await toBlob(design.current, {
        width: 600,
        height: 750,
        pixelRatio: 2,
        fontEmbedCSS: css,
        style: { transform: "none", width: "600px", height: "750px" },
      });
      if (!blob) throw Error("image");
      if (downloadURL.current) URL.revokeObjectURL(downloadURL.current);
      downloadURL.current = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadURL.current;
      link.download = "pichirlash-postcard.png";
      link.click();
      setExportedURL(downloadURL.current);
      onReward(`postcard:${localDay()}`, "بىر پوچتا كارتىسى");
      setStatus("رەسىم تەييار بولدى. چۈشۈرۈش باشلاندى.");
    } catch {
      setStatus(
        "رەسىم تەييارلاش مۇۋەپپەقىيەتلىك بولمىدى. قايتا سىناڭ؛ يېزىقلىرىڭىز يوقالمىدى.",
      );
      forgetFontCSS(card.font);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="play-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">سۆزلىرىڭىزگە بىر چىرايلىق رامكا</span>
          <h2>ئەسلىمە پوچتا كارتىسى</h2>
          <p>شېئىر، قوليازما ۋە چاپلاقتىن ئۆزىڭىزگە خاس كارتىڭىزنى ياساڭ.</p>
        </div>
        <ImageDown size={35} />
      </div>
      <div className="postcard-layout">
        <form
          className="postcard-controls"
          onSubmit={(e) => {
            e.preventDefault();
            void download();
          }}
        >
          <label className="field">
            ماۋزۇ
            <input
              maxLength={64}
              value={card.title}
              onChange={(e) => setCard({ ...card, title: e.target.value })}
            />
          </label>
          <label className="field">
            سۆزلەر
            <textarea
              rows={6}
              maxLength={280}
              value={card.text}
              onChange={(e) => setCard({ ...card, text: e.target.value })}
            />
          </label>
          <p className="local-hint">
            {card.text.length.toLocaleString("en-US")} / 280
          </p>
          <label className="field">
            يېزىق
            <select
              aria-label="يېزىق"
              value={card.font}
              onChange={(e) =>
                setCard({ ...card, font: e.target.value as Card["font"] })
              }
            >
              <option value="Karton">Karton</option>
              <option value="UKIJ Qolyazma">UKIJ Qolyazma</option>
              <option value="Noto Naskh Arabic">Noto Naskh Arabic</option>
            </select>
          </label>
          <label className="field">
            يېزىق چوڭلۇقى
            <input
              type="range"
              min={24}
              max={40}
              value={card.size}
              onChange={(e) => setCard({ ...card, size: +e.target.value })}
            />
          </label>
          <label className="field">
            قەغەز
            <select
              value={card.color}
              onChange={(e) => setCard({ ...card, color: e.target.value })}
            >
              {colors.map((c, i) => (
                <option value={c} key={c}>
                  {["سېرىق", "ھالرەڭ", "يېشىل", "كۆك", "بىنەپشە"][i]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            چاپلاق
            <select
              value={card.art}
              onChange={(e) => setCard({ ...card, art: e.target.value })}
            >
              {["sunflower", "teacup", "bunny", "owl", "comet", "bee"].map(
                (name, i) => (
                  <option value={name} key={name}>
                    {
                      ["گۈل", "چاي", "توشقان", "قۇش", "يۇلتۇز", "ھەسەل ھەرىسى"][
                        i
                      ]
                    }
                  </option>
                ),
              )}
            </select>
          </label>
          <Button
            disabled={
              busy || overflow || card.text.length > 280 || !card.text.trim()
            }
            type="submit"
          >
            <Download size={17} />
            {busy ? "تەييارلىنىۋاتىدۇ…" : "PNG رەسىم چۈشۈرۈش"}
          </Button>
          <p role="status" className="local-hint">
            {overflow || card.text.length > 280
              ? "سۆزلەر قەغەزگە سىغمىدى؛ تېكىست ياكى ماۋزۇنى بىر ئاز قىسقارتىڭ."
              : status}
          </p>
          <p className="local-hint">
            كارتىڭىز تورغا يوللانمايدۇ. رەسىمنى چۈشۈرۈپ ساقلىيالايسىز.
          </p>
          <ShareLinkButton
            disabled={!card.text.trim()}
            item={() => ({
              kind: "postcard",
              title: card.title,
              text: card.text,
              color: card.color,
              art: card.art,
            })}
          />
        </form>
        <div
          ref={viewport}
          className="postcard-viewport"
          style={{ height: 750 * scale }}
        >
          <div
            ref={design}
            className={`postcard-design ${card.color}`}
            style={{
              transform: `scale(${scale})`,
              fontFamily: `"${card.font}",serif`,
            }}
          >
            <span className="postcard-topline">كۆڭۈلدىن بىر پارچە</span>
            <Sticker name={card.art} size={100} />
            <h3>{card.title}</h3>
            <div
              className="postcard-message"
              ref={message}
              style={{ fontSize: fitSize }}
            >
              {card.text}
            </div>
            <div className="postcard-signature">پىچىرلاش · مېھىر بىلەن</div>
            <span className="postcard-rule" />
          </div>
        </div>
      </div>
      {exportedURL && (
        <details className="export-preview" open>
          <summary>ئاخىرقى تەييارلانغان رەسىم</summary>
          <p>تېلېفوندا رەسىمنى ئۇزۇن بېسىپمۇ ساقلىيالايسىز.</p>
          <a href={exportedURL} download="pichirlash-postcard.png">
            رەسىمنى قايتا چۈشۈرۈش
          </a>
          <img src={exportedURL} alt="تەييارلانغان ئۇيغۇرچە پوچتا كارتىسى" />
        </details>
      )}
      {error && <StorageNotice />}
    </section>
  );
}
