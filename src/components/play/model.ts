export type Reward = { id: string; label: string; kind: string; day: string };
export type GardenState = { rewards: Reward[]; watered: string[] };
export const emptyGarden: GardenState = { rewards: [], watered: [] };
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function awardReward(state: GardenState, reward: Reward): GardenState {
  return state.rewards.some((item) => item.id === reward.id)
    ? state
    : { ...state, rewards: [...state.rewards, reward] };
}
export function waterGarden(state: GardenState, day: string): GardenState {
  return state.watered.includes(day)
    ? state
    : { ...state, watered: [...state.watered, day] };
}
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((x) => typeof x === "string");
export function validGarden(value: unknown): value is GardenState {
  return (
    isRecord(value) &&
    Array.isArray(value.rewards) &&
    value.rewards.every(
      (x) =>
        isRecord(x) &&
        ["id", "label", "kind", "day"].every((k) => typeof x[k] === "string"),
    ) &&
    strings(value.watered)
  );
}
export type DeskItem = {
  id: string;
  type: "note" | "quote" | "sticker";
  text: string;
  art: string;
  color: string;
  x: number;
  y: number;
  w: number;
};
export const colors = ["yellow", "pink", "green", "blue", "lavender"] as const;
export const uid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function constrainDesk(item: DeskItem): DeskItem {
  const w = Math.max(12, Math.min(36, Number.isFinite(item.w) ? item.w : 22));
  const h = (w * (1000 / 680)) / (item.type === "sticker" ? 1 : 1.2);
  return {
    ...item,
    w,
    x: Math.max(0, Math.min(100 - w, item.x)),
    y: Math.max(0, Math.min(100 - h, item.y)),
  };
}
export function validDesk(value: unknown): value is DeskItem[] {
  return (
    Array.isArray(value) &&
    value.length <= 60 &&
    value.every(
      (x) =>
        isRecord(x) &&
        ["id", "text", "art", "color"].every((k) => typeof x[k] === "string") &&
        ["note", "quote", "sticker"].includes(String(x.type)) &&
        ["x", "y", "w"].every(
          (k) => typeof x[k] === "number" && Number.isFinite(x[k]),
        ),
    )
  );
}
export const starterDesk: DeskItem[] = [
  {
    id: "welcome-note",
    type: "note",
    text: "بۈگۈن بىر كىچىك ئارزۇمنى يېزىپ قوياي…",
    art: "",
    color: "yellow",
    x: 8,
    y: 12,
    w: 26,
  },
  {
    id: "welcome-quote",
    type: "quote",
    text: "ئارزۇلىرىڭىزنى مېھىر بىلەن ئاسراڭ.",
    art: "",
    color: "pink",
    x: 53,
    y: 30,
    w: 27,
  },
  {
    id: "welcome-flower",
    type: "sticker",
    text: "",
    art: "sunflower",
    color: "green",
    x: 30,
    y: 57,
    w: 17,
  },
];
export type Poem = {
  id: string;
  title: string;
  words: string[];
  color: string;
  art: string;
};
export function validPoems(value: unknown): value is Poem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (x) =>
        isRecord(x) &&
        ["id", "title", "color", "art"].every(
          (k) => typeof x[k] === "string",
        ) &&
        strings(x.words) &&
        x.words.length <= 60,
    )
  );
}
export function moveWord(words: string[], from: number, to: number) {
  if (
    from < 0 ||
    from >= words.length ||
    to < 0 ||
    to >= words.length ||
    from === to
  )
    return words;
  const next = [...words];
  const [word] = next.splice(from, 1);
  next.splice(to, 0, word);
  return next;
}
export type Letter = {
  id: string;
  to: string;
  title: string;
  body: string;
  color: string;
  stamp: string;
  sealed: boolean;
};
export function validLetters(value: unknown): value is Letter[] {
  return (
    Array.isArray(value) &&
    value.every(
      (x) =>
        isRecord(x) &&
        ["id", "to", "title", "body", "color", "stamp"].every(
          (k) => typeof x[k] === "string",
        ) &&
        typeof x.sealed === "boolean",
    )
  );
}
export type StoryNode = {
  title: string;
  text: string;
  art: string;
  ending?: boolean;
  choices: { label: string; next: string }[];
};
export const story: Record<string, StoryNode> = {
  start: {
    title: "ئۈچ سۆزنىڭ سىرى",
    text: "سەھەردە ھويلىدىكى كىتابنىڭ ئارىسىدىن بىر كىچىك خەت تېپىلدى. ئۇنىڭدا «ئۈچ ياخشى سۆز بىر دۇنيانى ئۆزگەرتەلەيدۇ» دەپ يېزىلغان ئىدى. كۆك ئىشىكنىڭ سىرتىدا بىر قۇش سايراپ تۇراتتى. سىز قەيەردىن باشلايسىز؟",
    art: "notebook",
    choices: [
      { label: "باغدىكى قۇشقا ئەگىشىمەن", next: "bird" },
      { label: "خەتنى ئوقۇپ باقىمەن", next: "letter" },
      { label: "كۈتۈپخانىغا بارىمەن", next: "library" },
    ],
  },
  bird: {
    title: "يوپۇرماقلار ئارىسىدا",
    text: "كىچىك قۇش سىزنى گۈللۈككە باشلاپ كەلدى. بىر گۈل سۇسىز قاپتۇ. تۆۋەندىكى ئورۇندۇقتا بولسا يالغۇز بىر بالا ئولتۇرىدۇ.",
    art: "sunflower",
    choices: [
      { label: "گۈلگە سۇ بېرىمەن", next: "garden" },
      { label: "بالا بىلەن سالاملىشىمەن", next: "friend" },
    ],
  },
  letter: {
    title: "مومامنىڭ خېتى",
    text: "«ياخشى سۆزنى ئىزدەش ئۈچۈن يىراققا بېرىش ھاجەت ئەمەس» دەپتۇ مومام. خەتنىڭ ئارقىسىدا بىر ئاق بەت بار. ئۇنى قانداق ئىشلىتىسىز؟",
    art: "teacup",
    choices: [
      { label: "بىر رەھمەت خېتى يازىمەن", next: "kindness" },
      { label: "بىر پارچە شېئىر يازىمەن", next: "creativity" },
    ],
  },
  library: {
    title: "پەنجىرىدىن كىرگەن نۇر",
    text: "كۈتۈپخانىدا قېرى كىتابدار بىر كىتابنىڭ يىرتىلغان بېتىنى رەتلەۋاتاتتى. «بىر سۆز ئۆگەنسەڭ، بىر ئىشىك ئېچىلىدۇ» دېدى ئۇ.",
    art: "owl",
    choices: [
      { label: "كىتابنى رەتلەشكە ياردەملىشىمەن", next: "kindness" },
      { label: "بىر يېڭى سۆز ئۆگىنىمەن", next: "learning" },
    ],
  },
  garden: {
    title: "گۈلنىڭ سوۋغىسى",
    text: "سۇ تامچىلىرى يوپۇرماقلاردا پارقىرىدى. گۈلنىڭ يېنىدىكى كىچىك تاختىدا «مېھىر» دەپ يېزىلغان ئىكەن. بۇ سۆزنى قانداق ئورتاقلىشىسىز؟",
    art: "bee",
    choices: [
      { label: "يېڭى دوستۇمغا ئېيتىپ بېرىمەن", next: "friend" },
      { label: "ئۇنى شېئىرىمگە قوشىمەن", next: "creativity" },
    ],
  },
  friend: {
    title: "بىر سالامنىڭ كۈچى",
    text: "«سالام!» دېدىڭىز. بالا كۈلۈمسىرىدى: «مەن يېڭى كۆچۈپ كەلدىم. بۇ يەردە ھېچكىمنى تونۇمايمەن.» سىز ئۇنى باغنى بىللە ئايلانماققا تەكلىپ قىلدىڭىز.",
    art: "bunny",
    choices: [
      { label: "دوستلۇق ھېكايىسىنى داۋاملاشتۇراي", next: "kindness" },
      { label: "بىللە كىتاب ئوقۇيلى", next: "learning" },
    ],
  },
  kindness: {
    title: "ئاخىرلىشىش: مېھىرنىڭ ئىزى",
    text: "شۇ كۈنى ئۈچ سۆزنى تاپتىڭىز: «سالام»، «رەھمەت»، «مەرھەمەت». ھەر بىر ياخشى سۆز بىراۋنىڭ كۈنىنى يورۇتتى. سىرلىق خەتنىڭ مەنىسى ئاخىرى ئايدىڭلاشتى: ئەڭ چوڭ سېھىر — كىچىك مېھىر.\n\nبۇ ھېكايە مۇشۇ يەردە ئاخىرلاشتى. سىزنىڭ ياخشى سۆزلىرىڭىز بولسا داۋاملىشىدۇ.",
    art: "smiley",
    ending: true,
    choices: [],
  },
  creativity: {
    title: "ئاخىرلىشىش: يېڭى بىر شېئىر",
    text: "ئاق بەت رەڭلىك سۆزلەر بىلەن تولدى:\n«بىر تامچە سۇ، بىر ئىللىق سۆز،\nبىر كىچىك ئوي — ئېچىلغان گۈل.»\n\nسىز ھېكايىنىڭ جاۋابىنى ئۆزىڭىز يازدىڭىز. ھەر بىر ئارزۇنىڭ ئۆزىگە خاس ئاۋازى بار ئىكەن.",
    art: "sunflower",
    ending: true,
    choices: [],
  },
  learning: {
    title: "ئاخىرلىشىش: ئېچىلغان ئىشىك",
    text: "بۈگۈن «ئۈمىد» دېگەن سۆزنى قايتىدىن چۈشەندىڭىز. بىر بەت كىتاب، بىر يېڭى دوست، بىر سوئال — ھەممىسى يېڭى ئىشىكلەرنى ئاچتى.\n\nسىز خەتنىڭ ئاستىغا «مەن داۋاملىق ئۆگىنىمەن» دەپ يېزىپ قويدىڭىز. بۇ سىزنىڭ يېڭى باشلىنىشىڭىز ئىدى.",
    art: "owl",
    ending: true,
    choices: [],
  },
};
export function validStoryPath(path: unknown): path is string[] {
  return (
    strings(path) &&
    path.length > 0 &&
    path.length < 20 &&
    path[0] === "start" &&
    path.every(
      (key, i) =>
        !!story[key] &&
        (i === 0 || story[path[i - 1]].choices.some((c) => c.next === key)),
    )
  );
}
