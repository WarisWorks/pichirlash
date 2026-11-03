import test from "node:test";
import assert from "node:assert/strict";
import {
  awardReward,
  waterGarden,
  emptyGarden,
  constrainDesk,
  moveWord,
  validGarden,
  validDesk,
  validPoems,
  validLetters,
  validStoryPath,
  story,
  localDay,
} from "../src/components/play/model.ts";

test("a completed activity earns one flower even when repeated or edited", () => {
  const reward = {
    id: "poem:one",
    kind: "poem",
    label: "شېئىر",
    day: "2026-11-03",
  };
  const first = awardReward(emptyGarden, reward);
  assert.equal(first.rewards.length, 1);
  assert.equal(awardReward(first, { ...reward, label: "changed" }), first);
  assert.equal(emptyGarden.rewards.length, 0);
  assert.equal(
    awardReward(first, { ...reward, id: "story:kindness" }).rewards.length,
    2,
  );
});
test("watering is once per local calendar day, with no date rollover in UTC", () => {
  const first = waterGarden(emptyGarden, "2026-11-03");
  assert.equal(waterGarden(first, "2026-11-03"), first);
  assert.equal(waterGarden(first, "2026-11-04").watered.length, 2);
  const date = new Date(2026, 10, 3, 0, 5);
  assert.equal(localDay(date), "2026-11-03");
});
test("desk dragging and resizing cannot move objects outside the board", () => {
  for (const type of ["note", "quote", "sticker"])
    for (const w of [2, 12, 25, 36, 99])
      for (const x of [-100, 0, 90, 300])
        for (const y of [-100, 0, 99, 300]) {
          const item = constrainDesk({
            id: "x",
            type,
            text: "hello",
            art: "sunflower",
            color: "yellow",
            x,
            y,
            w,
          });
          assert.ok(item.w >= 12 && item.w <= 36);
          assert.ok(item.x >= 0 && item.x + item.w <= 100);
          assert.ok(
            item.y >= 0 &&
              item.y +
                (item.w * (1000 / 680)) / (type === "sticker" ? 1 : 1.2) <=
                100.000001,
          );
        }
});
test("word reordering preserves repeated words and explicit line breaks", () => {
  const words = ["بىر", "گۈل", "\n", "بىر", "ئۈمىد"];
  assert.deepEqual(moveWord(words, 1, 4), ["بىر", "\n", "بىر", "ئۈمىد", "گۈل"]);
  assert.deepEqual(moveWord(words, 4, 0), ["ئۈمىد", "بىر", "گۈل", "\n", "بىر"]);
  assert.equal(moveWord(words, -1, 2), words);
  assert.equal(moveWord(words, 0, words.length), words);
  assert.equal(words.length, 5);
});
test("story navigation validates real edges and every ending is reachable", () => {
  assert.equal(validStoryPath(["start", "letter", "creativity"]), true);
  assert.equal(validStoryPath(["start", "kindness"]), false);
  assert.equal(validStoryPath(["start", "library", "creativity"]), false);
  assert.equal(validStoryPath(["unknown"]), false);
  const reachable = new Set();
  const visit = (path) => {
    assert.equal(validStoryPath(path), true);
    const current = story[path.at(-1)];
    if (current.ending) {
      reachable.add(path.at(-1));
      assert.equal(current.choices.length, 0);
    } else
      for (const choice of current.choices) {
        assert.ok(story[choice.next]);
        assert.ok(!path.includes(choice.next), "story should not loop");
        visit([...path, choice.next]);
      }
  };
  visit(["start"]);
  assert.deepEqual([...reachable].sort(), [
    "creativity",
    "kindness",
    "learning",
  ]);
});
test("stored data validators reject malformed browser state", () => {
  assert.equal(validGarden({ rewards: [{ id: 2 }], watered: [] }), false);
  assert.equal(validGarden(emptyGarden), true);
  assert.equal(
    validDesk([
      {
        id: "x",
        type: "sticker",
        text: "",
        art: "owl",
        color: "green",
        x: NaN,
        y: 2,
        w: 20,
      },
    ]),
    false,
  );
  assert.equal(
    validPoems([
      {
        id: "p",
        title: "title",
        color: "pink",
        art: "owl",
        words: Array(61).fill("گۈل"),
      },
    ]),
    false,
  );
  assert.equal(
    validPoems([
      { id: "p", title: "title", color: "pink", art: "owl", words: ["گۈل"] },
    ]),
    true,
  );
  assert.equal(
    validLetters([
      {
        id: "l",
        to: "friend",
        title: "title",
        body: "body",
        color: "pink",
        stamp: "owl",
        sealed: "yes",
      },
    ]),
    false,
  );
  assert.equal(validLetters([]), true);
});

test("browser storage loading survives invalid JSON, invalid schemas and denied storage", async () => {
  const { loadLocal } = await import("../src/components/play/useLocal.ts");
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const mock = (getItem) =>
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: { getItem },
    });
  try {
    mock(() => "{broken");
    assert.equal(loadLocal("test", emptyGarden, validGarden), emptyGarden);
    mock(() => JSON.stringify({ rewards: 9 }));
    assert.equal(loadLocal("test", emptyGarden, validGarden), emptyGarden);
    mock(() => {
      throw Error("denied");
    });
    assert.equal(loadLocal("test", emptyGarden, validGarden), emptyGarden);
    mock(() => JSON.stringify({ rewards: [], watered: ["2026-11-03"] }));
    assert.deepEqual(loadLocal("test", emptyGarden, validGarden).watered, [
      "2026-11-03",
    ]);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});
