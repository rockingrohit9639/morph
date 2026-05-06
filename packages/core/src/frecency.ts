import type { MorphGroupConfig, MorphItemData } from "./types";

const DEFAULT_DECAY_CONSTANT = 0.05;
const DEFAULT_ACTIVE_THRESHOLD = 1.0;

/**
 * Applies time-based exponential decay to a score.
 * The longer since last use, the more the score shrinks.
 *
 * Formula: decay = e^(-daysSinceLastUse * decayConstant)
 *
 * Examples with default decayConstant (0.05):
 * - 1 day ago:  decay ≈ 0.95 (score barely changes)
 * - 7 days ago: decay ≈ 0.70
 * - 30 days ago: decay ≈ 0.22 (score drops significantly)
 * - 60 days ago: decay ≈ 0.05 (nearly gone)
 */
export function computeDecay(daysSinceLastUse: number, decayConstant: number): number {
  return Math.exp(-daysSinceLastUse * decayConstant);
}

/**
 * Computes the current decayed score for an item at a given point in time.
 * Used at read time (rank/isActive) to reflect natural score fading.
 */
export function getDecayedScore(item: MorphItemData, now: number, config: MorphGroupConfig): number {
  const decayConstant = config.decayConstant ?? DEFAULT_DECAY_CONSTANT;
  const daysSinceLastUse = (now - item.lastUsed) / 86_400_000;
  const decay = computeDecay(daysSinceLastUse, decayConstant);
  return item.score * decay;
}

/**
 * Computes the new score after a track() interaction.
 * Applies decay to the old score (based on time since last use), then adds 1.
 *
 * This means:
 * - Frequent daily use → score keeps growing
 * - Long gap then one click → old score decays first, then +1 (barely moves needle)
 * - First ever interaction → score = 1
 */
export function computeNewScore(existing: MorphItemData | null, now: number, config: MorphGroupConfig): number {
  if (!existing) return 1;

  const decayedScore = getDecayedScore(existing, now, config);
  return decayedScore + 1;
}

/**
 * Determines whether an item is "active" — i.e. its decayed score
 * is above the configured threshold.
 */
export function isItemActive(item: MorphItemData, now: number, config: MorphGroupConfig): boolean {
  const activeThreshold = config.activeThreshold ?? DEFAULT_ACTIVE_THRESHOLD;
  const decayedScore = getDecayedScore(item, now, config);
  return decayedScore >= activeThreshold;
}
