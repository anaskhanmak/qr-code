import { describe, expect, it } from "vitest";
import { parseAnalyticsDays, toSafeCsvCell } from "./scan-analytics";

describe("analytics export helpers", () => {
  it("accepts only bounded integer day ranges", () => {
    expect(parseAnalyticsDays(null)).toBe(30);
    expect(parseAnalyticsDays("365")).toBe(365);
    expect(parseAnalyticsDays("0")).toBeNull();
    expect(parseAnalyticsDays("366")).toBeNull();
    expect(parseAnalyticsDays("1.5")).toBeNull();
    expect(parseAnalyticsDays("1&x=2")).toBeNull();
  });

  it("quotes CSV values and neutralizes spreadsheet formulas", () => {
    expect(toSafeCsvCell('A "quote"')).toBe('"A ""quote"""');
    expect(toSafeCsvCell("=HYPERLINK(\"https://bad.example\")")).toBe("\"'=HYPERLINK(\"\"https://bad.example\"\")\"");
    expect(toSafeCsvCell(new Date("2026-01-02T03:04:05.000Z"))).toBe('"2026-01-02T03:04:05.000Z"');
  });
});
