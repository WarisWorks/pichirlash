export type BlankType =
  | "name"
  | "adjective"
  | "animal"
  | "place"
  | "color"
  | "action"
  | "number"
  | "food"
  | "thing";

export const blankTypeLabels: Record<BlankType, string> = {
  name: "ئىسىم",
  adjective: "سۈپەت",
  animal: "ھايۋان",
  place: "جاي",
  color: "رەڭ",
  action: "ھەرىكەت",
  number: "سان",
  food: "يېمەك",
  thing: "نەرسە",
};

export type StoryBlank = {
  key: string;
  type: BlankType;
  hint: string;
  suggestions: [string, string, string];
};
export type StoryTemplate = {
  id: string;
  title: string;
  art: string;
  /**
   * `{key}` marks a blank. Every blank is followed by punctuation or a separate
   * word (never a suffix), so vowel harmony never depends on the child's word.
   */
  text: string;
  blanks: StoryBlank[];
};

export const storyTemplates: StoryTemplate[] = [
  {
    id: "tea-party",
    title: "باغچىدىكى چاي سورۇنى",
    art: "teacup",
    text: "بىر كۈنى {name} ئىسىملىك بالا باغچىدا چاي سورۇنى ھازىرلىدى. داستىخان {color} رەڭلىك ئىدى. تۇيۇقسىز بىر {adjective} {animal} يېتىپ كېلىپ: «مەنمۇ قاتنىشاي!» دېدى. ئۇلار بىرلىكتە {number} دانە {food} يېدى. ئاخىرىدا ھەممەيلەن خۇشال بولۇپ {action}.",
    blanks: [
      { key: "name", type: "name", hint: "بىر بالىنىڭ ئىسمى", suggestions: ["ئايگۈل", "ئەركىن", "دىلنۇر"] },
      { key: "color", type: "color", hint: "ياقتۇرىدىغان رەڭ", suggestions: ["سېرىق", "ھاۋارەڭ", "قىزىل"] },
      { key: "adjective", type: "adjective", hint: "ھايۋاننى تەسۋىرلەيدىغان سۆز", suggestions: ["كىچىك", "ئۇيقۇچان", "قىزىقچى"] },
      { key: "animal", type: "animal", hint: "بىر ھايۋان", suggestions: ["توشقان", "مۈشۈك", "پىل"] },
      { key: "number", type: "number", hint: "بىر سان", suggestions: ["ئۈچ", "يەتتە", "يۈز"] },
      { key: "food", type: "food", hint: "بىر يېمەكلىك", suggestions: ["سامسا", "ئالما", "توقاچ"] },
      { key: "action", type: "action", hint: "ئۆتكەن زاماندىكى ھەرىكەت", suggestions: ["ئۇسسۇل ئوينىدى", "ناخشا ئېيتتى", "قاقاقلاپ كۈلدى"] },
    ],
  },
  {
    id: "star-trip",
    title: "يۇلتۇزلارغا ساياھەت",
    art: "rocket",
    text: "{name} كېچىدە {color} رەڭلىك بىر راكېتا ياسىدى. «بۈگۈن {place} دېگەن جايغا ئۇچىمىز!» دېدى ئۇ. راكېتىدا ئۇنىڭ بىلەن بىللە {number} {animal} بار ئىدى. ئاسماندا ئۇلار يورۇق بىر يۇلتۇزنى ئۇچراتتى. يۇلتۇز ئۇلارغا بىر {thing} سوۋغا قىلدى. ئۆيگە قايتقاندا {name} مۇنداق دېدى: «بۈگۈن ناھايىتى {feeling} كۈن بولدى!»",
    blanks: [
      { key: "name", type: "name", hint: "ساياھەتچىنىڭ ئىسمى", suggestions: ["نۇرانە", "ئالىم", "مەرىيەم"] },
      { key: "color", type: "color", hint: "راكېتىنىڭ رەڭگى", suggestions: ["كۈمۈش", "يېشىل", "سۆسۈن"] },
      { key: "place", type: "place", hint: "ئاسماندىكى ياكى خىيالىي بىر جاي", suggestions: ["ئاي", "مارس", "سامان يولى"] },
      { key: "number", type: "number", hint: "بىر سان", suggestions: ["ئىككى", "بەش", "ئون"] },
      { key: "animal", type: "animal", hint: "بىر ھايۋان", suggestions: ["پىنگۋىن", "تۆگە", "قۇچقاچ"] },
      { key: "thing", type: "thing", hint: "بىر نەرسە", suggestions: ["سېھىرلىك قەلەم", "ئالتۇن ئاچقۇچ", "كىچىك دۇتار"] },
      { key: "feeling", type: "adjective", hint: "كۈننى تەسۋىرلەيدىغان سۆز", suggestions: ["قىزىقارلىق", "ئاجايىپ", "كۈلكىلىك"] },
    ],
  },
  {
    id: "bakery",
    title: "سېھىرلىك نان دۇكىنى",
    art: "cupcake",
    text: "شەھەرنىڭ بىر بۇلۇڭىدا {name} ئىسىملىك بىر نانۋاي بار ئىدى. ئۇنىڭ نانلىرى ئىنتايىن {adjective} ئىدى. بىر كۈنى ئۇ {color} رەڭلىك بىر {food} ياقتى. شۇ ھامان دۇكانغا {number} {animal} كىرىپ كەلدى. ئۇلار ئۇنى كۆرۈپ، خۇشاللىقتىن {action}.",
    blanks: [
      { key: "name", type: "name", hint: "نانۋاينىڭ ئىسمى", suggestions: ["ئابدۇللا", "گۈلنار", "تۇرسۇن"] },
      { key: "adjective", type: "adjective", hint: "تەمنى تەسۋىرلەيدىغان سۆز", suggestions: ["مەززىلىك", "يۇمشاق", "خۇش پۇراق"] },
      { key: "color", type: "color", hint: "بىر رەڭ", suggestions: ["ھالرەڭ", "ئالتۇنرەڭ", "كۆك"] },
      { key: "food", type: "food", hint: "پىشۇرۇلىدىغان بىر يېمەكلىك", suggestions: ["گىردە", "تورت", "پوشكال"] },
      { key: "number", type: "number", hint: "بىر سان", suggestions: ["تۆت", "ئون ئىككى", "ئوتتۇز"] },
      { key: "animal", type: "animal", hint: "بىر ھايۋان", suggestions: ["ئۆردەك", "ئىت", "ئېيىق"] },
      { key: "action", type: "action", hint: "ئۆتكەن زاماندىكى ھەرىكەت", suggestions: ["سەكرىدى", "چاۋاك چالدى", "ئايلىنىپ ئۇسسۇل ئوينىدى"] },
    ],
  },
  {
    id: "forest-door",
    title: "ئورماندىكى سىرلىق ئىشىك",
    art: "fox",
    text: "{name} ئورمانلىقتا سەيلە قىلىپ يۈرۈپ، بىر تۈپ دەرەخنىڭ تۈۋىدىن {color} رەڭلىك كىچىك بىر ئىشىك تاپتى. ئىشىكنى {adjective} بىر {animal} ئاچتى. ئىچىدە {number} دانە {thing} تىزىقلىق تۇراتتى. {animal} كۈلۈمسىرەپ: «ھەر بىر مېھمان بىردىن ئالسا بولىدۇ» دېدى. {name} رەھمەت ئېيتىپ، خۇشال ھالدا {action}.",
    blanks: [
      { key: "name", type: "name", hint: "بىر بالىنىڭ ئىسمى", suggestions: ["ئەزىز", "سەنەم", "يۈسۈپ"] },
      { key: "color", type: "color", hint: "ئىشىكنىڭ رەڭگى", suggestions: ["قىزىل", "سېرىق", "ئاق"] },
      { key: "adjective", type: "adjective", hint: "ھايۋاننى تەسۋىرلەيدىغان سۆز", suggestions: ["ئەقىللىق", "مۆمىن", "ئۇزۇن قۇلاقلىق"] },
      { key: "animal", type: "animal", hint: "ئورماندا ياشايدىغان ھايۋان", suggestions: ["تۈلكە", "ئېيىق", "تىيىن"] },
      { key: "number", type: "number", hint: "بىر سان", suggestions: ["ئالتە", "توققۇز", "مىڭ"] },
      { key: "thing", type: "thing", hint: "كىچىك بىر نەرسە", suggestions: ["ئەينەك شار", "قوڭغۇراق", "رەسىملىك كارتا"] },
      { key: "action", type: "action", hint: "ئۆتكەن زاماندىكى ھەرىكەت", suggestions: ["ئۆيىگە يۈگۈردى", "ناخشا ئېيتتى", "ئاتلىنىپ كەتتى"] },
    ],
  },
  {
    id: "snow-day",
    title: "قارلىق كۈن",
    art: "snowflake",
    text: "قىشنىڭ {adjective} بىر كۈنى ئىدى. {name} دېرىزىدىن قارىسا، ھەممە يەر ئاپئاق قار بىلەن قاپلانغانىكەن. ئۇ {color} رەڭلىك شارپىسىنى ئارتىپ سىرتقا چىقتى ۋە قاردىن بىر {animal} ياسىدى. تۇيۇقسىز قار {animal} جانلىنىپ: «ماڭا ھەمراھ بولامسەن؟» دېدى. ئاندىن ئىككىسى {place} دېگەن جايغا بېرىپ، ئىسسىق چاي بىلەن {food} يېدى.",
    blanks: [
      { key: "adjective", type: "adjective", hint: "كۈننى تەسۋىرلەيدىغان سۆز", suggestions: ["سوغۇق", "جىمجىت", "ئاپتاپلىق"] },
      { key: "name", type: "name", hint: "بىر بالىنىڭ ئىسمى", suggestions: ["پەرىدە", "ئىلياس", "زۆھرە"] },
      { key: "color", type: "color", hint: "شارپىنىڭ رەڭگى", suggestions: ["قىزغۇچ", "يېشىل", "سۆسۈن"] },
      { key: "animal", type: "animal", hint: "بىر ھايۋان", suggestions: ["تۆگە", "مۈشۈك", "پىنگۋىن"] },
      { key: "place", type: "place", hint: "بىر جاي", suggestions: ["تاغ باغرى", "كۆل بويى", "مومامنىڭ ئۆيى"] },
      { key: "food", type: "food", hint: "بىر يېمەكلىك", suggestions: ["ھەسەل", "قوناق", "پولۇ"] },
    ],
  },
];

export const findTemplate = (id: string) =>
  storyTemplates.find((t) => t.id === id);

/** Split a template into plain text and blank keys, in reading order. */
export function storyParts(text: string): { text?: string; key?: string }[] {
  return text
    .split(/(\{[a-zA-Z]+\})/)
    .filter(Boolean)
    .map((p) => (/^\{[a-zA-Z]+\}$/.test(p) ? { key: p.slice(1, -1) } : { text: p }));
}

export const blankKeysInText = (text: string) =>
  [...new Set(storyParts(text).flatMap((p) => (p.key ? [p.key] : [])))];
