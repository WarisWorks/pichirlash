import { useEffect, useRef, useState } from "react";
import { Delete, CornerDownLeft, Keyboard, X, Space } from "lucide-react";
import { latinToArabic } from "@/lib/uyghur/script";
import { useLocal } from "@/components/play/useLocal";
import { isRecord } from "@/components/play/model";

type TextField = HTMLInputElement | HTMLTextAreaElement;
const TEXT_TYPES = new Set(["text", "search", ""]);
const isTextField = (el: EventTarget | null): el is TextField =>
  (el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement && TEXT_TYPES.has(el.type))) &&
  !el.readOnly &&
  !el.disabled &&
  el.closest(".uyghur-keyboard .latin-box") === null;

/** The standard Uyghur computer keyboard layout (keys on a QWERTY keyboard). */
export const physicalLayout: Record<string, string> = {
  q: "چ", w: "ۋ", e: "ې", r: "ر", t: "ت", y: "ي", u: "ۇ", i: "ڭ", o: "و", p: "پ",
  a: "ھ", s: "س", d: "د", f: "ا", g: "ە", h: "ى", j: "ق", k: "ك", l: "ل", ";": "؛",
  z: "ز", x: "ش", c: "غ", v: "ۈ", b: "ب", n: "ن", m: "م", ",": "،", "/": "ئ",
  D: "ژ", F: "ف", G: "گ", H: "خ", J: "ج", K: "ۆ", "?": "؟",
};
const rows = [
  ["چ", "ۋ", "ې", "ر", "ت", "ي", "ۇ", "ڭ", "و", "پ"],
  ["ھ", "س", "د", "ا", "ە", "ى", "ق", "ك", "ل"],
  ["ز", "ش", "غ", "ۈ", "ب", "ن", "م", "ئ"],
  ["ژ", "ف", "گ", "خ", "ج", "ۆ", "،", "؟", ".", "«", "»"],
];

/** Insert text at the caret in a way React-controlled fields notice (keeps undo too). */
export function insertIntoField(field: TextField, text: string) {
  field.focus();
  if (document.execCommand?.("insertText", false, text)) return;
  const start = field.selectionStart ?? field.value.length,
    end = field.selectionEnd ?? field.value.length;
  const proto =
    field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(field, field.value.slice(0, start) + text + field.value.slice(end));
  field.setSelectionRange(start + text.length, start + text.length);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}
function deleteBefore(field: TextField) {
  field.focus();
  if (document.execCommand?.("delete", false)) return;
  const start = field.selectionStart ?? 0,
    end = field.selectionEnd ?? 0;
  if (start === end && start === 0) return;
  const from = start === end ? start - 1 : start;
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(field),
    "value",
  )?.set;
  setter?.call(field, field.value.slice(0, from) + field.value.slice(end));
  field.setSelectionRange(from, from);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

type Prefs = { physical: boolean };
const validPrefs = (v: unknown): v is Prefs =>
  isRecord(v) && typeof v.physical === "boolean";

