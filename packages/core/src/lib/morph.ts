import { computeNewScore, getDecayedScore, isItemActive } from "./frecency";
import { LocalStorageAdapter } from "./storage";
import type { MorphConfig, MorphGroupConfig, MorphItemData, MorphRankedItem, MorphStorage } from "./types";

const DEFAULT_CONFIG: MorphGroupConfig = {
  decayConstant: 0.05,
  activeThreshold: 1.0,
};

/**
 * Core Morph instance. Tracks user interactions and ranks items by frecency.
 */
export class Morph {
  private storage: MorphStorage;
  private defaults: MorphGroupConfig;
  private groups: Record<string, MorphGroupConfig>;

  constructor() {
    this.storage = new LocalStorageAdapter();
    this.defaults = DEFAULT_CONFIG;
    this.groups = {};
  }

  /** Swap storage backend or update config. */
  configure(config: Partial<MorphConfig>): void {
    if (config.storage) this.storage = config.storage;
    if (config.defaults) this.defaults = { ...this.defaults, ...config.defaults };
    if (config.groups) this.groups = { ...this.groups, ...config.groups };
  }

  /** Get the resolved config for a group (group-specific overrides merged with defaults). */
  private getGroupConfig(group: string): MorphGroupConfig {
    return { ...this.defaults, ...this.groups[group] };
  }

  /** Build the storage key for a group:id pair. */
  private key(group: string, id: string): string {
    return `${group}:${id}`;
  }

  /** Read item data from storage, or null if it doesn't exist. */
  private getItem(group: string, id: string): MorphItemData | null {
    const raw = this.storage.get(this.key(group, id));
    if (!raw) return null;
    return JSON.parse(raw) as MorphItemData;
  }

  /** Write item data to storage. */
  private setItem(group: string, id: string, data: MorphItemData): void {
    this.storage.set(this.key(group, id), JSON.stringify(data));
  }

  /**
   * Get all tracked items in a group, sorted by frecency score (highest first).
   * Applies read-time decay — scores reflect current relevance, not stored value.
   */
  rank(group: string): MorphRankedItem[] {
    const now = Date.now();
    const config = this.getGroupConfig(group);
    const keys = this.storage.keys(`${group}:`);

    const items: { id: string; score: number; isActive: boolean }[] = [];

    for (const key of keys) {
      const raw = this.storage.get(key);
      if (!raw) continue;

      const data = JSON.parse(raw) as MorphItemData;
      const id = key.slice(group.length + 1); // strip "group:" prefix
      const score = getDecayedScore(data, now, config);
      const active = isItemActive(data, now, config);

      items.push({ id, score, isActive: active });
    }

    items.sort((a, b) => b.score - a.score);

    return items.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  /**
   * Record an interaction for an item.
   * Updates the frecency score, use count, and last-used timestamp.
   */
  track(group: string, id: string): void {
    const now = Date.now();
    const config = this.getGroupConfig(group);
    const existing = this.getItem(group, id);

    const newScore = computeNewScore(existing, now, config);

    const updated: MorphItemData = {
      lastUsed: now,
      useCount: (existing?.useCount ?? 0) + 1,
      score: newScore,
    };

    this.setItem(group, id, updated);
  }
}
