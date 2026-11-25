import { describe, expect, it } from "vitest";
import { parseQrApiUpdate } from "./api-qr-update";

describe("parseQrApiUpdate", () => {
  it("accepts supported partial updates", () => {
    expect(parseQrApiUpdate({ name: "Spring campaign" })).toEqual({ name: "Spring campaign" });
    expect(parseQrApiUpdate({
      content: { type: "url", title: "Main site", url: "https://example.com" },
      design: { foregroundColor: "#173a32", backgroundColor: "#ffffff", margin: 2 },
    })).toEqual({
      content: { type: "url", title: "Main site", url: "https://example.com" },
      design: { foregroundColor: "#173a32", backgroundColor: "#ffffff", margin: 2 },
    });
  });

  it("rejects empty, malformed, and unknown-field updates", () => {
    expect(parseQrApiUpdate({})).toBeNull();
    expect(parseQrApiUpdate({ content: { type: "url", url: "javascript:alert(1)" } })).toBeNull();
    expect(parseQrApiUpdate({ name: "Valid", extra: true })).toBeNull();
  });
});
