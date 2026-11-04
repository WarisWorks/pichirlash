import { useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import {
  Mail,
  MailOpen,
  Plus,
  Save,
  Trash2,
  Pencil,
  Download,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  FileArchive,
  Feather,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uid, validLetters, localDay } from "./model";
import type { Letter } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import { copyText, exportFontCSS, forgetFontCSS } from "./imageExport";
import {
  designOf,
  stationery,
  letterExamples,
  letterMailto,
  letterPlainText,
  validRecipientEmail,
  paginateLetter,
} from "./letterDesign";
import ClassicLetterPaper, {
  Flourish,
  WaxSeal,
  LETTER_BODY_HEIGHT,
  LETTER_BODY_WIDTH,
  LETTER_HEIGHT,
  LETTER_WIDTH,
} from "./ClassicLetterPaper";
import "./classicLetters.css";
const blank = (): Letter => ({
  id: uid(),
  to: "كەلگۈسىدىكى ئۆزۈمگە",
  title: "بىر ئىللىق خەت",
  body: "",
  color: "yellow",
  stamp: "sunflower",
  sealed: false,
  design: "ivory",
  from: "",
  date: localDay(),
  email: "",
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
    [status, setStatus] = useState(""),
    [example, setExample] = useState<string>("thanks"),
    [page, setPage] = useState(0),
    [scale, setScale] = useState(0.6),
    [busy, setBusy] = useState(false),
    [shareOptions, setShareOptions] = useState(false),
    [manualCopy, setManualCopy] = useState(false);
  const [layout, setLayout] = useState<{
    text: string;
    parts: string[];
    error: string;
  }>({ text: "", parts: [""], error: "" });
  const [images, setImages] = useState<{
    key: string;
    blobs: Blob[];
    urls: string[];
  } | null>(null);
  const [archive, setArchive] = useState<{
    key: string;
    url: string;
  } | null>(null);
  const measure = useRef<HTMLDivElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    captures = useRef<(HTMLDivElement | null)[]>([]),
    generation = useRef(0),
    urls = useRef<string[]>([]);
  const design = designOf(letter.design),
    pages = layout.text === letter.body ? layout.parts : [""],
    safePage = Math.min(page, pages.length - 1),
    ready =
      !!letter.body.trim() &&
      !!letter.title.trim() &&
      layout.text === letter.body &&
      !layout.error;
  const imageKey = JSON.stringify([
    letter.id,
    letter.to,
    letter.title,
    letter.body,
    letter.from,
    letter.date,
    design.id,
  ]);
  const cached = images?.key === imageKey ? images : null;
  const readyArchive = archive?.key === imageKey ? archive : null;
  const canNativeShare =
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";
  const emailValid = validRecipientEmail(letter.email || ""),
    mailto = letterMailto(letter);
  const update = (patch: Partial<Letter>) => {
    setLetter((v) => ({ ...v, ...patch }));
    setStatus("");
    if (patch.body !== undefined) setPage(0);
  };
  useEffect(
    () => () => {
      generation.current++;
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const resize = () => setScale(Math.min(1, el.clientWidth / LETTER_WIDTH));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [letter.sealed, opened]);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void document.fonts
        .load('24px "Karton"')
        .then(() => {
          if (cancelled || !measure.current) return;
          const el = measure.current;
          try {
            const parts = paginateLetter(letter.body, (text) => {
              el.textContent = text;
              return el.scrollHeight <= LETTER_BODY_HEIGHT + 1;
            });
            if (!cancelled) setLayout({ text: letter.body, parts, error: "" });
          } catch {
            if (!cancelled)
              setLayout({
                text: letter.body,
                parts: [letter.body],
                error:
                  "خەتنىڭ بەت سانى بەك كۆپ. ئارتۇق قۇرلارنى ئازايتىڭ ياكى خەتنى قىسقارتىڭ؛ تېكىستىڭىز يوقالمىدى.",
              });
          }
        })
        .catch(() => {
          if (!cancelled)
            setLayout({
              text: letter.body,
              parts: [letter.body],
              error:
                "فونت تېخى تەييار بولمىدى. تور ئۇلىنىشىنى تەكشۈرۈپ بىر ئازدىن كېيىن قايتا سىناڭ.",
            });
        });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [letter.body]);
  const saveLetter = (sealed: boolean) => {
    if (!letter.title.trim() || !letter.body.trim()) {
      setStatus("ماۋزۇ ۋە خەت مەزمۇنىنى يېزىڭ.");
      return;
    }
    const next = {
      ...letter,
      title: letter.title.trim(),
      sealed,
      design: design.id,
    };
    setLetter(next);
    setLetters((v) => [next, ...v.filter((x) => x.id !== next.id)]);
    setOpened(false);
    setStatus(
      sealed
        ? "خەت پېچەتلەندى. ئۇنى ئېچىپ ئوقۇيالايسىز ياكى رەسىم قىلىپ ساقلىيالايسىز."
        : "خەت ۋە قەغەز تاللىشىڭىز لايىھە سۈپىتىدە ساقلاندى.",
    );
    if (sealed) onReward(`letter:${letter.id}`, "بىر ئىللىق خەت");
  };
  const applyExample = () => {
    const selected = letterExamples.find((x) => x.id === example);
    if (!selected) return;
    if (
      letter.body.trim() &&
      !confirm(
        "بۇ ئەندىزە ھازىرقى تېكىستنىڭ ئورنىغا قويۇلىدۇ. داۋاملاشتۇرامسىز؟",
      )
    )
      return;
    update({
      to: selected.to,
      title: selected.title,
      body: selected.body,
      sealed: false,
    });
    setOpened(false);
    setPage(0);
    setStatus("ئەندىزە قوشۇلدى. سۆزلىرىنى ئۆزىڭىزگە ماسلاشتۇرۇڭ.");
  };
  const prepare = async (): Promise<Blob[] | null> => {
    if (cached) return cached.blobs;
    if (!ready || busy) return null;
    const token = generation.current;
    setBusy(true);
    setStatus("خېتىڭىزنىڭ رەسىمى تەييارلىنىۋاتىدۇ…");
    try {
      await document.fonts.load('24px "Karton"');
      const fontEmbedCSS = await exportFontCSS();
      const blobs: Blob[] = [];
      for (let index = 0; index < pages.length; index++) {
        if (token !== generation.current) return null;
        const node = captures.current[index]
          ?.firstElementChild as HTMLElement | null;
        if (!node) throw Error("page-not-ready");
        const heading = node.querySelector<HTMLElement>(".classic-title"),
          meta = node.querySelector<HTMLElement>(".classic-meta"),
          signature = node.querySelector<HTMLElement>(".classic-signature");
        if (
          (heading && heading.scrollHeight > heading.clientHeight + 2) ||
          (meta && meta.scrollHeight > meta.clientHeight + 2) ||
          (signature && signature.scrollHeight > signature.clientHeight + 2)
        )
          throw Error("headers-too-long");
        setStatus(
          `رەسىم تەييارلىنىۋاتىدۇ: ${(index + 1).toLocaleString("en-US")} / ${pages.length.toLocaleString("en-US")}`,
        );
        const blob = await toBlob(node, {
          width: LETTER_WIDTH,
          height: LETTER_HEIGHT,
          pixelRatio: 1.5,
          fontEmbedCSS,
          style: {
            transform: "none",
            width: `${LETTER_WIDTH}px`,
            height: `${LETTER_HEIGHT}px`,
          },
        });
        if (!blob) throw Error("image-failed");
        blobs.push(blob);
      }
      if (token !== generation.current) return null;
      const nextURLs = blobs.map((blob) => URL.createObjectURL(blob));
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current = [...nextURLs];
      setArchive(null);
      setImages({ key: imageKey, blobs, urls: nextURLs });
      setLetters((v) => [
        { ...letter, design: design.id },
        ...v.filter((x) => x.id !== letter.id),
      ]);
      setStatus("رەسىم تەييار. چۈشۈرەلەيسىز ياكى ھەمبەھىرلىيەلەيسىز.");
      return blobs;
    } catch (reason) {
      forgetFontCSS("Karton");
      if (token === generation.current)
        setStatus(
          reason instanceof Error && reason.message === "headers-too-long"
            ? "ماۋزۇ، ئىمزا ياكى قوبۇل قىلغۇچىنىڭ ئىسمى بەك ئۇزۇن. بىر ئاز قىسقارتىپ قايتا سىناڭ."
            : "رەسىم تەييارلاش مۇۋەپپەقىيەتلىك بولمىدى. قايتا سىناڭ؛ خېتىڭىز يوقالمىدى.",
        );
      return null;
    } finally {
      if (token === generation.current) setBusy(false);
    }
  };
  const downloadFile = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
  };
  const downloadPage = async () => {
    const blobs = await prepare();
    if (!blobs) return;
    downloadFile(blobs[safePage], `pichirlash-letter-${safePage + 1}.png`);
    setStatus("چۈشۈرۈش باشلاندى. تۆۋەندىكى تەييار رەسىمنىمۇ ساقلىيالايسىز.");
  };
  const downloadAll = async () => {
    const blobs = await prepare();
    if (!blobs) return;
    if (blobs.length === 1) {
      downloadFile(blobs[0], "pichirlash-letter.png");
      return;
    }
    const token = generation.current;
    setBusy(true);
    setStatus("بارلىق بەتلەر بىر ھۆججەتكە توپلىنىۋاتىدۇ…");
    try {
      const { zipSync } = await import("fflate");
      const files: Record<string, Uint8Array> = {};
      for (let i = 0; i < blobs.length; i++)
        files[`pichirlash-letter-${String(i + 1).padStart(2, "0")}.png`] =
          new Uint8Array(await blobs[i].arrayBuffer());
      if (token !== generation.current) return;
      const url = URL.createObjectURL(
        new Blob([zipSync(files, { level: 0 }) as BlobPart], {
          type: "application/zip",
        }),
      );
      urls.current.push(url);
      setArchive({ key: imageKey, url });
      setStatus("ZIP ھۆججىتى تەييار. تۆۋەندىكى ئۇلانمىنى بېسىپ چۈشۈرۈڭ.");
    } catch {
      setStatus(
        "بەتلەرنى توپلىغىلى بولمىدى. ھەر بىر بەتنى ئايرىم چۈشۈرەلەيسىز.",
      );
    } finally {
      if (token === generation.current) setBusy(false);
    }
  };
  const share = async () => {
    setShareOptions(true);
    if (!cached) {
      await prepare();
      return;
    }
    const files = cached.blobs.map(
      (blob, i) =>
        new File([blob], `pichirlash-letter-${i + 1}.png`, {
          type: "image/png",
        }),
    );
    let fileSharing = false;
    try {
      fileSharing = canNativeShare && navigator.canShare({ files });
    } catch {
      fileSharing = false;
    }
    if (!fileSharing) {
      setStatus(
        "بۇ توركۆرگۈچتە بىۋاسىتە رەسىم ھەمبەھىرلەش يوق. رەسىمنى چۈشۈرۈپ ئۇچۇرىڭىزغا قوشۇڭ ياكى ئېلخەتنى تەييارلاڭ.",
      );
      return;
    }
    try {
      await navigator.share({ files, title: letter.title, text: letter.to });
      setStatus(
        "ھەمبەھىرلەش كۆزنىكى يېپىلدى. ئەۋەتىش نەتىجىسىنى تاللىغان ئەپىڭىزدىن تەكشۈرۈڭ.",
      );
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError")
        setStatus("ھەمبەھىرلەش بىكار قىلىندى. خېتىڭىز ساقلاندى.");
      else
        setStatus(
          "بىۋاسىتە ھەمبەھىرلەش ئېچىلمىدى. رەسىمنى چۈشۈرۈپ ئەۋەتىشنى سىناڭ.",
        );
    }
  };
  const copy = async () => {
    try {
      await copyText(letterPlainText(letter));
      setStatus("خەت تېكىستى كۆچۈرۈلدى.");
      setManualCopy(false);
    } catch {
      setManualCopy(true);
      setStatus("تۆۋەندىكى تېكىستنى تاللاپ قولدا كۆچۈرۈڭ.");
    }
  };
  const renderPreview = () => (
    <div className="classic-preview-column" id="classic-letter-preview">
      <div className="classic-preview-top">
        <span>خەتنىڭ كۆرۈنۈشى</span>
        <span>{design.name}</span>
      </div>
      <div
        ref={viewport}
        className="classic-preview-viewport"
        style={{ height: LETTER_HEIGHT * scale }}
      >
        <div
          className="classic-preview-scale"
          style={{ transform: `scale(${scale})` }}
        >
          <ClassicLetterPaper
            letter={letter}
            text={pages[safePage] || ""}
            page={safePage}
            count={pages.length}
          />
        </div>
      </div>
      <div className="classic-pagination">
        <button
          type="button"
          aria-label="خەتنىڭ ئالدىنقى بېتى"
          disabled={!safePage || busy}
          onClick={() => setPage((v) => v - 1)}
        >
          <ArrowRight size={16} />
        </button>
        <span>
          {(safePage + 1).toLocaleString("en-US")} /{" "}
          {pages.length.toLocaleString("en-US")}
        </span>
        <button
          type="button"
          aria-label="خەتنىڭ كېيىنكى بېتى"
          disabled={safePage >= pages.length - 1 || busy}
          onClick={() => setPage((v) => v + 1)}
        >
          <ArrowLeft size={16} />
        </button>
      </div>
    </div>
  );
  return (
    <section className="play-panel classic-letter-corner">
      <div className="play-heading">
        <div>
          <span className="eyebrow">سىياھ، قەغەز ۋە بىر پارچە مېھىر</span>
          <h2>كلاسسىك خەت دەپتىرى</h2>
          <p>
            خېتىڭىزنى نەپىس قەغەزدە تەييارلاڭ. رەسىم قىلىپ ساقلاڭ، ئېلخەتتە
            تەييارلاڭ ياكى ئۈسكۈنىڭىزدىن ھەمبەھىرلەڭ.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={busy}
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
            setPage(0);
            setStatus("");
            setShareOptions(false);
          }}
        >
          <Plus size={17} /> يېڭى خەت
        </Button>
      </div>
      <fieldset className="stationery-picker" disabled={busy}>
        <legend>قەغەز ئەندىزىسىنى تاللاڭ</legend>
        <div className="stationery-options">
          {stationery.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`stationery-option design-${item.id}`}
              aria-label={`${item.name} — خەت قەغىزى`}
              aria-pressed={design.id === item.id}
              onClick={() => update({ design: item.id })}
            >
              <span
                className="stationery-mini"
                style={{ background: item.paper, color: item.accent }}
              >
                <span className="mini-border" />
                <Flourish kind={item.id} />
                <span className="mini-letter-line" />
                <span className="mini-letter-line short" />
                <span className="mini-letter-line" />
                <span className="mini-wax" />
              </span>
              <span className="stationery-option-name">
                {item.name}
                {design.id === item.id && <Check size={15} />}
              </span>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="classic-jumplinks">
        <button
          disabled={busy}
          type="button"
          onClick={() => {
            update({ sealed: false });
            setOpened(false);
            requestAnimationFrame(() =>
              document
                .getElementById("classic-letter-editor")
                ?.scrollIntoView(),
            );
          }}
        >
          خەتنى يېزىش
        </button>
        <button
          disabled={busy}
          type="button"
          onClick={() => {
            setOpened(true);
            requestAnimationFrame(() =>
              document
                .getElementById("classic-letter-preview")
                ?.scrollIntoView(),
            );
          }}
        >
          ئالدىن كۆرۈش
        </button>
        <button
          disabled={busy}
          type="button"
          onClick={() =>
            document.getElementById("classic-letter-delivery")?.scrollIntoView()
          }
        >
          چۈشۈرۈش ۋە ئەۋەتىش
        </button>
      </div>
      {!letter.sealed ? (
        <div className="classic-letter-layout">
          <form
            id="classic-letter-editor"
            className="letter-form classic-letter-form"
            onSubmit={(e) => {
              e.preventDefault();
              saveLetter(true);
            }}
          >
            <fieldset disabled={busy}>
              <div className="example-intake">
                <label className="field">
                  سۆز ئەندىزىسى
                  <select
                    aria-label="خەت سۆز ئەندىزىسى"
                    value={example}
                    onChange={(e) => setExample(e.target.value)}
                  >
                    {letterExamples.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Button type="button" variant="outline" onClick={applyExample}>
                  <Feather size={16} /> ئەندىزىنى ئىشلىتىش
                </Button>
              </div>
              <label className="field">
                كىمگە؟
                <input
                  maxLength={80}
                  value={letter.to}
                  onChange={(e) => update({ to: e.target.value })}
                />
              </label>
              <label className="field">
                ماۋزۇ
                <input
                  required
                  maxLength={80}
                  value={letter.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </label>
              <label className="field">
                كۆڭۈل سۆزلىرى
                <textarea
                  required
                  maxLength={5000}
                  rows={9}
                  value={letter.body}
                  onChange={(e) => update({ body: e.target.value })}
                  placeholder="بۈگۈن سىزگە ئېيتقۇم بار…"
                />
              </label>
              <p className="local-hint">
                {letter.body.length.toLocaleString("en-US")} / 5,000 · ئۇزۇن خەت
                بەتلەرگە ئايرىلىدۇ.
              </p>
              <label className="field">
                ئىمزا — ئىسمىڭىز
                <input
                  maxLength={80}
                  value={letter.from || ""}
                  onChange={(e) => update({ from: e.target.value })}
                  placeholder="ئىسمىڭىزنى يېزىڭ"
                />
              </label>
              <label className="field">
                چېسلا
                <input
                  type="date"
                  value={letter.date || ""}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </label>
              <div className="editor-actions">
                <Button type="submit">
                  <Mail size={17} /> قاتلاپ پېچەتلەش
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => saveLetter(false)}
                >
                  <Save size={17} /> لايىھە ساقلاش
                </Button>
              </div>
            </fieldset>
          </form>
          {renderPreview()}
        </div>
      ) : (
        <>
          <div
            className={`folded-letter classic-folded-letter ${opened ? "is-open" : ""}`}
          >
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
                <WaxSeal />
              </button>
            </div>
            <p className="envelope-address">{letter.to}</p>
            <div className="classic-envelope-actions">
              <Button variant="outline" onClick={() => setOpened((v) => !v)}>
                {opened ? <Mail size={17} /> : <MailOpen size={17} />}{" "}
                {opened ? "خەتنى قاتلاش" : "خەتنى ئېچىش"}
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  update({ sealed: false });
                  setOpened(false);
                }}
              >
                <Pencil size={16} /> قايتا تەھرىرلەش
              </Button>
            </div>
          </div>
          {opened && (
            <div className="classic-opened-preview">{renderPreview()}</div>
          )}
        </>
      )}
      {layout.error && (
        <p role="alert" className="storage-warning">
          {layout.error}
        </p>
      )}
      <section className="letter-delivery" id="classic-letter-delivery">
        <div>
          <span className="eyebrow">خەت تەييار بولغاندا</span>
          <h3>ساقلاڭ ياكى ھەمبەھىرلەڭ</h3>
          <p>
            رەسىم ئەۋەتىش ئۈچۈن چۈشۈرۈپ ئۇچۇرىڭىزغا قوشۇڭ. ئېلخەت كۇنۇپكىسى
            پەقەت تېكىستنى ئەپىڭىزدە تەييارلايدۇ؛ ئۆزى ئەۋەتمەيدۇ.
          </p>
        </div>
        <div className="letter-export-buttons">
          <Button disabled={!ready || busy} onClick={() => void downloadPage()}>
            <Download size={17} />
            {busy
              ? "تەييارلىنىۋاتىدۇ…"
              : pages.length > 1
                ? "بۇ بەتنى PNG چۈشۈرۈش"
                : "خەتنى PNG چۈشۈرۈش"}
          </Button>
          {pages.length > 1 && !readyArchive && (
            <Button
              variant="outline"
              disabled={!ready || busy}
              onClick={() => void downloadAll()}
            >
              <FileArchive size={17} /> بارلىق بەتلەر — ZIP تەييارلاش
            </Button>
          )}
          <Button
            variant="outline"
            disabled={!ready || busy}
            onClick={() => void share()}
          >
            <Share2 size={17} />
            {!cached
              ? "رەسىمنى ھەمبەھىرلەشكە تەييارلاش"
              : canNativeShare
                ? "رەسىمنى ھەمبەھىرلەش"
                : "ئەۋەتىش تاللانمىلىرى"}
          </Button>
          <Button
            variant="ghost"
            disabled={!letter.body.trim() || busy}
            onClick={() => setShareOptions((v) => !v)}
          >
            <Mail size={17} /> ئېلخەت ۋە كۆچۈرۈش
          </Button>
        </div>
        {readyArchive && (
          <a
            className="classic-email-link classic-archive-link"
            href={readyArchive.url}
            download="pichirlash-letter-pages.zip"
          >
            <FileArchive size={17} /> تەييار ZIP ھۆججىتىنى چۈشۈرۈش
          </a>
        )}
        {shareOptions && (
          <div className="letter-share-options">
            <label className="field">
              قوبۇل قىلغۇچىنىڭ ئېلخەت ئادرېسى — ئىختىيارىي
              <input
                type="email"
                disabled={busy}
                value={letter.email || ""}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="name@example.com"
                aria-invalid={!emailValid}
              />
            </label>
            {!emailValid && <p role="alert">ئېلخەت ئادرېسىنى توغرا يېزىڭ.</p>}
            <div className="editor-actions">
              {mailto ? (
                <a
                  className="classic-email-link"
                  href={mailto}
                  onClick={() =>
                    setStatus(
                      "ئېلخەت ئەپىڭىزدە تېكىست تەييارلىنىدۇ. رەسىمنى ئۆزىڭىز قوشۇپ، ئەۋەتىشنى ئەپتىن جەزملەڭ.",
                    )
                  }
                >
                  <Mail size={17} /> ئېلخەت ئەپىنى ئېچىش
                </a>
              ) : (
                <span className="local-hint">
                  توغرا ئېلخەت ئادرېسى ۋە خەت مەزمۇنى كېرەك.
                </span>
              )}
              <Button
                variant="outline"
                disabled={!letter.body.trim()}
                onClick={() => void copy()}
              >
                <Copy size={17} /> خەت تېكىستىنى كۆچۈرۈش
              </Button>
            </div>
            <p className="local-hint">
              بۇ توركۆرگۈچتە رەسىم ھەمبەھىرلەش بولمىسا، PNG ھۆججىتىنى چۈشۈرۈپ
              تاللىغان ئەپىڭىزگە قوشالايسىز. خەت پەقەت مۇشۇ توركۆرگۈچتە
              ساقلىنىدۇ.
            </p>
          </div>
        )}
        {manualCopy && (
          <label className="field">
            قولدا كۆچۈرۈش
            <textarea
              rows={6}
              readOnly
              value={letterPlainText(letter)}
              onFocus={(e) => e.target.select()}
            />
          </label>
        )}
        <p className="letter-delivery-status" role="status">
          {status}
        </p>
      </section>
      {cached && (
        <details className="export-preview" open>
          <summary>تەييارلانغان خەت رەسىمى</summary>
          <p>تېلېفوندا رەسىمنى ئۇزۇن بېسىپمۇ ساقلىيالايسىز.</p>
          <div className="letter-export-gallery">
            {cached.urls.map((url, index) => (
              <figure key={url}>
                <a href={url} download={`pichirlash-letter-${index + 1}.png`}>
                  بەت {(index + 1).toLocaleString("en-US")} — چۈشۈرۈش
                </a>
                <img
                  src={url}
                  alt={`تەييارلانغان كلاسسىك خەت — بەت ${index + 1}`}
                />
              </figure>
            ))}
          </div>
        </details>
      )}
      <h3 className="letter-archive-title">خەت ساندۇقۇم</h3>
      {!letters.length ? (
        <p className="local-hint">
          ساقلىغان ۋە پېچەتلىگەن خەتلىرىڭىز مۇشۇ يەردە كۆرۈنىدۇ.
        </p>
      ) : (
        <div className="letter-shelf classic-letter-shelf">
          {letters.map((item) => (
            <article key={item.id}>
              <button
                disabled={busy}
                onClick={() => {
                  if (
                    !letter.sealed &&
                    letter.id !== item.id &&
                    letter.body &&
                    !confirm(
                      "باشقا خەتنى ئېچىشتىن بۇرۇن ساقلىمىغان ئۆزگەرتىشلەردىن ۋاز كېچەمسىز؟",
                    )
                  )
                    return;
                  setLetter(item);
                  setOpened(false);
                  setPage(0);
                  setStatus("");
                  setShareOptions(false);
                }}
              >
                <WaxSeal small />
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.to} · {item.sealed ? "پېچەتلەنگەن" : "لايىھە"} ·{" "}
                    {designOf(item.design).name}
                  </small>
                </span>
              </button>
              <button
                disabled={busy}
                aria-label={`${item.title} — خەتنى ئۆچۈرۈش`}
                onClick={() => {
                  if (confirm("بۇ خەتنى ئۆچۈرەمسىز؟")) {
                    setLetters((v) => v.filter((x) => x.id !== item.id));
                    if (letter.id === item.id) setLetter(blank());
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
      <div className="classic-capture-plane" aria-hidden="true">
        {pages.map((text, index) => (
          <div
            key={index}
            ref={(el) => {
              captures.current[index] = el;
            }}
          >
            <ClassicLetterPaper
              letter={letter}
              text={text}
              page={index}
              count={pages.length}
            />
          </div>
        ))}
      </div>
      <div
        ref={measure}
        className="classic-body classic-letter-measure"
        style={{ width: LETTER_BODY_WIDTH, height: LETTER_BODY_HEIGHT }}
        aria-hidden="true"
      />
    </section>
  );
}
