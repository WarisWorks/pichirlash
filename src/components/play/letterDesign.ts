import type { Letter } from "./model";
export const stationery = [
  {
    id: "ivory",
    name: "خاس كلاسسىك",
    description: "پىل چىشى رەڭگى، نازۇك سىزىق ۋە قېنىق قىزىل پېچەت.",
    accent: "#8e4d47",
    paper: "#faf5e9",
    ink: "#463e37",
  },
  {
    id: "botanical",
    name: "بېسىلغان ياپراقلار",
    description: "ئىللىق قەغەز، زەيتۇن رەڭلىك سىياھ ۋە ياپراق نەقىشى.",
    accent: "#647451",
    paper: "#f4f2e6",
    ink: "#3f4c37",
  },
  {
    id: "midnight",
    name: "كېچە ۋە ئالتۇن",
    description: "چوڭقۇر كۆك، ئالتۇن رامكا ۋە نەپىس قوليازما.",
    accent: "#d6b477",
    paper: "#243139",
    ink: "#f2e9d8",
  },
  {
    id: "atlas",
    name: "يىپەك يولى",
    description: "ئەنئەنىۋى گېئومېتىرىيە، كۆكۈچ ۋە مىس رەڭلەر.",
    accent: "#397776",
    paper: "#f4efe3",
    ink: "#354a48",
  },
] as const;
export type StationeryId = (typeof stationery)[number]["id"];
export function designOf(value: unknown) {
  return stationery.find((item) => item.id === value) ?? stationery[0];
}
export const letterExamples = [
  {
    id: "thanks",
    name: "رەھمەت خېتى",
    to: "قەدىرلىك دوستۇمغا",
    title: "مېھرىڭىز ئۈچۈن رەھمەت",
    body: "قەدىرلىك دوستۇم،\n\nبۈگۈن سىزگە بىر ئىللىق رەھمەت ئېيتقۇم كەلدى. كىچىك ئىشلىرىڭىز، سەمىمىي سۆزلىرىڭىز ۋە ۋاقتىڭىزنى ئايرىپ ئاڭلىغانلىقىڭىز مەن ئۈچۈن قەدىرلىك.\n\nبەزى مېھىرلەر ئۇنتۇلمايدۇ. سىزنىڭ ياردىمىڭىز ماڭا ئىشەنچ ۋە كۈچ بەردى. بۇ ياخشىلىقىڭىزنى كۆڭلۈمدە ساقلايمەن.\n\nكۈنلىرىڭىزگە خۇشاللىق، كۆڭلىڭىزگە خاتىرجەملىك تىلەيمەن. سىزگە يەنە بىر قېتىم رەھمەت.",
  },
  {
    id: "friend",
    name: "دوستلۇق خېتى",
    to: "يىراقتىكى يېقىن دوستۇمغا",
    title: "ئارىمىزدىكى ئىللىق سۆزلەر",
    body: "قەدىرلىك دوستۇم،\n\nئارىمىزدا قانچە يول بولسىمۇ، ياخشى ئەسلىمىلەر بىزنى يېقىنلاشتۇرۇپ تۇرىدۇ. بۈگۈن سىزنى ئەسلەپ، بۇ بىر نەچچە قۇر خەتنى يېزىپ قويدۇم.\n\nبىللە كۈلگەن كۈنلىرىمىز ۋە ئالدىرىماي قىلغان پاراڭلىرىمىز كۆڭلۈمدە. ۋاقتىڭىز چىققاندا، يېقىنقى خەۋەرلىرىڭىزنى يازسىڭىز خۇشال بولىمەن.\n\nيەنە بىر كۈنى بىر ئىستاكان چاي ئۈستىدە پاراڭلىشىشنى ئۈمىد قىلىمەن. ئۆزىڭىزنى ئاسراڭ.",
  },
  {
    id: "family",
    name: "ئائىلىگە خەت",
    to: "قەدىرلىك ئائىلەمگە",
    title: "ئۆيگە بىر پارچە سېغىنىش",
    body: "قەدىرلىك ئائىلەم،\n\nئۆيدىكى ئىللىق مۇھىتنى، بىللە ئولتۇرۇپ تاماق يېگەن ۋاقىتلىرىمىزنى ۋە ئاددىي پاراڭلىرىمىزنى ئەسلەپ تۇرىمەن.\n\nسىلەرنىڭ مېھرىڭلار ماڭا ھەر دائىم كۈچ بېرىدۇ. يېنىمدا بولمىساڭلارمۇ، ئىللىق سۆزلىرىڭلار كۆڭلۈمگە يېقىن.\n\nھەممىڭلارنىڭ تەن سالامەت، كۆڭلى خۇش بولۇشىنى تىلەيمەن. پات يېقىندا يەنە بىللە ئولتۇرۇپ پاراڭلىشايلى.",
  },
  {
    id: "self",
    name: "ئۆزۈمگە خەت",
    to: "كەلگۈسىدىكى ئۆزۈمگە",
    title: "بۈگۈنكى مەندىن ئەتەكى ماڭا",
    body: "قەدىرلىك كەلگۈسىدىكى ئۆزۈم،\n\nبۇ خەتنى ئوقۇغاندا، بۈگۈنكى كىچىك ئارزۇلىرىڭنى ئەسلەپ قوي. چوڭ نەتىجىلەرنىڭ ھەممىسى بىر كىچىك قەدەمدىن باشلانغان.\n\nھەر كۈنى ئۆگىنىشكە، باشقىلارغا مېھىر بېرىشكە ۋە ئۆزۈڭنى ئاسراشقا ۋاقىت ئايرىغىن. قىيىن كۈنلەر بولسا، ئۆزۈڭگە يۇمشاق مۇئامىلە قىلغىن.\n\nقانچىلىك يول ماڭغان بولساڭمۇ، ئۈمىدىڭنى يوقاتمىغىن. بۈگۈنكى مەن ساڭا ئىشىنىمەن.",
  },
  {
    id: "formal",
    name: "رەسمىي تەشەككۈر",
    to: "ھۆرمەتلىك ھەمكارىمغا",
    title: "ھەمكارلىقىڭىز ئۈچۈن تەشەككۈر",
    body: "ھۆرمەتلىك ھەمكارىم،\n\nۋاقتىڭىزنى ئايرىپ، بىزگە قىلغان ياردىمىڭىز ۋە سەمىمىي ھەمكارلىقىڭىز ئۈچۈن تەشەككۈر بىلدۈرىمەن.\n\nبۇ جەرياندىكى پىكىر ۋە تەكلىپلىرىڭىز خىزمىتىمىزگە پايدىلىق بولدى. كېيىنكى ئىشلىرىمىزدىمۇ ئۆزئارا قوللاپ، ياخشى نەتىجىلەرگە ئېرىشىشنى ئۈمىد قىلىمەن.\n\nخىزمىتىڭىزگە ئۇتۇق، تۇرمۇشىڭىزغا خاتىرجەملىك تىلەيمەن. ھۆرمەت بىلەن.",
  },
] as const;
export function formatLetterDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  const [year, month, day] = match.slice(1).map(Number),
    date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return "";
  const months = [
    "يانۋار",
    "فېۋرال",
    "مارت",
    "ئاپرېل",
    "ماي",
    "ئىيۇن",
    "ئىيۇل",
    "ئاۋغۇست",
    "سېنتەبىر",
    "ئۆكتەبىر",
    "نويابىر",
    "دېكابىر",
  ];
  return `${year.toLocaleString("ar", { useGrouping: false })}-يىلى ${day.toLocaleString("ar")}-${months[month - 1]}`;
}
export function letterPlainText(letter: Letter) {
  return [
    letter.to,
    letter.title,
    letter.body,
    letter.from ? `مېھىر بىلەن،\n${letter.from}` : "",
    formatLetterDate(letter.date || ""),
  ]
    .filter(Boolean)
    .join("\n\n");
}
export function validRecipientEmail(email: string) {
  return (
    !email.trim() || /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email.trim())
  );
}
export function letterMailto(letter: Letter) {
  if (
    !letter.title.trim() ||
    !letter.body.trim() ||
    !validRecipientEmail(letter.email || "")
  )
    return null;
  return `mailto:${encodeURIComponent((letter.email || "").trim())}?subject=${encodeURIComponent(letter.title)}&body=${encodeURIComponent(letterPlainText(letter))}`;
}
/** Keep every character and line break; only split words when a single word cannot fit a page. */
export function paginateLetter(
  text: string,
  fits: (text: string) => boolean,
  maxPages = 12,
): string[] {
  const pages: string[] = [];
  let page = "";
  const flush = () => {
    if (pages.length >= maxPages) throw Error("too-many-pages");
    pages.push(page);
    page = "";
  };
  const tokens = text.match(/\S+\s*|\s+/gu) || [""];
  for (const token of tokens) {
    if (fits(page + token)) {
      page += token;
      continue;
    }
    if (page) flush();
    if (fits(token)) {
      page = token;
      continue;
    }
    const graphemes =
      typeof Intl.Segmenter === "function"
        ? Array.from(
            new Intl.Segmenter("ug", { granularity: "grapheme" }).segment(
              token,
            ),
            (part) => part.segment,
          )
        : Array.from(token);
    let start = 0;
    while (start < graphemes.length) {
      let low = 1,
        high = graphemes.length - start,
        best = 0;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if (fits(graphemes.slice(start, start + middle).join(""))) {
          best = middle;
          low = middle + 1;
        } else high = middle - 1;
      }
      if (!best) throw Error("page-too-small");
      page = graphemes.slice(start, start + best).join("");
      start += best;
      if (start < graphemes.length) flush();
    }
  }
  if (page || !pages.length) flush();
  return pages;
}
