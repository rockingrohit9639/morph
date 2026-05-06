import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Morph } from "../lib/morph";
import { MemoryStorage } from "./test-utils";

describe("morph.rank()", () => {
  let morph: Morph;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    morph = new Morph();
    morph.configure({ storage });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array for a group with no tracked items", () => {
    const result = morph.rank("sidebar");
    expect(result).toEqual([]);
  });

  it("returns a single item with rank 1", () => {
    morph.track("sidebar", "dashboard");

    const result = morph.rank("sidebar");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("dashboard");
    expect(result[0].rank).toBe(1);
  });

  it("ranks items by score descending (most used first)", () => {
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "tasks");
    morph.track("sidebar", "tasks");
    morph.track("sidebar", "tasks");
    morph.track("sidebar", "settings");
    morph.track("sidebar", "settings");

    const result = morph.rank("sidebar");

    expect(result[0].id).toBe("tasks");
    expect(result[0].rank).toBe(1);
    expect(result[1].id).toBe("settings");
    expect(result[1].rank).toBe(2);
    expect(result[2].id).toBe("dashboard");
    expect(result[2].rank).toBe(3);
  });

  it("applies read-time decay — old items drop in rank", () => {
    const t0 = 1_000_000_000_000;

    // Track "old-item" 10 times at t0
    vi.spyOn(Date, "now").mockReturnValue(t0);
    for (let i = 0; i < 10; i++) {
      morph.track("sidebar", "old-item");
    }

    // Track "new-item" 2 times, 60 days later
    const sixtyDaysLater = t0 + 60 * 86_400_000;
    vi.spyOn(Date, "now").mockReturnValue(sixtyDaysLater);
    morph.track("sidebar", "new-item");
    morph.track("sidebar", "new-item");

    // At read time (60 days later), old-item's score should have decayed significantly
    // old-item stored score ~10, decayed by e^(-60*0.05) ≈ 0.05 → ~0.5
    // new-item stored score ~2, decayed by e^(0) = 1 → ~2
    const result = morph.rank("sidebar");
    expect(result[0].id).toBe("new-item");
    expect(result[1].id).toBe("old-item");
  });

  it("only returns items from the requested group", () => {
    morph.track("sidebar", "dashboard");
    morph.track("commands", "search");
    morph.track("sidebar", "tasks");

    const result = morph.rank("sidebar");
    expect(result).toHaveLength(2);

    const ids = result.map((item) => item.id);
    expect(ids).toContain("dashboard");
    expect(ids).toContain("tasks");
    expect(ids).not.toContain("search");
  });

  it("includes isActive field based on threshold", () => {
    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    morph.track("sidebar", "active-item");

    // 90 days later — score should have decayed below default threshold (1.0)
    const ninetyDaysLater = t0 + 90 * 86_400_000;
    vi.spyOn(Date, "now").mockReturnValue(ninetyDaysLater);
    morph.track("sidebar", "fresh-item");

    const result = morph.rank("sidebar");
    const freshItem = result.find((item) => item.id === "fresh-item");
    const oldItem = result.find((item) => item.id === "active-item");

    expect(freshItem?.isActive).toBe(true);
    expect(oldItem?.isActive).toBe(false);
  });

  it("score field reflects the current decayed score, not the stored score", () => {
    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    morph.track("sidebar", "dashboard");

    // 7 days later
    const sevenDaysLater = t0 + 7 * 86_400_000;
    vi.spyOn(Date, "now").mockReturnValue(sevenDaysLater);

    const result = morph.rank("sidebar");

    // e^(-7 * 0.05) ≈ 0.70, stored score = 1, so decayed ≈ 0.70
    expect(result[0].score).toBeCloseTo(0.70, 1);
  });
});
