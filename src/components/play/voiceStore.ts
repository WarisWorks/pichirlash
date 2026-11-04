/** On-device storage for family voice notes. Nothing here leaves the browser. */
export type VoiceNote = {
  id: string;
  title: string;
  speaker: string;
  entryId?: string;
  entryTitle?: string;
  created: number;
  duration: number;
  type: string;
};
export type VoiceStoreErrorCode = "unavailable" | "quota" | "missing" | "failed";
export class VoiceStoreError extends Error {
  readonly code: VoiceStoreErrorCode;
  constructor(code: VoiceStoreErrorCode, message = code) {
    super(message);
    this.name = "VoiceStoreError";
    this.code = code;
  }
}

const DB_NAME = "pichirlash-voice",
  NOTES = "notes",
  AUDIO = "audio",
  VERSION = 1;
export const MAX_SECONDS = 600;
export const voiceMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/ogg",
] as const;

/** First recorder format the browser supports, or "" to let it choose. */
export function pickMimeType(isSupported: (type: string) => boolean): string {
  for (const type of voiceMimeTypes) {
    try {
      if (isSupported(type)) return type;
    } catch {
      /* Some browsers throw for unknown types. */
    }
  }
  return "";
}

/** m:ss with Western digits (Uyghur writing uses 0-9). */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function audioExtension(type: string): string {
  if (type.includes("mp4") || type.includes("aac")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  return "webm";
}

export function validVoiceNote(value: unknown): value is VoiceNote {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    ["id", "title", "speaker", "type"].every((k) => typeof v[k] === "string") &&
    (v.entryId === undefined || typeof v.entryId === "string") &&
    (v.entryTitle === undefined || typeof v.entryTitle === "string") &&
    typeof v.created === "number" &&
    typeof v.duration === "number" &&
    Number.isFinite(v.duration)
  );
}

function toStoreError(error: unknown): VoiceStoreError {
  if (error instanceof VoiceStoreError) return error;
  const name = error instanceof DOMException ? error.name : "";
  if (name === "QuotaExceededError") return new VoiceStoreError("quota");
  if (name === "InvalidStateError" || name === "SecurityError")
    return new VoiceStoreError("unavailable");
  return new VoiceStoreError("failed");
}

let opening: Promise<IDBDatabase> | null = null;
function openDB(): Promise<IDBDatabase> {
  if (opening) return opening;
  opening = new Promise<IDBDatabase>((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      if (typeof indexedDB === "undefined" || !indexedDB)
        throw new VoiceStoreError("unavailable");
      request = indexedDB.open(DB_NAME, VERSION);
    } catch (error) {
      reject(
        error instanceof VoiceStoreError
          ? error
          : new VoiceStoreError("unavailable"),
      );
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(NOTES))
        db.createObjectStore(NOTES, { keyPath: "id" });
      if (!db.objectStoreNames.contains(AUDIO)) db.createObjectStore(AUDIO);
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        opening = null;
      };
      resolve(db);
    };
    request.onerror = () => reject(new VoiceStoreError("unavailable"));
    request.onblocked = () => reject(new VoiceStoreError("failed"));
  }).catch((error: unknown) => {
    opening = null;
    throw error;
  });
  return opening;
}

async function run<T>(
  stores: string[],
  mode: IDBTransactionMode,
  work: (tx: IDBTransaction) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDB();
  return new Promise<T | undefined>((resolve, reject) => {
    let tx: IDBTransaction;
    try {
      tx = db.transaction(stores, mode);
    } catch (error) {
      opening = null;
      reject(toStoreError(error));
      return;
    }
    let result: T | undefined;
    const request = work(tx);
    if (request)
      request.onsuccess = () => {
        result = request.result;
      };
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () => reject(toStoreError(tx.error));
  });
}

/** Notes newest first; only those attached to `entryId` when given. */
export async function listNotes(entryId?: string): Promise<VoiceNote[]> {
  const all = await run<unknown[]>([NOTES], "readonly", (tx) =>
    tx.objectStore(NOTES).getAll(),
  );
  return (all ?? [])
    .filter(validVoiceNote)
    .filter((n) => entryId === undefined || n.entryId === entryId)
    .sort((a, b) => b.created - a.created);
}

export async function saveNote(meta: VoiceNote, blob: Blob): Promise<VoiceNote> {
  if (!validVoiceNote(meta)) throw new VoiceStoreError("failed");
  await run([NOTES, AUDIO], "readwrite", (tx) => {
    tx.objectStore(NOTES).put(meta);
    tx.objectStore(AUDIO).put(blob, meta.id);
  });
  return meta;
}

export async function getAudio(id: string): Promise<Blob> {
  const blob = await run<unknown>([AUDIO], "readonly", (tx) =>
    tx.objectStore(AUDIO).get(id),
  );
  if (!(blob instanceof Blob)) throw new VoiceStoreError("missing");
  return blob;
}

export async function deleteNote(id: string): Promise<void> {
  await run([NOTES, AUDIO], "readwrite", (tx) => {
    tx.objectStore(NOTES).delete(id);
    tx.objectStore(AUDIO).delete(id);
  });
}

export async function renameNote(
  id: string,
  changes: { title?: string; speaker?: string },
): Promise<VoiceNote> {
  let updated: VoiceNote | undefined;
  await run([NOTES], "readwrite", (tx) => {
    const store = tx.objectStore(NOTES),
      request = store.get(id);
    request.onsuccess = () => {
      const current: unknown = request.result;
      if (!validVoiceNote(current)) {
        tx.abort();
        return;
      }
      updated = {
        ...current,
        ...(changes.title !== undefined ? { title: changes.title } : {}),
        ...(changes.speaker !== undefined ? { speaker: changes.speaker } : {}),
      };
      store.put(updated);
    };
  }).catch((error: unknown) => {
    throw updated ? toStoreError(error) : new VoiceStoreError("missing");
  });
  if (!updated) throw new VoiceStoreError("missing");
  return updated;
}
