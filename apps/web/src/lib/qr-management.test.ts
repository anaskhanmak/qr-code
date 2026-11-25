import { describe, expect, it } from "vitest";
import { parseBulkQrIds } from "./qr-management";

describe("parseBulkQrIds", () => {
  it("accepts a bounded list of valid IDs", () => {
    expect(parseBulkQrIds(["qr_1", "qr_2"])).toEqual({ ids: ["qr_1", "qr_2"] });
  });

  it("rejects empty and over-limit selections", () => {
    expect(parseBulkQrIds([])).toHaveProperty("error");
    expect(parseBulkQrIds(Array.from({ length: 51 }, (_, index) => `qr_${index}`))).toHaveProperty("error");
  });

  it("rejects malformed or repeated IDs", () => {
    expect(parseBulkQrIds(["valid", "../invalid"])).toHaveProperty("error");
    expect(parseBulkQrIds(["same", "same"])).toHaveProperty("error");
  });
});
