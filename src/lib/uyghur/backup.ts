/**
 * Backup and restore of everything Pichirlash keeps in localStorage.
 * Voice recordings live in IndexedDB and are downloaded separately.
 */
export const BACKUP_PREFIX = "pichirlash-";
export type Backup = {
  app: "pichirlash";
  version: 1;
  created: string;
  data: Record<string, string>;
};

export function makeBackup(storage: Pick<Storage, "length" | "key" | "getItem">, now = new Date()): Backup {
  const data: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(BACKUP_PREFIX)) continue;
    const value = storage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return { app: "pichirlash", version: 1, created: now.toISOString(), data };
}

/** Parse a backup file; returns null for anything that is not a valid Pichirlash backup. */
export function parseBackup(text: string): Backup | null {
  try {
    const v: unknown = JSON.parse(text);
    if (!v || typeof v !== "object") return null;
    const b = v as Record<string, unknown>;
    if (b.app !== "pichirlash" || b.version !== 1 || typeof b.created !== "string") return null;
    if (!b.data || typeof b.data !== "object" || Array.isArray(b.data)) return null;
    const entries = Object.entries(b.data as Record<string, unknown>);
    if (entries.length > 500) return null;
    for (const [key, value] of entries) {
      if (!key.startsWith(BACKUP_PREFIX) || typeof value !== "string") return null;
      JSON.parse(value);
    }
    return { app: "pichirlash", version: 1, created: b.created, data: b.data as Record<string, string> };
  } catch {
    return null;
  }
}

/**
 * Write a backup into storage. "replace" first removes keys the backup does not contain.
 * If a write fails (for example the storage quota is full), every Pichirlash key is put
 * back exactly as it was and the error is rethrown, so a failed restore loses nothing.
 */
export function restoreBackup(
  storage: Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">,
  backup: Backup,
  mode: "replace" | "merge",
) {
  const pichirlashKeys = () => {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(BACKUP_PREFIX)) keys.push(key);
    }
    return keys;
  };
  const snapshot = new Map<string, string>();
  for (const key of pichirlashKeys()) {
    const value = storage.getItem(key);
    if (value !== null) snapshot.set(key, value);
  }
  try {
    if (mode === "replace")
      for (const key of snapshot.keys()) if (!(key in backup.data)) storage.removeItem(key);
    for (const [key, value] of Object.entries(backup.data)) storage.setItem(key, value);
  } catch (error) {
    for (const key of pichirlashKeys()) if (!snapshot.has(key)) storage.removeItem(key);
    for (const [key, value] of snapshot) storage.setItem(key, value);
    throw error;
  }
  return Object.keys(backup.data).length;
}

export const backupFileName = (created: string) =>
  `pichirlash-backup-${created.slice(0, 10)}.json`;
