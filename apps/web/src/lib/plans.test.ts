import { describe, expect, it } from "vitest";
import {
  canCreateDynamicCode,
  canUsePlanFeature,
  getDefaultCurrency,
  getPlanPrice,
  getPlanById,
  getPlanUsageStatus,
} from "./plans";

describe("subscription plans", () => {
  it("defines the expected product tiers and limits", () => {
    expect(getPlanById("free").limits.dynamicCodes).toBe(3);
    expect(getPlanById("pro").limits.customDomains).toBe(true);
    expect(getPlanById("enterprise").features).toContain("Custom SLA");
  });

  it("selects a sensible default currency by region", () => {
    expect(getDefaultCurrency("PK")).toBe("PKR");
    expect(getDefaultCurrency("DE")).toBe("USD");
  });

  it("enforces dynamic-code quotas and returns billing totals", () => {
    expect(canCreateDynamicCode("free", 2)).toBe(true);
    expect(canCreateDynamicCode("free", 3)).toBe(false);
    expect(getPlanPrice("starter", "USD", "monthly")).toBe(12);
  });

  it("exposes feature gating and usage pressure helpers", () => {
    expect(canUsePlanFeature("free", "customDomains")).toBe(false);
    expect(canUsePlanFeature("pro", "customDomains")).toBe(true);
    expect(getPlanUsageStatus("starter", 25).isAtLimit).toBe(true);
    expect(getPlanUsageStatus("free", 1).canAddMore).toBe(true);
  });
});
