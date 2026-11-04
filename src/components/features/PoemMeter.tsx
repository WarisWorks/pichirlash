import { countSyllables, rhymeKey } from "@/lib/uyghur/script";

const rhymeColors = ["#e9b949", "#7fb7a4", "#d98a8a", "#8ea3d6", "#b494c9", "#9fbf6b"];

/** Per-line syllable counts and shared rhyme endings for a poem written line by line. */
export function analyzePoem(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const keys = lines.map(rhymeKey);
  const counts = new Map<string, number>();
  keys.forEach((k) => k && counts.set(k, (counts.get(k) ?? 0) + 1));
  const groups = [...counts].filter(([, n]) => n > 1).map(([k]) => k);
  return lines.map((line, i) => ({
    line,
    syllables: countSyllables(line),
    rhyme: keys[i],
    group: groups.indexOf(keys[i]),
  }));
}

export default function PoemMeter({ text }: { text: string }) {
  const rows = analyzePoem(text);
  if (!rows.length) return null;
  const counts = rows.map((r) => r.syllables);
  const even = counts.length > 1 && counts.every((c) => c === counts[0]);
  const rhymed = rows.filter((r) => r.group >= 0).length;
  return (
    <details className="poem-meter" open>
      <summary>ۋەزىن ۋە قاپىيە ياردەمچىسى</summary>
      <ol>
        {rows.map((r, i) => (
          <li key={i}>
            <span className="meter-count" title="بوغۇم سانى">
              {r.syllables}
            </span>
            <span className="meter-line">{r.line}</span>
            {r.group >= 0 ? (
              <span
                className="meter-rhyme"
                style={{ background: rhymeColors[r.group % rhymeColors.length] }}
                title="ئوخشاش قاپىيە"
                dir="ltr"
              >
                -{r.rhyme}
              </span>
            ) : (
              <span className="meter-rhyme none" dir="ltr">
                -{r.rhyme}
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="local-hint">
        {even
          ? `بارلىق قۇرلار ${counts[0]} بوغۇملۇق — ۋەزىن تەكشى.`
          : "سان: ھەر قۇردىكى بوغۇم (سوزۇق تاۋۇش) سانى. قوشاقلاردا كۆپىنچە ھەر قۇر 7 ياكى 8 بوغۇم بولىدۇ."}{" "}
        {rhymed
          ? `${rhymed} قۇر قاپىيىلىشىدۇ؛ ئوخشاش رەڭ ئوخشاش ئاخىرنى بىلدۈرىدۇ.`
          : "قاپىيە ئۈچۈن قۇرلارنى ئوخشاش تاۋۇش بىلەن ئاخىرلاشتۇرۇپ بېقىڭ."}
      </p>
    </details>
  );
}
