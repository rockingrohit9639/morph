import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Morph } from "../lib/morph";
import { MemoryStorage } from "./test-utils";

describe("morph.isActive()", () => {
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

  it("returns false for an item that was never tracked", () => {
    expect(morph.isActive("sidebar", "unknown")).toBe(false);
  });

  it("returns true immediately after tracking", () => {
    morph.track("sidebar", "dashboard");
    expect(morph.isActive("sidebar", "dashboard")).toBe(true);
  });

  it("returns true when item was used recently", () => {
    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    morph.track("sidebar", "dashboard");

    // 1 day later — score decays to ~0.95, still above threshold (1.0? no — score=1*0.95=0.95)
    // Actually with default threshold 1.0, a single track (score=1) decayed by 1 day = 0.95 < 1.0
    // Let's track a few times to get score above threshold after decay
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "dashboard");

    const oneDayLater = t0 + 86_400_000;
    vi.spyOn(Date, "now").mockReturnValue(oneDayLater);

    // score ~3, decayed by e^(-1*0.05) ≈ 0.95 → ~2.85, above threshold
    expect(morph.isActive("sidebar", "dashboard")).toBe(true);
  });

  it("returns false when item has not been used for a long time", () => {
    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    morph.track("sidebar", "dashboard");

    // 90 days later — score = 1 * e^(-90*0.05) ≈ 0.011, well below threshold
    const ninetyDaysLater = t0 + 90 * 86_400_000;
    vi.spyOn(Date, "now").mockReturnValue(ninetyDaysLater);

    expect(morph.isActive("sidebar", "dashboard")).toBe(false);
  });

  it("respects custom activeThreshold via group config", () => {
    morph.configure({
      groups: { sidebar: { activeThreshold: 5.0 } },
    });

    const t0 = 1_000_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);

    // 3 rapid tracks → score ~3
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "dashboard");

    // score ~3, threshold is 5 → not active
    expect(morph.isActive("sidebar", "dashboard")).toBe(false);

    // Track more to push above threshold
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "dashboard");
    morph.track("sidebar", "dashboard");

    // score ~6, threshold is 5 → active
    expect(morph.isActive("sidebar", "dashboard")).toBe(true);
  });

  it("is independent per group", () => {
    morph.track("sidebar", "dashboard");
    morph.track("commands", "dashboard");

    expect(morph.isActive("sidebar", "dashboard")).toBe(true);
    expect(morph.isActive("commands", "dashboard")).toBe(true);
    expect(morph.isActive("other", "dashboard")).toBe(false);
  });
});
