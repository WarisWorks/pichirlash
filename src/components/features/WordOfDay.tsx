import { BookmarkPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dictionary } from "@/lib/uyghur/dictionary";
import { convertScript } from "@/lib/uyghur/script";
import { localDay } from "@/components/play/model";
import { useLocal } from "@/components/play/useLocal";
import { WORDS_KEY, addWord, validWords } from "./wordStore";
import type { SavedWord } from "./wordStore";

/** A stable dictionary word for a local calendar day. */
export function wordForDay(day: string) {
  const words = Object.keys(dictionary).filter((w) => w.length > 2);
  let hash = 7;
  for (const ch of day) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  return words[hash % words.length];
}

export default function WordOfDay() {
  const day = localDay();
  const word = wordForDay(day);
  const entry = dictionary[word];
  const { value: words, setValue: setWords } = useLocal<SavedWord[]>(WORDS_KEY, [], validWords);
  const saved = words.some((w) => w.word === word);
  return (
    <section className="word-of-day" aria-label="بۈگۈنكى سۆز">
      <span className="eyebrow">بۈگۈنكى سۆز</span>
      <strong lang="ug">{word}</strong>
      <span className="wod-scripts">
        <span dir="ltr" lang="ug-Latn">{convertScript(word, "uly")}</span> ·{" "}
        <span dir="ltr" lang="ug-Cyrl">{convertScript(word, "usy")}</span>
      </span>
      <p>
        <em>{entry.pos}</em> {entry.ug}
      </p>
      <p className="wod-en" dir="ltr" lang="en">{entry.en}</p>
      <Button
        size="sm"
        variant="outline"
        disabled={saved}
        onClick={() =>
          setWords(addWord(words, { word, root: word, ug: entry.ug, en: entry.en, day, known: 0 }))
        }
      >
        {saved ? <Check size={15} /> : <BookmarkPlus size={15} />}
        {saved ? "سۆز دەپتىرىمدە" : "سۆز دەپتىرىمگە"}
      </Button>
    </section>
  );
}
