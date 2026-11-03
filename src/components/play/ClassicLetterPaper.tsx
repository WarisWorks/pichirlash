import type { CSSProperties } from "react";
import { Feather } from "lucide-react";
import { designOf, formatLetterDate } from "./letterDesign";
import type { Letter } from "./model";
export const LETTER_WIDTH = 800,
  LETTER_HEIGHT = 1132,
  LETTER_BODY_HEIGHT = 540,
  LETTER_BODY_WIDTH = 648;
export function Flourish({ kind = "classic" }: { kind?: string }) {
  return (
    <svg className="classic-flourish" viewBox="0 0 140 40" aria-hidden="true">
      {kind === "atlas" ? (
        <>
          <path d="M8 20h38l12-12 12 12-12 12-12-12M132 20H94L82 8 70 20l12 12 12-12" />
          <path d="m61 20 9-9 9 9-9 9Z" />
        </>
      ) : kind === "botanical" ? (
        <>
          <path d="M16 30Q60 6 122 19M38 22Q25 3 45 11Q54 15 48 18M62 16Q54-2 74 7Q79 11 72 15M84 15Q90 2 103 5Q102 16 92 16M104 17Q117 9 127 13Q123 25 112 20" />
        </>
      ) : (
        <>
          <path d="M12 20h30m56 0h30M42 20c15 0 15-14 5-14s-7 14 23 14c-30 0-30 14-23 14s10-14-5-14m56 0c-15 0-15-14-5-14s7 14-23 14c30 0 30 14 23 14s-10-14 5-14" />
          <path d="m64 20 6-6 6 6-6 6Z" />
        </>
      )}
    </svg>
  );
}
export function WaxSeal({ small = false }: { small?: boolean }) {
  return (
    <span className={`classic-wax ${small ? "small" : ""}`} aria-hidden="true">
      <span>
        <Feather size={small ? 16 : 26} />
      </span>
    </span>
  );
}
function PageFrame({ design }: { design: string }) {
  return (
    <svg
      className="classic-frame"
      viewBox="0 0 800 1132"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect x="26" y="26" width="748" height="1080" rx="1" />
      <rect x="33" y="33" width="734" height="1066" strokeWidth=".5" />
      {[
        [45, 45],
        [755, 45],
        [45, 1087],
        [755, 1087],
      ].map(([x, y], i) => (
        <g
          key={i}
          transform={`translate(${x} ${y}) rotate(${[0, 90, 270, 180][i]})`}
        >
          {design === "atlas" ? (
            <path d="M0 36V0h36M8 28V8h20M8 8l14 14m-5-5 7-7 7 7-7 7Z" />
          ) : design === "botanical" ? (
            <path d="M0 40Q0 0 40 0M4 22Q-8 5 7 9l4 4M12 12Q6-4 20 4l4 4M22 4Q18-8 34 0" />
          ) : (
            <path d="M0 36V0h36M0 24C18 24 28 0 16 0S0 14 0 24M8 8h12M8 8v12" />
          )}
        </g>
      ))}
    </svg>
  );
}
export default function ClassicLetterPaper({
  letter,
  text,
  page = 0,
  count = 1,
}: {
  letter: Letter;
  text: string;
  page?: number;
  count?: number;
}) {
  const design = designOf(letter.design);
  const style = {
    "--letter-paper": design.paper,
    "--letter-ink": design.ink,
    "--letter-accent": design.accent,
  } as CSSProperties;
  return (
    <article
      className="classic-paper"
      data-design={design.id}
      style={style}
      dir="rtl"
    >
      <PageFrame design={design.id} />
      <div className="classic-brand">
        <span />
        <span>پىچىرلاش · كۆڭۈل خېتى</span>
        <span />
      </div>
      <h3
        className="classic-title"
        style={{ fontSize: letter.title.length > 50 ? 24 : 32 }}
      >
        {letter.title || "بىر ئىللىق خەت"}
      </h3>
      <div className="classic-meta">
        <span className="classic-addressee">
          {letter.to || "قەدىرلىك بىر ئىنسانغا"}
        </span>
        <time>{formatLetterDate(letter.date || "")}</time>
      </div>
      <div className="classic-body">
        {text || "سىزنىڭ ئىللىق سۆزلىرىڭىزنى كۈتۈۋاتىدۇ…"}
      </div>
      <div className="classic-signature">
        {page === count - 1 ? (
          <>
            <div>
              <span>مېھىر ۋە ھۆرمەت بىلەن،</span>
              <strong>{letter.from || "سىزنىڭ سەمىمىي دوستىڭىز"}</strong>
            </div>
            <WaxSeal />
          </>
        ) : (
          <span className="classic-continues">داۋامى كېيىنكى بەتتە…</span>
        )}
      </div>
      <footer className="classic-page-footer">
        <Flourish kind={design.id} />
        {count > 1 && (
          <span>
            {(page + 1).toLocaleString("ar")} / {count.toLocaleString("ar")}
          </span>
        )}
      </footer>
    </article>
  );
}
