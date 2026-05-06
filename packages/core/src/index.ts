import { Morph } from "./lib/morph";

export { Morph } from "./lib/morph";
export { LocalStorageAdapter } from "./lib/storage";
export type { MorphConfig, MorphGroupConfig, MorphItemData, MorphRankedItem, MorphStorage } from "./lib/types";

/** Default singleton instance — use this for most cases. */
export const morph = new Morph();
