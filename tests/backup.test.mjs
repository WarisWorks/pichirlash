import test from "node:test";
import assert from "node:assert/strict";
import { makeBackup, parseBackup, restoreBackup } from "../src/lib/uyghur/backup.ts";

function memoryStorage(init = {}) {
  const map = new Map(Object.entries(init));
  return {
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    map,
  };
}

test("backup only includes Pichirlash keys and round-trips", () => {
  const s = memoryStorage({ "pichirlash-garden-v1": '{"rewards":[],"watered":[]}', "other-app": "1" });
  const b = makeBackup(s, new Date("2026-11-04T10:00:00Z"));
  assert.deepEqual(Object.keys(b.data), ["pichirlash-garden-v1"]);
  assert.deepEqual(parseBackup(JSON.stringify(b)), b);
});

test("invalid or foreign files are rejected", () => {
  assert.equal(parseBackup("nope"), null);
  assert.equal(parseBackup(JSON.stringify({ app: "x", version: 1, created: "", data: {} })), null);
  assert.equal(
    parseBackup(JSON.stringify({ app: "pichirlash", version: 1, created: "", data: { "evil-key": "1" } })),
    null,
  );
  assert.equal(
    parseBackup(JSON.stringify({ app: "pichirlash", version: 1, created: "", data: { "pichirlash-a": "{bad" } })),
    null,
  );
});

test("merge keeps other keys; replace removes Pichirlash keys not in the backup", () => {
  const backup = { app: "pichirlash", version: 1, created: "x", data: { "pichirlash-a": "1" } };
  const merged = memoryStorage({ "pichirlash-b": "2", other: "3" });
  restoreBackup(merged, backup, "merge");
  assert.deepEqual([...merged.map.keys()].sort(), ["other", "pichirlash-a", "pichirlash-b"]);
  const replaced = memoryStorage({ "pichirlash-b": "2", other: "3" });
  restoreBackup(replaced, backup, "replace");
  assert.deepEqual([...replaced.map.keys()].sort(), ["other", "pichirlash-a"]);
});
