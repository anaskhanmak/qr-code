import { describe, expect, it } from "vitest";
import {
  buildCmsEntry,
  createModerationCase,
  shouldBlockDestination,
  summarizePlatformMetrics,
} from "./admin-platform";

describe("admin platform controls", () => {
  it("flags dangerous destination protocols before moderation approval", () => {
    expect(shouldBlockDestination("javascript:alert(1)")).toBe(true);
    expect(shouldBlockDestination("https://example.com/checkout")).toBe(false);
    expect(shouldBlockDestination("data:text/html,hello")).toBe(true);
  });

  it("builds moderation records with risk scoring for review queues", () => {
    const caseItem = createModerationCase({
      qrCodeId: "qr-101",
      workspaceId: "ws-4",
      reason: "Suspicious redirect behavior",
      riskScore: 95,
    });

    expect(caseItem.status).toBe("PENDING");
    expect(caseItem.riskScore).toBe(95);
    expect(caseItem.reason).toContain("Suspicious");
  });

  it("provides dashboard metrics and CMS entry snapshots for admin pages", () => {
    const dashboard = [
      { label: "Active workspaces", value: 24, change: 3 },
      { label: "Dynamic QR codes", value: 68, change: 7 },
    ];
    const summary = summarizePlatformMetrics(dashboard);
    const cmsEntry = buildCmsEntry({
      kind: "faq",
      title: "How long does moderation take?",
      body: "Most reports are reviewed within 24 hours.",
      isPublished: true,
    });

    expect(summary).toEqual({ total: 92, changes: 10 });
    expect(cmsEntry.kind).toBe("faq");
    expect(cmsEntry.title).toContain("How long");
  });
});
