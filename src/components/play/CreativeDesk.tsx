import { useRef, useState } from "react";
import { Plus, Trash2, RotateCcw, Pin, Move, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { stickers } from "@/lib/ink/art/stickers";
import { entries } from "@/data/content";
import { useLocal } from "./useLocal";
import { colors, constrainDesk, starterDesk, uid, validDesk } from "./model";
import type { DeskItem } from "./model";
import { StorageNotice } from "./Experience";
export const DESK_KEY = "pichirlash-desk-v1";
export default function CreativeDesk({
  onReward,
}: {
  onReward: (key: string, label: string) => void;
}) {
  const {
    value: items,
    setValue: setItems,
    error,
  } = useLocal(DESK_KEY, starterDesk, validDesk);
  const [selected, setSelected] = useState(items[0]?.id || ""),
    [tray, setTray] = useState(0),
    [undo, setUndo] = useState<DeskItem | null>(null),
    [status, setStatus] = useState("");
  const [dragging, setDragging] = useState<DeskItem | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
    moved: boolean;
  } | null>(null);
  const names = Object.keys(stickers),
    item = items.find((x) => x.id === selected);
  const change = (id: string, patch: Partial<DeskItem>) =>
    setItems((v) =>
      v.map((x) => (x.id === id ? constrainDesk({ ...x, ...patch }) : x)),
    );
  const add = (type: DeskItem["type"], art = "", text = "") => {
    if (items.length >= 30) {
      setStatus("ئۈستەلدە ٣٠ پارچە نەرسە بار. بىرىنى ئۆچۈرۈپ ئورۇن بوشىتىڭ.");
      return;
    }
    const next: DeskItem = {
      id: uid(),
      type,
      art,
      text,
      color: "yellow",
      x: 12 + (items.length % 4) * 9,
      y: 8 + (items.length % 3) * 14,
      w: type === "sticker" ? 16 : 26,
    };
    setItems((v) => [...v, next]);
    setSelected(next.id);
    setStatus("ئۈستەلگە قوشۇلدى.");
  };
  const displayed = items.map((x) => (dragging?.id === x.id ? dragging : x));
  return (
    <section className="play-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ئۆزىڭىزگە خاس كىچىك دۇنيا</span>
          <h2>مېنىڭ ئىجادىي ئۈستىلىم</h2>
          <p>
            قەغەزلەرنى سۆرەپ يۆتكەڭ، ياكى تاللاپ يۆنىلىش كۇنۇپكىلىرىنى ئىشلىتىڭ.
          </p>
        </div>
        <Button
          onClick={() => {
            onReward("desk", "ئۈستەلنى بېزەش");
            setStatus(
              "ئۈستەل ساقلاندى. بۈگۈنكى كىچىك ئىجادىي ئىشىڭىز خاتىرىلەندى.",
            );
          }}
        >
          <Save size={17} /> ئۈستەلنى ساقلاش
        </Button>
      </div>
      <div className="desk-layout">
        <div>
          <div
            className="desk-board"
            ref={board}
            role="group"
            aria-label="ئىجادىي ئۈستەل"
          >
            <span className="desk-watermark">بۇ بەت سىزنىڭ…</span>
            {displayed.map((x, index) => (
              <div
                key={x.id}
                role="button"
                tabIndex={0}
                className={`desk-object ${x.type} ${colors.includes(x.color as (typeof colors)[number]) ? x.color : "yellow"} ${selected === x.id ? "is-selected" : ""}`}
                style={{
                  left: `${x.x}%`,
                  top: `${x.y}%`,
                  width: `${x.w}%`,
                  zIndex: selected === x.id ? 40 : index + 1,
                }}
                aria-label={`${x.type === "sticker" ? "چاپلاق" : x.type === "quote" ? "نەقىل" : "خاتىرە"} ${index + 1}: ${x.text}. يۆنىلىش كۇنۇپكىلىرى بىلەن يۆتكەڭ.`}
                aria-pressed={selected === x.id}
                onFocus={() => setSelected(x.id)}
                onClick={() => setSelected(x.id)}
                onKeyDown={(e) => {
                  const delta = e.shiftKey ? 5 : 1;
                  const moves: Record<string, [number, number]> = {
                    ArrowLeft: [-delta, 0],
                    ArrowRight: [delta, 0],
                    ArrowUp: [0, -delta],
                    ArrowDown: [0, delta],
                  };
                  if (moves[e.key]) {
                    e.preventDefault();
                    change(x.id, {
                      x: x.x + moves[e.key][0],
                      y: x.y + moves[e.key][1],
                    });
                  }
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  const box = board.current?.getBoundingClientRect();
                  if (!box) return;
                  setSelected(x.id);
                  drag.current = {
                    id: x.id,
                    x: x.x,
                    y: x.y,
                    startX: e.clientX,
                    startY: e.clientY,
                    width: box.width,
                    height: box.height,
                    moved: false,
                  };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (d?.id !== x.id) return;
                  d.moved = true;
                  setDragging(
                    constrainDesk({
                      ...x,
                      x: d.x + ((e.clientX - d.startX) / d.width) * 100,
                      y: d.y + ((e.clientY - d.startY) / d.height) * 100,
                    }),
                  );
                }}
                onPointerUp={(e) => {
                  const d = drag.current;
                  if (d?.id === x.id && d.moved && dragging)
                    setItems((v) =>
                      v.map((y) => (y.id === x.id ? dragging : y)),
                    );
                  drag.current = null;
                  setDragging(null);
                  if (e.currentTarget.hasPointerCapture(e.pointerId))
                    e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                onPointerCancel={() => {
                  drag.current = null;
                  setDragging(null);
                }}
              >
                {x.type === "sticker" ? (
                  <Sticker name={x.art} size={160} />
                ) : (
                  <>
                    <span className="card-tape" />
                    {x.type === "quote" && <Pin size={18} />}
                    <span>{x.text || "بىر كىچىك ئوي…"}</span>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="desk-actions">
            <Button variant="outline" onClick={() => add("note")}>
              <Plus size={17} /> قەغەز قوشۇش
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm("ئۈستەلنى دەسلەپكى ھالەتكە قايتۇرامسىز؟")) {
                  setItems(starterDesk);
                  setSelected(starterDesk[0].id);
                }
              }}
            >
              <RotateCcw size={17} /> قايتا باشلاش
            </Button>
            {undo && (
              <Button
                disabled={items.length >= 30}
                variant="outline"
                onClick={() => {
                  setItems((v) => [...v, undo]);
                  setUndo(null);
                }}
              >
                ئۆچۈرۈشنى قايتۇرۇش
              </Button>
            )}
          </div>
          <p role="status" className="local-hint">
            {status ||
              "ئورۇن، چوڭلۇق ۋە يېزىقلار مۇشۇ توركۆرگۈچتە ئاپتوماتىك ساقلىنىدۇ."}
          </p>
        </div>
        <aside className="desk-tools">
          <h3>
            <Move size={18} /> تاللانغان پارچە
          </h3>
          {item ? (
            <>
              <label className="field">
                {item.type === "sticker" ? "چاپلاق" : "يېزىقى"}
                {item.type !== "sticker" ? (
                  <textarea
                    rows={3}
                    maxLength={140}
                    value={item.text}
                    onChange={(e) => change(item.id, { text: e.target.value })}
                  />
                ) : (
                  <Sticker name={item.art} size={65} />
                )}
              </label>
              <label className="field">
                چوڭلۇقى
                <input
                  type="range"
                  min={12}
                  max={36}
                  value={item.w}
                  onChange={(e) => change(item.id, { w: +e.target.value })}
                />
              </label>
              <label className="field">
                توغرىسىغا
                <input
                  type="range"
                  min={0}
                  max={100 - item.w}
                  value={item.x}
                  onChange={(e) => change(item.id, { x: +e.target.value })}
                />
              </label>
              <label className="field">
                تىك يۆنىلىش
                <input
                  type="range"
                  min={0}
                  max={
                    100 -
                    (item.w * 1000) / 680 / (item.type === "sticker" ? 1 : 1.2)
                  }
                  value={item.y}
                  onChange={(e) => change(item.id, { y: +e.target.value })}
                />
              </label>
              {item.type !== "sticker" && (
                <label className="field">
                  قەغەز
                  <select
                    value={item.color}
                    onChange={(e) => change(item.id, { color: e.target.value })}
                  >
                    {colors.map((c, i) => (
                      <option value={c} key={c}>
                        {["سېرىق", "ھالرەڭ", "يېشىل", "كۆك", "بىنەپشە"][i]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setUndo(item);
                  setItems((v) => v.filter((x) => x.id !== item.id));
                  setSelected("");
                }}
              >
                <Trash2 size={16} /> ئۆچۈرۈش
              </Button>
            </>
          ) : (
            <p>ئۈستەلدىكى بىر پارچىنى تاللاڭ.</p>
          )}
          <h3>نەقىل قاداش</h3>
          <select
            aria-label="ئۈستەلگە نەقىل قاداش"
            value=""
            onChange={(e) => {
              if (e.target.value)
                add(
                  "quote",
                  "",
                  entries.find((x) => x.id === e.target.value)!.excerpt,
                );
            }}
          >
            <option value="">بىر يازمىدىن تاللاڭ…</option>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </aside>
      </div>
      <div className="sticker-drawer">
        <h3>ئۈستەلگە بىر چاپلاق قوشۇڭ</h3>
        <div>
          {names.slice(tray * 12, (tray + 1) * 12).map((name, i) => (
            <button
              key={name}
              onClick={() => add("sticker", name)}
              aria-label={`ئۈستەلگە چاپلاق ${tray * 12 + i + 1} قوشۇش`}
            >
              <Sticker name={name} size={54} />
            </button>
          ))}
        </div>
        <div className="pagination">
          <button disabled={!tray} onClick={() => setTray((v) => v - 1)}>
            ئالدىنقى
          </button>
          <span>
            {tray + 1} / {Math.ceil(names.length / 12)}
          </span>
          <button
            disabled={(tray + 1) * 12 >= names.length}
            onClick={() => setTray((v) => v + 1)}
          >
            كېيىنكى
          </button>
        </div>
      </div>
      {error && <StorageNotice />}
    </section>
  );
}
