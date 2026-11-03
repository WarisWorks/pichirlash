import { useState } from "react";
import { Sticker } from "@/components/ui/sticker";
import { Doodle } from "@/components/ui/doodle";
import { Mascot } from "@/components/ui/mascot";
import { stickers } from "@/lib/ink/art/stickers";
import { doodles } from "@/lib/ink/art/doodles";
import { mascot } from "@/lib/ink/art/mascots";
import { scenes } from "@/lib/ink/art/scenes";
import { icons } from "@/lib/ink/art/icons";
import { drawSkeleton, memo } from "@/lib/ink/art-draw";
import type { ArtDef } from "@/lib/ink/art/types";
export type Decoration = { kind: string; name: string };
const collections = {
  sticker: { label: "چاپلاق", items: stickers },
  doodle: { label: "سىزمىلار", items: doodles },
  mascot: { label: "ئوماق دوست", items: mascot },
  scene: { label: "كۆرۈنۈشلەر", items: scenes },
  icon: { label: "بەلگىلەر", items: icons },
};
export function Art({ art, size = 64 }: { art: Decoration; size?: number }) {
  if (art.kind === "sticker") return <Sticker name={art.name} size={size} />;
  if (art.kind === "doodle") return <Doodle name={art.name} size={size} />;
  if (art.kind === "mascot") return <Mascot pose={art.name} size={size} />;
  const collection = art.kind === "scene" ? scenes : icons;
  const def = (collection as Record<string, ArtDef>)[art.name];
  if (!def) return null;
  const result = memo(`demo-${art.kind}-${art.name}-${size}`, () =>
    drawSkeleton(def, size, art.name),
  );
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${result.w} ${result.h}`}
      dangerouslySetInnerHTML={{ __html: result.svg }}
    />
  );
}
export default function ArtLibrary({
  onChoose,
}: {
  onChoose: (art: Decoration) => void;
}) {
  const [group, setGroup] = useState<keyof typeof collections>("sticker"),
    [page, setPage] = useState(0);
  const names = Object.keys(collections[group].items),
    size = 24;
  return (
    <section className="studio-section">
      <div className="studio-title">
        <div>
          <span className="eyebrow">رەڭلەر بىلەن ئوينايلى</span>
          <h2>كىچىك سەنئەت ساندۇقى</h2>
          <p>ياقتۇرغان رەسىمىڭىزنى تاللاپ، يېڭى يازمىڭىزنى بېزەڭ.</p>
        </div>
        <Mascot pose="idle" size={100} />
      </div>
      <div className="tabs">
        {Object.entries(collections).map(([key, value]) => (
          <button
            className={group === key ? "tab selected" : "tab"}
            key={key}
            aria-pressed={group === key}
            onClick={() => {
              setGroup(key as keyof typeof collections);
              setPage(0);
            }}
          >
            {value.label} ·{" "}
            {Object.keys(value.items).length.toLocaleString("ar")}
          </button>
        ))}
      </div>
      <div className="art-grid">
        {names.slice(page * size, (page + 1) * size).map((name, i) => (
          <button
            className="art-tile"
            key={name}
            onClick={() => onChoose({ kind: group, name })}
            aria-label={`${collections[group].label} ${(page * size + i + 1).toLocaleString("ar")} — تاللاش`}
          >
            <Art art={{ kind: group, name }} size={72} />
            <span>
              {collections[group].label}{" "}
              {(page * size + i + 1).toLocaleString("ar")}
            </span>
          </button>
        ))}
      </div>
      <div className="pagination">
        <button disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
          ئالدىنقى بەت
        </button>
        <span>
          {(page + 1).toLocaleString("ar")} /{" "}
          {Math.ceil(names.length / size).toLocaleString("ar")}
        </span>
        <button
          disabled={(page + 1) * size >= names.length}
          onClick={() => setPage((v) => v + 1)}
        >
          كېيىنكى بەت
        </button>
      </div>
    </section>
  );
}
