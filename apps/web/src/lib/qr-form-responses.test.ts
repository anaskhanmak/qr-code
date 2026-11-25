import { describe, expect, it } from "vitest";
import { getPublicResponseKind } from "./qr-form-responses";
import type { DynamicQRContent } from "./dynamic-qr";

describe("getPublicResponseKind", () => {
  it("allows contact exchange on business cards and distinguishes captured forms", () => {
    const businessCard: DynamicQRContent = {
      type: "business_card",
      title: "Contact",
      fullName: "A. Person",
      role: "",
      organization: "",
      phone: "",
      email: "",
      website: "",
      bio: "",
    };
    const capturedLead: DynamicQRContent = {
      type: "lead_form",
      title: "Contact us",
      description: "",
      mode: "capture",
      formUrl: "",
      buttonLabel: "Send",
    };
    const externalLead: DynamicQRContent = {
      type: "lead_form",
      title: "Contact us",
      description: "",
      mode: "external",
      formUrl: "https://example.com/contact",
      buttonLabel: "Send",
    };

    expect(getPublicResponseKind(businessCard)).toBe("CONTACT");
    expect(getPublicResponseKind(capturedLead)).toBe("LEAD");
    expect(getPublicResponseKind(externalLead)).toBeNull();
  });
});
