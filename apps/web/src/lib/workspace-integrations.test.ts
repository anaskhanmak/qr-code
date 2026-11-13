import { describe, expect, it } from "vitest";
import {
  apiKeyScopes,
  canIssueApiKey,
  createApiKeyPreview,
  getDefaultDomainStatus,
  getRecommendedRetentionDays,
  getSignedWebhookHeader,
  isValidCustomDomain,
  normalizeCustomDomain,
  validateWebhookUrl,
} from "./workspace-integrations";

describe("workspace integrations", () => {
  it("normalizes custom domains consistently", () => {
    expect(normalizeCustomDomain("https://app.example.com/ ")).toBe("app.example.com");
    expect(normalizeCustomDomain("APP.EXAMPLE.COM")).toBe("app.example.com");
  });

  it("accepts realistic custom domains and rejects invalid values", () => {
    expect(isValidCustomDomain("app.example.com")).toBe(true);
    expect(isValidCustomDomain("https://app.example.com")).toBe(true);
    expect(isValidCustomDomain("example")).toBe(false);
    expect(isValidCustomDomain("ftp://example.com")).toBe(false);
  });

  it("restricts API key issuance by workspace role", () => {
    expect(canIssueApiKey("OWNER", "webhooks:write")).toBe(true);
    expect(canIssueApiKey("ADMIN", "analytics:read")).toBe(true);
    expect(canIssueApiKey("EDITOR", "analytics:read")).toBe(true);
    expect(canIssueApiKey("EDITOR", "workspace:write")).toBe(false);
    expect(canIssueApiKey("VIEWER", "workspace:read")).toBe(true);
    expect(canIssueApiKey("VIEWER", "qr:write")).toBe(false);
  });

  it("validates webhook URLs and signatures", () => {
    expect(validateWebhookUrl("https://example.com/webhooks/loopmark")).toMatchObject({ ok: true });
    expect(validateWebhookUrl("ftp://example.com/webhooks")).toMatchObject({ ok: false });
    expect(getSignedWebhookHeader("secret", "payload")).toContain("sha256-");
  });

  it("exposes the supported API key scope and retention defaults", () => {
    expect(apiKeyScopes).toContain("webhooks:write");
    expect(createApiKeyPreview("loopmark", "abc1234567890")).toMatch(/^loopmark_/);
    expect(getDefaultDomainStatus()).toBe("PENDING");
    expect(getRecommendedRetentionDays()).toBeGreaterThan(0);
  });
});
