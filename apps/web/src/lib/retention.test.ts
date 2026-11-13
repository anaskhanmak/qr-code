import { describe, expect, it } from "vitest";
import { getRetentionCutoff, parseRetentionDays } from "./retention";

describe("analytics retention settings", () => {
  it("uses a default and accepts bounded day counts", () => {
    expect(parseRetentionDays(undefined)).toBe(365);
    expect(parseRetentionDays("30")).toBe(30);
    expect(parseRetentionDays("3650")).toBe(3650);
  });

  it("rejects invalid and unsafe retention intervals", () => {
    expect(parseRetentionDays("1")).toBeNull();
    expect(parseRetentionDays("9999")).toBeNull();
    expect(parseRetentionDays("30.5")).toBeNull();
  });

  it("computes a precise cutoff", () => {
    const now = new Date("2026-11-13T00:00:00.000Z");
    expect(getRetentionCutoff(30, now).toISOString()).toBe("2026-10-14T00:00:00.000Z");
  });
});
