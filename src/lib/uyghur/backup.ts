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

/** Write a backup into storage. "replace" first removes keys the backup does not contain. */
export function restoreBackup(
  storage: Pick<Storage, "length" | "key" | "setItem" | "removeItem">,
  backup: Backup,
  mode: "replace" | "merge",
) {
  if (mode === "replace") {
    const existing: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(BACKUP_PREFIX) && !(key in backup.data)) existing.push(key);
    }
    existing.forEach((k) => storage.removeItem(k));
  }
  for (const [key, value] of Object.entries(backup.data)) storage.setItem(key, value);
  return Object.keys(backup.data).length;
}

export const backupFileName = (created: string) =>
  `pichirlash-backup-${created.slice(0, 10)}.json`;
