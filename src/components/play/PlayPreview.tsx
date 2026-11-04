import { Sticker } from "@/components/ui/sticker";
export type PlayPanel =
  | "desk"
  | "poetry"
  | "story"
  | "letters"
  | "garden"
  | "postcard"
  | "language"
  | "spelling"
  | "trace"
  | "fillstory"
  | "recipes"
  | "voices"
  | "numbers"
  | "alphabet"
  | "wordsearch"
  | "memory"
  | "family"
  | "diary"
  | "sprint";
export type PlayGroup = "create" | "learn" | "games" | "family";
export const playGroups: {
  id: PlayGroup;
  title: string;
  panels: PlayPanel[];
}[] = [
  {
    id: "create",
    title: "ئىجادىيەت",
    panels: [
      "desk",
      "poetry",
      "story",
      "letters",
      "postcard",
      "fillstory",
      "sprint",
    ],
  },
  {
    id: "learn",
    title: "تىل ئۆگىنىش",
    panels: ["alphabet", "language", "spelling", "trace", "numbers"],
  },
  {
    id: "games",
    title: "ئويۇنلار",
    panels: ["wordsearch", "memory", "garden"],
  },
  {
    id: "family",
    title: "ئائىلە ۋە كۈندىلىك",
    panels: ["family", "recipes", "voices", "diary"],
  },
];
export const groupOf = (panel: PlayPanel): PlayGroup =>
  playGroups.find((g) => g.panels.includes(panel))?.id ?? "create";
export const playPanels: {
  id: PlayPanel;
  title: string;
  description: string;
  art: string;
}[] = [
  {
    id: "desk",
    title: "ئىجادىي ئۈستەل",
    description: "قەغەزلەر، نەقىللەر ۋە چاپلاقلاردىن ئۆز دۇنياڭىزنى قۇرۇڭ.",
    art: "notebook",
  },
  {
    id: "poetry",
    title: "شېئىر مەيدانچىسى",
    description: "سۆزلەرنى تىزىپ، كۆڭلىڭىزدىكى شېئىرنى تېپىڭ.",
    art: "sunflower",
  },
  {
    id: "story",
    title: "ھېكايە يولى",
    description: "تاللاشلىرىڭىز بىلەن ھېكايىنىڭ ئاخىرىنى ئۆزگەرتىڭ.",
    art: "owl",
  },
  {
    id: "letters",
    title: "خەت بۇلۇڭى",
    description: "بىر ئىللىق خەت يازىڭ، قاتلاڭ ۋە پېچەتلەڭ.",
    art: "teacup",
  },
  {
    id: "garden",
    title: "كۆڭۈل باغچىسى",
    description: "ھەر بىر كىچىك ياخشى ئىشىڭىزدىن بىر گۈل ئۆستۈرۈڭ.",
    art: "bee",
  },
  {
    id: "postcard",
    title: "ئەسلىمە كارتىسى",
    description: "گۈزەل سۆزلىرىڭىزنى رەسىمگە ئايلاندۇرۇپ ساقلاڭ.",
    art: "comet",
  },
  {
    id: "language",
    title: "تىل ئۈستەلى",
    description:
      "ئەرەب، لاتىن ۋە كىرىل يېزىقلىرى ئارىسىدا ئالماشتۇرۇڭ؛ سۆزلىرىڭىزنى تەكرارلاڭ.",
    art: "owl",
  },
  {
    id: "spelling",
    title: "ئىملا ئويۇنى",
    description: "ې/ى، ۆ/ۈ، ۇ/و ۋە ھەمزىنى توغرا يېزىشنى مەشىق قىلىڭ.",
    art: "notebook",
  },
  {
    id: "trace",
    title: "ھۆسنخەت مەشىقى",
    description: "ھەرپلەرنى قوليازما خەت نۇسخىسى بويىچە سىزىپ مەشىق قىلىڭ.",
    art: "teacup",
  },
  {
    id: "fillstory",
    title: "سۆز تولدۇرۇش ھېكايىسى",
    description: "بوش ئورۇنلارغا سۆز تاللاڭ، كۈلكىلىك ھېكايە تۇغۇلسۇن.",
    art: "bunny",
  },
  {
    id: "recipes",
    title: "ئائىلە تائاملىرى",
    description: "مومىڭىزنىڭ لەغمەن، پولۇ ۋە سامسا رېتسېپىنى كارتا قىلىڭ.",
    art: "cherries",
  },
  {
    id: "voices",
    title: "ئائىلە ئاۋازلىرى",
    description: "چوڭلارنىڭ ھېكايە ۋە ئەسلىمىلىرىنى ئاۋاز بىلەن ساقلاڭ.",
    art: "smiley",
  },
  {
    id: "numbers",
    title: "سانلار ۋە سائەت",
    description: "1234 نى ئۇيغۇرچە ئوقۇڭ، سائەتنى ئېيتىشنى ئۆگىنىڭ.",
    art: "comet",
  },
  {
    id: "alphabet",
    title: "ئېلىپبە كىتابى",
    description: "32 ھەرپنى رەسىملىك بەتلەردە ۋاراقلاپ ئۆگىنىڭ.",
    art: "notebook",
  },
  {
    id: "wordsearch",
    title: "سۆز ئىزدەش",
    description: "ھەرپلەر تورىدىن يوشۇرۇن سۆزلەرنى تېپىڭ.",
    art: "owl",
  },
  {
    id: "memory",
    title: "ئەستە تۇتۇش ئويۇنى",
    description: "كارتىلارنى ئۆرۈپ، ماس جۈپلەرنى تېپىڭ.",
    art: "bunny",
  },
  {
    id: "family",
    title: "ئائىلە دەرىخى",
    description:
      "تۇغقانلىرىڭىزنى قوشۇڭ، ئۇيغۇرچە تۇغقاندارچىلىق ناملىرىنى ئۆگىنىڭ.",
    art: "sunflower",
  },
  {
    id: "diary",
    title: "كەيپىيات كۈندىلىكى",
    description: "ھەر كۈنى بىر قۇر يېزىڭ، ئايلىق كەيپىياتىڭىزنى كۆرۈڭ.",
    art: "teacup",
  },
  {
    id: "sprint",
    title: "يېزىقچىلىق مۇسابىقىسى",
    description: "ۋاقىت بەلگىلەپ، توختىماي يېزىپ بېقىڭ.",
    art: "comet",
  },
];
export default function PlayPreview({
  onOpen,
}: {
  onOpen: (panel: PlayPanel) => void;
}) {
  return (
    <section className="play-preview">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            ئازراق ئوقۇشتىن، ئۆزىڭىز بىر دۇنيا ياساشقىچە
          </span>
          <h2>بۈگۈن نېمە ياسىماقچى؟</h2>
        </div>
      </div>
      {playGroups.map((group) => (
        <div key={group.id} className="play-preview-group">
          <h3>{group.title}</h3>
          <div className="play-preview-grid">
            {group.panels
              .map((id) => playPanels.find((p) => p.id === id)!)
              .map((item) => (
                <button
                  key={item.id}
                  className={`preview-${item.id}`}
                  onClick={() => onOpen(item.id)}
                >
                  <Sticker name={item.art} size={66} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}
