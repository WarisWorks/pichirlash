import { Droplets, Sprout, BookOpen, Feather } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { localDay } from "./model";
import type { GardenState } from "./model";
export default function WordGarden({
  garden,
  onWater,
  onRead,
  onCreate,
}: {
  garden: GardenState;
  onWater: () => void;
  onRead: () => void;
  onCreate: () => void;
}) {
  const watered = garden.watered.includes(localDay());
  const plants = garden.rewards.slice(0, 12);
  return (
    <section className="play-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ياخشى ئادەتلەردىن ئۆسكەن گۈللەر</span>
          <h2>كۆڭۈل باغچىسى</h2>
          <p>
            ئوقۇش، شېئىر، خەت ياكى بىر كىچىك ئىجادىي ئىش — ھەر بىرى باغچىڭىزغا
            بىر گۈل قوشىدۇ.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={watered || !plants.length}
          onClick={onWater}
        >
          <Droplets size={18} />
          {watered ? "بۈگۈن سۇ بېرىلدى" : "باغچىغا سۇ بېرىش"}
        </Button>
      </div>
      <div className="garden-summary">
        <span>
          <strong>{garden.rewards.length.toLocaleString("ar")}</strong> كىچىك
          ياخشى ئىش
        </span>
        <span>
          <strong>{garden.watered.length.toLocaleString("ar")}</strong> قېتىم سۇ
          بېرىش
        </span>
        <p>ئالدىرىماڭ. ھەر بىر كىچىك قەدەم قەدىرلىك.</p>
      </div>
      <div className={`word-garden ${watered ? "watered" : ""}`}>
        <div className="garden-sun">☀</div>
        <span className="garden-vine vine-left" />
        <span className="garden-vine vine-right" />
        {plants.length >= 3 && (
          <div className="garden-bee">
            <Sticker name="bee" size={68} />
          </div>
        )}
        {plants.length >= 6 && (
          <div className="garden-bunny">
            <Sticker name="bunny" size={83} />
          </div>
        )}
        <div className="garden-beds">
          {Array.from({ length: 12 }, (_, i) => (
            <div className={`garden-bed ${plants[i] ? "planted" : ""}`} key={i}>
              {plants[i] ? (
                <button
                  aria-label={`گۈل ${i + 1}: ${plants[i].label}`}
                  title={plants[i].label}
                  onClick={(e) => {
                    const el = e.currentTarget;
                    el.classList.remove("bloom-pop");
                    void el.offsetWidth;
                    el.classList.add("bloom-pop");
                  }}
                >
                  <Sticker
                    name={
                      ["sunflower", "cactus", "sunflower", "cherries"][i % 4]
                    }
                    size={94}
                  />
                  <span>{plants[i].label}</span>
                </button>
              ) : (
                <div className="empty-bed">
                  <Sprout size={24} />
                  <span>بىر ئوي كۈتۈۋاتىدۇ</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {!plants.length && (
          <p className="garden-empty">
            تۇنجى ئىجادىي ئىشىڭىزدىن كېيىن گۈل ئېچىلىدۇ.
          </p>
        )}
        {watered && (
          <div className="water-drops" aria-hidden="true">
            ✧ · ✧ · ✧
          </div>
        )}
      </div>
      <div className="editor-actions">
        <Button onClick={onRead}>
          <BookOpen size={17} /> بىر نەرسە ئوقۇي
        </Button>
        <Button variant="outline" onClick={onCreate}>
          <Feather size={17} /> بىر نەرسە يازاي
        </Button>
      </div>
      <p className="local-hint">
        ئوخشاش ئىجادىي ئىش بىر قېتىملا گۈل بېرىدۇ. ئون ئىككى گۈلدىن كېيىنمۇ
        ياخشى ئىشلىرىڭىز سانىلىدۇ.
      </p>
      {garden.rewards.length > 0 && (
        <details className="garden-log">
          <summary>باغچىنىڭ ئەسلىمە دەپتىرى</summary>
          <ul>
            {garden.rewards
              .slice(-12)
              .reverse()
              .map((r) => (
                <li key={r.id}>
                  <span>{r.label}</span>
                  <time>{r.day}</time>
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}
