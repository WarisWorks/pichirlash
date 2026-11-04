/**
 * Serverless sharing: content is encoded into the URL fragment (#share=…),
 * which browsers never send to a server.
 */
export type SharedPoem = { kind: "poem"; title: string; text: string; color: string; art: string };
export type SharedCard = { kind: "postcard"; title: string; text: string; color: string; art: string };
export type SharedRecipe = {
  kind: "recipe";
  title: string;
  from: string;
  ingredients: string;
  steps: string;
  memory: string;
  color: string;
  art: string;
};
export type SharedStory = { kind: "story"; title: string; text: string; art: string };
export type SharedItem = SharedPoem | SharedCard | SharedRecipe | SharedStory;

const FIELDS: Record<SharedItem["kind"], string[]> = {
  poem: ["title", "text", "color", "art"],
  postcard: ["title", "text", "color", "art"],
  recipe: ["title", "from", "ingredients", "steps", "memory", "color", "art"],
  story: ["title", "text", "art"],
};

/** Longest text a shared link carries, so links stay usable in chat apps. */
export const MAX_SHARE_CHARS = 4000;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(text: string) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function encodeShare(item: SharedItem): string {
  const fields = FIELDS[item.kind];
  const record = item as unknown as Record<string, string>;
  const payload = [item.kind, ...fields.map((k) => record[k] ?? "")];
  const size = payload.join("").length;
  if (size > MAX_SHARE_CHARS) throw new RangeError("share-too-long");
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

export function decodeShare(code: string): SharedItem | null {
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(fromBase64Url(code)));
    if (!Array.isArray(value) || !value.every((x) => typeof x === "string")) return null;
    const [kind, ...rest] = value as string[];
    const fields = FIELDS[kind as SharedItem["kind"]];
    if (!fields || rest.length !== fields.length) return null;
    if (rest.join("").length > MAX_SHARE_CHARS) return null;
    return Object.fromEntries([["kind", kind], ...fields.map((k, i) => [k, rest[i]])]) as SharedItem;
  } catch {
    return null;
  }
}

export function shareUrl(item: SharedItem, base: string) {
  const url = new URL(base);
  url.hash = `share=${encodeShare(item)}`;
  return url.toString();
}

export function readShareHash(hash: string): SharedItem | null {
  const match = hash.match(/^#?share=([A-Za-z0-9_-]+)$/);
  return match ? decodeShare(match[1]) : null;
}
