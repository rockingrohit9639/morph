/**
 * Sync storage interface for Morph.
 */
export interface MorphStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  delete(key: string): void;
  /** Returns all keys matching the given prefix (without the global "morph:" prefix). */
  keys(prefix: string): string[];
}

/** Persisted data for a single tracked item. */
export interface MorphItemData {
  /** Unix timestamp (ms) of last interaction */
  lastUsed: number;
  /** Total number of times track() was called for this item */
  useCount: number;
  /** Frecency score — frequency weighted by recency via exponential decay */
  score: number;
}

/** A single item returned by morph.rank(), with computed fields. */
export interface MorphRankedItem {
  id: string;
  /** Current score after applying read-time decay */
  score: number;
  /** Position in group (1 = most used) */
  rank: number;
  /** Whether this item is considered "active" (score above threshold) */
  isActive: boolean;
}

/** Per-group configuration overrides. */
export interface MorphGroupConfig {
  /** Controls how fast scores decay. Higher = faster fade. Default: 0.05 */
  decayConstant?: number;
  /** Minimum decayed score to be considered "active". Default: 1.0 */
  activeThreshold?: number;
}

/** Top-level Morph configuration. */
export interface MorphConfig {
  /** Storage backend (localStorage adapter by default) */
  storage: MorphStorage;
  /** Default config applied to all groups unless overridden */
  defaults?: MorphGroupConfig;
  /** Per-group config overrides keyed by group name */
  groups?: Record<string, MorphGroupConfig>;
}
