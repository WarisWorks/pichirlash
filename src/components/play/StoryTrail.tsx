import { ArrowLeft, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { story, validStoryPath } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
export default function StoryTrail({
  onReward,
  onWrite,
}: {
  onReward: (id: string, label: string) => void;
  onWrite: () => void;
}) {
  const {
    value: path,
    setValue: setPath,
    error,
  } = useLocal<string[]>("pichirlash-story-v1", ["start"], validStoryPath);
  const key = path[path.length - 1],
    node = story[key];
  const choose = (next: string) => {
    if (!node.choices.some((c) => c.next === next)) return;
    setPath((v) => [...v, next]);
    if (story[next].ending) onReward(`story:${next}`, "ھېكايىنىڭ بىر ئاخىرى");
  };
  return (
    <section className="play-panel">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ھەر بىر تاللاش يېڭى بىر يول</span>
          <h2>ھېكايە يولى</h2>
          <p>
            ئۈچ خىل ئاخىرلىشىشنى تاپالايسىز. ئوقۇغان يېرىڭىز ئاپتوماتىك
            ساقلىنىدۇ.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setPath(["start"])}>
          <RotateCcw size={17} /> قايتا باشلاش
        </Button>
      </div>
      <ol className="story-crumbs" aria-label="تاللىغان ھېكايە يولى">
        {path.map((step, i) => (
          <li key={`${step}-${i}`}>
            <button
              aria-current={i === path.length - 1 ? "step" : undefined}
              onClick={() => setPath((v) => v.slice(0, i + 1))}
            >
              {i + 1}. {story[step].title}
            </button>
          </li>
        ))}
      </ol>
      <article
        className={`story-page ${node.ending ? "ending" : ""}`}
        key={key}
      >
        <span className="washi" />
        <Sticker name={node.art} size={110} />
        <span className="eyebrow">
          {node.ending ? "ھېكايە تاماملاندى" : "بىر كىچىك سەرگۈزەشت"}
        </span>
        <h3>{node.title}</h3>
        <p>{node.text}</p>
        <div className="story-choices">
          {node.choices.map((choice) => (
            <Button
              variant="outline"
              key={choice.next}
              onClick={() => choose(choice.next)}
            >
              {choice.label}
              <ArrowLeft size={17} />
            </Button>
          ))}
          {node.ending && (
            <>
              <Button onClick={() => setPath(["start"])}>
                باشقا بىر يولنى سىناي
              </Button>
              <Button variant="outline" onClick={onWrite}>
                ئۆز ھېكايەمنى يازاي
              </Button>
            </>
          )}
        </div>
      </article>
      {path.length > 1 && (
        <Button variant="ghost" onClick={() => setPath((v) => v.slice(0, -1))}>
          <Undo2 size={17} /> بىر قەدەم كەينىگە
        </Button>
      )}
      {error && <StorageNotice />}
    </section>
  );
}
