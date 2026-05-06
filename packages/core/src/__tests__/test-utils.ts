import type { MorphItemData, MorphStorage } from "../lib/types";

/**
 * In-memory storage adapter for testing.
 * Behaves like localStorage but without needing a browser environment.
 */
export class MemoryStorage implements MorphStorage {
  private store = new Map<string, string>();

  get(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  keys(prefix: string): string[] {
    const result: string[] = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        result.push(key);
      }
    }
    return result;
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Helper to read and parse item data from storage.
 * Throws if item doesn't exist — use in tests where you expect data to be present.
 */
export function getItem(storage: MemoryStorage, group: string, id: string): MorphItemData {
  const raw = storage.get(`${group}:${id}`);
  if (!raw) throw new Error(`Item ${group}:${id} not found in storage`);
  return JSON.parse(raw) as MorphItemData;
}
