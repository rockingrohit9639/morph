import type { MorphStorage } from "./types";

/** All morph keys in localStorage are prefixed to avoid collisions. */
const PREFIX = "morph:";

/**
 * Default storage adapter using browser localStorage.
 * Keys are stored as "morph:<group>:<id>" in localStorage.
 * The adapter strips/adds the prefix transparently.
 */
export class LocalStorageAdapter implements MorphStorage {
  get(key: string): string | null {
    return localStorage.getItem(`${PREFIX}${key}`);
  }

  set(key: string, value: string): void {
    localStorage.setItem(`${PREFIX}${key}`, value);
  }

  delete(key: string): void {
    localStorage.removeItem(`${PREFIX}${key}`);
  }

  keys(prefix: string): string[] {
    const fullPrefix = `${PREFIX}${prefix}`;
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(fullPrefix)) {
        // Return key without the global "morph:" prefix
        result.push(key.slice(PREFIX.length));
      }
    }
    return result;
  }
}
