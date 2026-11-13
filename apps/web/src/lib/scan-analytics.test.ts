import { describe, expect, it } from "vitest";
import { classifyScan, extractScanMetadata, hashIdentifier } from "./scan-analytics";

describe("scan analytics utilities", () => {
  it("hashes identifiers without retaining raw values", async () => {
    const value = "203.0.113.42";
    const hashed = await hashIdentifier(value, "test-secret");
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
    expect(hashed).not.toBe(value);
    expect(await hashIdentifier(value, "another-secret")).not.toBe(hashed);
  });

  it("classifies bots and preview fetches separately from human scans", () => {
    expect(classifyScan({ userAgent: "Googlebot/2.1" })).toBe("bot");
    expect(classifyScan({ userAgent: "facebookexternalhit/1.1" })).toBe("preview");
    expect(classifyScan({ userAgent: "Mozilla/5.0" })).toBe("human");
  });

  it("extracts privacy-safe metadata for scan events", async () => {
    const request = new Request("https://example.com/r/test", {
      headers: {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        referer: "https://www.linkedin.com/feed/",
        "x-forwarded-for": "203.0.113.42, 10.0.0.1",
        "accept-language": "en-US,en;q=0.9",
        "cf-ipcountry": "US",
        "cf-ipcity": "New York",
      },
    });

    const metadata = extractScanMetadata(request, "test-secret");
    expect(metadata.classification).toBe("preview");
    expect(metadata.deviceType).toBe("mobile");
    expect(metadata.os).toBe("iOS");
    expect(metadata).not.toHaveProperty("ip");
    expect(await metadata.hashedIp).toMatch(/^[a-f0-9]{64}$/);
    expect(await metadata.hashedIp).not.toBe("203.0.113.42");
  });
});
