import { lazy, Suspense, useState } from "react";
import { groupOf, playGroups, playPanels } from "./PlayPreview";
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
const Language = lazy(() => import("@/components/features/LanguageTools"));
const Spelling = lazy(() => import("./SpellingPractice"));
const Trace = lazy(() => import("./CalligraphyTrace"));
const FillStory = lazy(() => import("./FillStory"));
const Recipes = lazy(() => import("./RecipeCards"));
const Voices = lazy(() => import("./VoiceNotes"));
const Numbers = lazy(() => import("./NumbersPanel"));
const Alphabet = lazy(() => import("./AlphabetBook"));
const WordSearch = lazy(() => import("./WordSearch"));
const Memory = lazy(() => import("./MemoryMatch"));
const Family = lazy(() => import("./FamilyTree"));
const Diary = lazy(() => import("./MoodDiary"));
const Sprint = lazy(() => import("./WritingSprint"));
export default function CreativePlayground({
  initialPanel,
  garden,
  readingDays,
  onReward,
  onWater,
  onRead,
  onWrite,
}: {
  initialPanel: PlayPanel;
  garden: GardenState;
  readingDays: string[];
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
      <nav className="play-groups" aria-label="بۆلۈملەر">
        {playGroups.map((g) => (
          <button
            key={g.id}
            aria-pressed={groupOf(panel) === g.id}
            onClick={() => setPanel(g.panels[0])}
          >
            {g.title}
          </button>
        ))}
      </nav>
      <nav className="play-tabs" aria-label="ئىجادىي مەيدان يولباشچى">
        {playGroups
          .find((g) => g.id === groupOf(panel))!
          .panels.map((id) => playPanels.find((p) => p.id === id)!)
          .map((item) => (
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
            readingDays={readingDays}
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
        {panel === "language" && <Language />}
        {panel === "spelling" && <Spelling onReward={onReward} />}
        {panel === "trace" && <Trace onReward={onReward} />}
        {panel === "fillstory" && <FillStory onReward={onReward} />}
        {panel === "recipes" && <Recipes onReward={onReward} />}
        {panel === "voices" && <Voices onReward={onReward} />}
        {panel === "numbers" && <Numbers onReward={onReward} />}
        {panel === "alphabet" && <Alphabet onReward={onReward} />}
        {panel === "wordsearch" && <WordSearch onReward={onReward} />}
        {panel === "memory" && <Memory onReward={onReward} />}
        {panel === "family" && <Family onReward={onReward} />}
        {panel === "diary" && <Diary onReward={onReward} />}
        {panel === "sprint" && <Sprint onReward={onReward} />}
      </Suspense>
    </div>
  );
}
