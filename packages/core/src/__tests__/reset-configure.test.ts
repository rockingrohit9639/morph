import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Morph } from "../lib/morph";
import { getItem, MemoryStorage } from "./test-utils";

describe("morph.reset()", () => {
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

  it("clears all items in a group", () => {
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "tasks");
    morph.track("sidebar", "settings");

    morph.reset("sidebar");

    expect(morph.rank("sidebar")).toEqual([]);
  });

  it("does not affect other groups", () => {
    morph.track("sidebar", "dashboard");
    morph.track("commands", "search");
    morph.track("commands", "open");

    morph.reset("sidebar");

    expect(morph.rank("sidebar")).toEqual([]);
    expect(morph.rank("commands")).toHaveLength(2);
  });

  it("does nothing for a group that has no data", () => {
    morph.track("sidebar", "dashboard");

    morph.reset("empty-group");

    // Should not throw and sidebar should be unaffected
    expect(morph.rank("sidebar")).toHaveLength(1);
  });

  it("allows tracking again after reset", () => {
    morph.track("sidebar", "dashboard");
    morph.reset("sidebar");
    morph.track("sidebar", "dashboard");

    const item = getItem(storage, "sidebar", "dashboard");
    expect(item.useCount).toBe(1);
    expect(item.score).toBe(1);
  });
});

describe("morph.configure()", () => {
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

  it("swaps storage backend", () => {
    morph.track("sidebar", "dashboard");

    const newStorage = new MemoryStorage();
    morph.configure({ storage: newStorage });

    // Old data is not in new storage
    expect(morph.rank("sidebar")).toEqual([]);

    // New tracks go to new storage
    morph.track("sidebar", "tasks");
    const item = getItem(newStorage, "sidebar", "tasks");
    expect(item.useCount).toBe(1);
  });

  it("sets default decay constant for all groups", () => {
    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);

    // High decay constant = faster fade
    morph.configure({ defaults: { decayConstant: 0.5 } });
    morph.track("sidebar", "dashboard");

    // 7 days later with decay=0.5: e^(-7*0.5) ≈ 0.03
    const sevenDaysLater = t0 + 7 * 86_400_000;
    vi.spyOn(Date, "now").mockReturnValue(sevenDaysLater);

    const result = morph.rank("sidebar");
    expect(result[0].score).toBeCloseTo(0.03, 1);
  });

  it("allows per-group config that overrides defaults", () => {
    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);

    morph.configure({
      defaults: { decayConstant: 0.5 },
      groups: { sidebar: { decayConstant: 0.01 } },
    });

    morph.track("sidebar", "dashboard");
    morph.track("commands", "search");

    // 7 days later
    const sevenDaysLater = t0 + 7 * 86_400_000;
    vi.spyOn(Date, "now").mockReturnValue(sevenDaysLater);

    const sidebarResult = morph.rank("sidebar");
    const commandsResult = morph.rank("commands");

    // sidebar uses decayConstant=0.01: e^(-7*0.01) ≈ 0.93
    expect(sidebarResult[0].score).toBeCloseTo(0.93, 1);

    // commands uses default decayConstant=0.5: e^(-7*0.5) ≈ 0.03
    expect(commandsResult[0].score).toBeCloseTo(0.03, 1);
  });

  it("merges config incrementally (does not overwrite unset fields)", () => {
    morph.configure({ defaults: { decayConstant: 0.1 } });
    morph.configure({ defaults: { activeThreshold: 2.0 } });

    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    morph.track("sidebar", "dashboard");

    // decayConstant should still be 0.1 (not reset to default 0.05)
    const sevenDaysLater = t0 + 7 * 86_400_000;
    vi.spyOn(Date, "now").mockReturnValue(sevenDaysLater);

    const result = morph.rank("sidebar");
    // e^(-7*0.1) ≈ 0.497
    expect(result[0].score).toBeCloseTo(0.497, 1);

    // activeThreshold should be 2.0 — single track (score < 2) is not active
    expect(result[0].isActive).toBe(false);
  });
});
