import { describe, expect, it } from "vitest";
import { createRateLimiter, getSecurityHeaders, isSafeRedirectTarget, isTrustedOrigin } from "./url-safety";

describe("security hardening helpers", () => {
  it("blocks unsafe redirect targets and accepts secure HTTP(S) URLs", () => {
    expect(isSafeRedirectTarget("https://example.com")).toBe(true);
    expect(isSafeRedirectTarget("javascript:alert(1)")).toBe(false);
    expect(isSafeRedirectTarget("http://user:pass@example.com")).toBe(false);
  });

  it("returns a hardened header set for production routes", () => {
    const headers = getSecurityHeaders({ isHttps: true, isProduction: true, nonce: "test-nonce" });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=31536000");
    expect(headers["Content-Security-Policy"]).toContain("'nonce-test-nonce'");
    expect(headers["Content-Security-Policy"]).not.toContain("unsafe-eval");
  });

  it("rate limits repeated requests and checks trusted origins", () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 2 });
    expect(limiter("user-1").allowed).toBe(true);
    expect(limiter("user-1").allowed).toBe(true);
    expect(limiter("user-1").allowed).toBe(false);
    expect(isTrustedOrigin("https://app.example.com", ["https://app.example.com"])).toBe(true);
    expect(isTrustedOrigin("https://evil.example.com", ["https://app.example.com"])).toBe(false);
    expect(isTrustedOrigin("https://app.example.com")).toBe(false);
  });
});
