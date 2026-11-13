import { describe, expect, it } from "vitest";
import { enterpriseInquirySchema } from "./enterprise-inquiry";

describe("enterprise inquiry validation", () => {
  it("normalizes valid contact details and allows an omitted company", () => {
    expect(enterpriseInquirySchema.parse({
      name: "  Alex Morgan  ",
      email: "  ALEX@EXAMPLE.COM ",
      company: "",
      message: "We need branded QR workflows for several teams.",
    })).toEqual({
      name: "Alex Morgan",
      email: "alex@example.com",
      company: null,
      message: "We need branded QR workflows for several teams.",
    });
  });

  it("rejects malformed or oversized inquiries", () => {
    expect(enterpriseInquirySchema.safeParse({
      name: "",
      email: "not-an-email",
      message: "short",
    }).success).toBe(false);
    expect(enterpriseInquirySchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      message: "x".repeat(5001),
    }).success).toBe(false);
  });
});
