import { X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import type { SharedItem } from "@/lib/uyghur/share";
import { useScript } from "@/components/play/Experience";

const kindLabel: Record<SharedItem["kind"], string> = {
  poem: "شېئىر",
  postcard: "ئەسلىمە كارتىسى",
  recipe: "ئائىلە تائام كارتىسى",
  story: "ھېكايە",
};
const lines = (text: string) => text.split("\n").filter((l) => l.trim());

/** Shows content someone shared through a #share= link. */
export default function SharedViewer({
  item,
  onClose,
}: {
  item: SharedItem;
  onClose: () => void;
}) {
  const { t, dir, lang } = useScript();
  const color = "color" in item ? item.color : "yellow";
  return (
    <section className="shared-viewer" aria-labelledby="shared-title">
      <div className="shared-banner">
        <Gift size={18} /> بىرەيلەن سىز بىلەن بىر {kindLabel[item.kind]} ئورتاقلاشتى
        <Button size="icon-sm" variant="ghost" aria-label="تاقاش" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>
      <article className={`shared-paper ${color}`} dir={dir} lang={lang}>
        <span className="washi" />
        {item.art && <Sticker name={item.art} size={84} />}
        <h2 id="shared-title">{t(item.title || kindLabel[item.kind])}</h2>
        {item.kind === "recipe" ? (
          <>
            {item.from && <p className="shared-from">— {t(item.from)}</p>}
            <h3>زاپچاسلار</h3>
            <ul>
              {lines(item.ingredients).map((l, i) => (
                <li key={i}>{t(l)}</li>
              ))}
            </ul>
            <h3>ئېتىش ئۇسۇلى</h3>
            <ol>
              {lines(item.steps).map((l, i) => (
                <li key={i}>{t(l.replace(/^\s*\d+[.)]\s*/, ""))}</li>
              ))}
            </ol>
            {item.memory && <blockquote>{t(item.memory)}</blockquote>}
          </>
        ) : (
          <div className="shared-text">{t(item.text)}</div>
        )}
      </article>
      <p className="local-hint">
        بۇ مەزمۇن ئۇلىنىشنىڭ ئۆزىدە ساقلانغان؛ ھېچقانداق مۇلازىمېتىردىن
        كەلمىدى.
      </p>
      <Button onClick={onClose}>پىچىرلاشنى ئېچىش</Button>
    </section>
  );
}
