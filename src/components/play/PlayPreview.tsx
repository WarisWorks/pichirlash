import { Sticker } from "@/components/ui/sticker";
export type PlayPanel =
  | "desk"
  | "poetry"
  | "story"
  | "letters"
  | "garden"
  | "postcard";
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
      <div className="play-preview-grid">
        {playPanels.map((item) => (
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
    </section>
  );
}
