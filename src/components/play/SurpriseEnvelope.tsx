import { useState } from "react";
import { Mail, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
const surprises = [
  {
    title: "بۈگۈنكى كىچىك سوۋغا",
    body: "«كۈنلىرىڭىزگە مېھىر چېچىپ ماڭسىڭىز، ئەڭ ئاددىي دەملەرمۇ باھارغا ئايلىنىدۇ.»",
    art: "sunflower",
  },
  {
    title: "بىر ئىللىق ئەسكەرتىش",
    body: "ھەممە ئىشنى بىر كۈندە تاماملاش شەرت ئەمەس. بۈگۈن قىلغان بىر كىچىك ئىشىڭىزمۇ قەدىرلىك.",
    art: "teacup",
  },
  {
    title: "بىر سوئال، بىر ھېكايە",
    body: "بالىلىقىڭىزدىكى بىر ئىشىك سۆزلىيەلىسە، سىزگە قايسى ھېكايىنى ئېيتىپ بېرەتتى؟",
    art: "owl",
  },
  {
    title: "بىر كىچىك شېئىر",
    body: "ئاستا كەلدى باھار شامىلى،\nكۆڭلۈمگە قوندى ئۈمىد نۇرى.\nبىر ياخشى سۆز، بىر كۈلۈمسىرەش،\nيورۇتتى بۈگۈن دۇنيا يولىنى.",
    art: "comet",
  },
  {
    title: "سىناپ بېقىڭ",
    body: "«ئۈمىد»، «يامغۇر»، «كۈلۈمسىرەش» دېگەن ئۈچ سۆز بىلەن بىر پارچە شېئىر ياساپ بېقىڭ.",
    art: "notebook",
  },
];
export default function SurpriseEnvelope({
  onCreate,
}: {
  onCreate: () => void;
}) {
  const [index, setIndex] = useState(0),
    [open, setOpen] = useState(false);
  const item = surprises[index];
  return (
    <section className={`surprise-envelope ${open ? "opened" : ""}`}>
      <div className="surprise-envelope-art">
        <Mail size={60} />
        <Sticker name={item.art} size={48} />
      </div>
      <div>
        <span className="eyebrow">سىزگە بىر كىچىك كونۋېرت</span>
        <h3>{open ? item.title : "ئىچىدە نېمە باركىن؟"}</h3>
        {open ? (
          <p className="surprise-message" aria-live="polite">
            {item.body}
          </p>
        ) : (
          <p>بىر پارچە شېئىر، بىر ئىللىق سۆز ياكى يېڭى بىر ئوي…</p>
        )}
        <div className="editor-actions">
          <Button
            variant="outline"
            onClick={() => {
              if (open)
                setIndex(
                  (v) =>
                    (v +
                      1 +
                      Math.floor(Math.random() * (surprises.length - 1))) %
                    surprises.length,
                );
              setOpen(true);
            }}
          >
            {open ? <RotateCcw size={16} /> : <Mail size={16} />}{" "}
            {open ? "يەنە بىر كونۋېرت" : "كونۋېرتنى ئېچىش"}
          </Button>
          {open && (
            <Button variant="ghost" onClick={onCreate}>
              بىر نەرسە ياساي <ArrowLeft size={16} />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
