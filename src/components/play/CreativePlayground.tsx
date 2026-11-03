import { lazy, Suspense, useState } from "react";
import { playPanels } from "./PlayPreview";
import type { PlayPanel } from "./PlayPreview";
import type { CardContent } from "./PoetryPlayground";
import { localDay } from "./model";
import type { GardenState } from "./model";
const Desk = lazy(() => import("./CreativeDesk"));
const Poetry = lazy(() => import("./PoetryPlayground"));
const Story = lazy(() => import("./StoryTrail"));
const Letters = lazy(() => import("./LetterCorner"));
const Garden = lazy(() => import("./WordGarden"));
const Postcard = lazy(() => import("./PostcardMaker"));
export default function CreativePlayground({
  initialPanel,
  garden,
  onReward,
  onWater,
  onRead,
  onWrite,
}: {
  initialPanel: PlayPanel;
  garden: GardenState;
  onReward: (key: string, label: string) => void;
  onWater: () => void;
  onRead: () => void;
  onWrite: () => void;
}) {
  const [panel, setPanel] = useState(initialPanel),
    [card, setCard] = useState<(CardContent & { id: string }) | undefined>();
  const onCard = (content: CardContent) => {
    setCard({ ...content, id: String(Date.now()) });
    setPanel("postcard");
  };
  return (
    <div className="creative-playground">
      <nav className="play-tabs" aria-label="ئىجادىي مەيدان يولباشچى">
        {playPanels.map((item) => (
          <button
            key={item.id}
            aria-pressed={panel === item.id}
            onClick={() => setPanel(item.id)}
          >
            {item.title}
          </button>
        ))}
      </nav>
      <Suspense
        fallback={
          <p className="play-loading" role="status">
            قەغەزلەر تەييارلىنىۋاتىدۇ…
          </p>
        }
      >
        {panel === "desk" && (
          <Desk
            onReward={(key, label) => onReward(`${key}:${localDay()}`, label)}
          />
        )}
        {panel === "poetry" && <Poetry onReward={onReward} onCard={onCard} />}
        {panel === "story" && <Story onReward={onReward} onWrite={onWrite} />}
        {panel === "letters" && <Letters onReward={onReward} />}
        {panel === "garden" && (
          <Garden
            garden={garden}
            onWater={onWater}
            onRead={onRead}
            onCreate={() => setPanel("poetry")}
          />
        )}
        {panel === "postcard" && (
          <Postcard
            key={card?.id || "blank-postcard"}
            incoming={card}
            onReward={onReward}
          />
        )}
      </Suspense>
    </div>
  );
}
