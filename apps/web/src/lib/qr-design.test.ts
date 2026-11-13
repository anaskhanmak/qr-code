import { describe, expect, it } from "vitest";
import { parseQRDesign } from "./qr-design";

describe("saved QR design validation", () => {
  it("accepts valid colors and bounded quiet-space margins", () => {
    expect(parseQRDesign({ foregroundColor: "#123456", backgroundColor: "#FFFFFF", margin: 4 })).toEqual({
      foregroundColor: "#123456",
      backgroundColor: "#FFFFFF",
      margin: 4,
    });
  });

  it("rejects malformed or out-of-range design values", () => {
    expect(parseQRDesign({ foregroundColor: "red", backgroundColor: "#ffffff", margin: 4 })).toBeNull();
    expect(parseQRDesign({ foregroundColor: "#123456", backgroundColor: "#ffffff", margin: 11 })).toBeNull();
    expect(parseQRDesign(null)).toBeNull();
  });
});
