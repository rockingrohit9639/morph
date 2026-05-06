import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Morph } from "../lib/morph";
import { getItem, MemoryStorage } from "./test-utils";

describe("morph.track()", () => {
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

  it("creates a new item on first track", () => {
    morph.track("sidebar", "dashboard");

    const item = getItem(storage, "sidebar", "dashboard");
    expect(item.score).toBe(1);
    expect(item.useCount).toBe(1);
    expect(item.lastUsed).toBeGreaterThan(0);
  });

  it("increments useCount on repeated tracks", () => {
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "dashboard");

    const item = getItem(storage, "sidebar", "dashboard");
    expect(item.useCount).toBe(3);
  });

  it("increases score on rapid repeated tracks", () => {
    morph.track("sidebar", "dashboard");
    const first = getItem(storage, "sidebar", "dashboard");

    morph.track("sidebar", "dashboard");
    const second = getItem(storage, "sidebar", "dashboard");

    morph.track("sidebar", "dashboard");
    const third = getItem(storage, "sidebar", "dashboard");

    expect(second.score).toBeGreaterThan(first.score);
    expect(third.score).toBeGreaterThan(second.score);
  });

  it("applies decay when time has passed between tracks", () => {
    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    morph.track("sidebar", "dashboard");

    // 30 days later — old score should decay significantly
    const thirtyDaysLater = t0 + 30 * 86_400_000;
    vi.spyOn(Date, "now").mockReturnValue(thirtyDaysLater);
    morph.track("sidebar", "dashboard");

    const item = getItem(storage, "sidebar", "dashboard");

    // e^(-30 * 0.05) ≈ 0.22, so score ≈ 1 * 0.22 + 1 = 1.22
    expect(item.score).toBeCloseTo(1.22, 1);
    expect(item.useCount).toBe(2);
  });

  it("barely decays score when tracked again the same day", () => {
    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    morph.track("sidebar", "dashboard");

    // 1 hour later
    const oneHourLater = t0 + 3_600_000;
    vi.spyOn(Date, "now").mockReturnValue(oneHourLater);
    morph.track("sidebar", "dashboard");

    const item = getItem(storage, "sidebar", "dashboard");

    // e^(-0.04 * 0.05) ≈ 0.998, so score ≈ 1 * 0.998 + 1 ≈ 2.0
    expect(item.score).toBeCloseTo(2.0, 1);
  });

  it("tracks different items in the same group independently", () => {
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "settings");

    const dashboard = getItem(storage, "sidebar", "dashboard");
    const settings = getItem(storage, "sidebar", "settings");

    expect(dashboard.useCount).toBe(2);
    expect(settings.useCount).toBe(1);
    expect(dashboard.score).toBeGreaterThan(settings.score);
  });

  it("tracks items in different groups independently", () => {
    morph.track("sidebar", "dashboard");
    morph.track("commands", "dashboard");

    const sidebarItem = getItem(storage, "sidebar", "dashboard");
    const commandItem = getItem(storage, "commands", "dashboard");

    expect(sidebarItem.useCount).toBe(1);
    expect(commandItem.useCount).toBe(1);
  });

  it("updates lastUsed timestamp on every track", () => {
    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    morph.track("sidebar", "dashboard");

    const t1 = t0 + 5_000;
    vi.spyOn(Date, "now").mockReturnValue(t1);
    morph.track("sidebar", "dashboard");

    const item = getItem(storage, "sidebar", "dashboard");
    expect(item.lastUsed).toBe(t1);
  });
});
