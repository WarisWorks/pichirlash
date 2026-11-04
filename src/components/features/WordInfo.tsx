import { BookmarkPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeWord } from "@/lib/uyghur/morphology";
import { convertScript } from "@/lib/uyghur/script";

/** Explains a tapped word: its root, each suffix, and the meaning. */
export default function WordInfo({
  word,
  saved,
  onSave,
  onClose,
}: {
  word: string;
  saved: boolean;
  onSave: (root: string, ug: string, en: string) => void;
  onClose: () => void;
}) {
  const a = analyzeWord(word);
  return (
    <aside className="word-info" aria-live="polite" aria-label="سۆز ئىزاھاتى">
      <button className="word-info-close" aria-label="تاقاش" onClick={onClose}>
        <X size={16} />
      </button>
      <div className="word-info-head">
        <strong lang="ug">{a.word}</strong>
        <span dir="ltr" lang="ug-Latn">
          {convertScript(a.word, "uly")}
        </span>
      </div>
      <div className="word-parts" aria-label="سۆزنىڭ قۇرۇلمىسى">
        <span className="part root" title="يىلتىز">
          <b>{a.root}</b>
          <small>يىلتىز</small>
        </span>
        {a.suffixes.map((s, i) => (
          <span className="part" key={i}>
            <b>-{s.form}</b>
            <small>{s.label}</small>
          </span>
        ))}
      </div>
      {a.entry ? (
        <p className="word-meaning">
          <em>{a.entry.pos}</em> {a.entry.ug}
          <span dir="ltr" lang="en">
            {a.entry.en}
          </span>
        </p>
      ) : (
        <p className="local-hint">
          بۇ يىلتىز كىچىك لۇغىتىمىزدە يوق؛ قۇرۇلمىسى تەخمىنىي كۆرسىتىلدى.
        </p>
      )}
      <Button
        size="sm"
        variant="outline"
        disabled={saved}
        onClick={() => onSave(a.root, a.entry?.ug ?? "", a.entry?.en ?? "")}
      >
        {saved ? <Check size={15} /> : <BookmarkPlus size={15} />}
        {saved ? "سۆز دەپتىرىمدە بار" : "سۆز دەپتىرىمگە قوشۇش"}
      </Button>
    </aside>
  );
}
