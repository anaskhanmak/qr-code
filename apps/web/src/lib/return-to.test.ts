import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./return-to";

describe("safeReturnTo", () => {
  it("preserves well-formed workspace invitation routes", () => {
    const token = "A".repeat(43);
    expect(safeReturnTo(`/invite?token=${token}`)).toBe(`/invite?token=${token}`);
  });

  it("does not allow arbitrary invitation return destinations", () => {
    expect(safeReturnTo("/invite?token=short")).toBe("/dashboard");
    expect(safeReturnTo("/invite?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&next=https://evil.example")).toBe("/dashboard");
    expect(safeReturnTo("https://evil.example")).toBe("/dashboard");
  });
});