export default function UyghurKeyboard() {
  const [open, setOpen] = useState(false),
    [tab, setTab] = useState<"keys" | "latin">("keys"),
    [latin, setLatin] = useState(""),
    [hasTarget, setHasTarget] = useState(false),
    [status, setStatus] = useState("");
  const { value: prefs, setValue: setPrefs } = useLocal<Prefs>(
    "pichirlash-keyboard-v1",
    { physical: false },
    validPrefs,
  );
  const target = useRef<TextField | null>(null);
  useEffect(() => {
    const track = (e: FocusEvent) => {
      if (isTextField(e.target)) {
        target.current = e.target;
        setHasTarget(true);
      }
    };
    document.addEventListener("focusin", track);
    return () => document.removeEventListener("focusin", track);
  }, []);
  useEffect(() => {
    if (!prefs.physical) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (!isTextField(e.target) || e.target.dir === "ltr") return;
      const mapped = physicalLayout[e.key];
      if (!mapped) return;
      e.preventDefault();
      insertIntoField(e.target, mapped);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [prefs.physical]);
  const field = () => {
    const el = target.current;
    if (el && el.isConnected) return el;
    setStatus("ئالدى بىلەن يازىدىغان ئورۇننى (تېكىست رامكىسىنى) چېكىڭ.");
    return null;
  };
  const type = (text: string) => {
    const el = field();
    if (!el) return;
    if (text === "\n" && !(el instanceof HTMLTextAreaElement)) return;
    insertIntoField(el, text);
    setStatus("");
  };
  const converted = latinToArabic(latin);
  return (
    <div className="uyghur-keyboard" dir="rtl">
      <button
        type="button"
        className="keyboard-toggle"
        aria-expanded={open}
        aria-controls="uyghur-keyboard-panel"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={18} /> : <Keyboard size={18} />}
        <span>ئۇيغۇرچە كۇنۇپكا</span>
      </button>
      {open && (
        <div
          id="uyghur-keyboard-panel"
          className="keyboard-panel"
          role="region"
          aria-label="ئۇيغۇرچە كۇنۇپكا تاختىسى"
        >
          <div className="keyboard-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "keys"}
              onClick={() => setTab("keys")}
            >
              ھەرپلەر
            </button>
            <button
              role="tab"
              aria-selected={tab === "latin"}
              onClick={() => setTab("latin")}
            >
              لاتىنچە يېزىپ ئايلاندۇرۇش
            </button>
          </div>
          {!hasTarget && (
            <p className="local-hint">
              يېزىش ئۈچۈن بەتتىكى بىر تېكىست رامكىسىنى چېكىڭ، ئاندىن ھەرپلەرنى
              بېسىڭ.
            </p>
          )}
          {tab === "keys" ? (
            <div className="key-rows">
              {rows.map((row, r) => (
                <div className="key-row" key={r}>
                  {row.map((key) => (
                    <button
                      type="button"
                      key={key}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => type(key)}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              <div className="key-row">
                <button
                  type="button"
                  className="wide"
                  aria-label="بوشلۇق"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => type(" ")}
                >
                  <Space size={18} />
                </button>
                <button
                  type="button"
                  aria-label="يېڭى قۇر"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => type("\n")}
                >
                  <CornerDownLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="ئۆچۈرۈش"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const el = field();
                    if (el) deleteBefore(el);
                  }}
                >
                  <Delete size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="latin-box">
              <label className="field">
                لاتىن ھەرپلىرى بىلەن يېزىڭ (ULY)
                <textarea
                  dir="ltr"
                  lang="ug-Latn"
                  rows={3}
                  value={latin}
                  placeholder="mesilen: yaxshimusiz, men'gü, sa'et"
                  onChange={(e) => setLatin(e.target.value)}
                />
              </label>
              <p className="latin-preview" lang="ug" aria-live="polite">
                {converted || "…"}
              </p>
              <button
                type="button"
                className="insert-converted"
                disabled={!converted.trim()}
                onClick={() => {
                  const el = field();
                  if (!el) return;
                  insertIntoField(el, converted);
                  setLatin("");
                }}
              >
                يېزىقنى قىستۇرۇش
              </button>
              <p className="local-hint">
                ch، gh، ng، sh، zh — قوش ھەرپ. ë/é = ې، ö، ü. ئايرىش ئۈچۈن
                ئاپوستروف: n'g، sa'et.
              </p>
            </div>
          )}
          <label className="physical-toggle">
            <input
              type="checkbox"
              checked={prefs.physical}
              onChange={(e) => setPrefs({ physical: e.target.checked })}
            />
            كومپيۇتېر كۇنۇپكىسىدا ئۇيغۇرچە يېزىش (ئۆلچەملىك ئورۇنلاشتۇرۇش)
          </label>
          {prefs.physical && (
            <p className="local-hint">
              مەسىلەن: f = ا، g = ە، j = ق، / = ئ، Shift+H = خ. ھەرپلەر يۈزىدىكى
              تاختايغا قاراڭ.
            </p>
          )}
          <p role="status" className="local-hint">
            {status}
          </p>
        </div>
      )}
    </div>
  );
}
