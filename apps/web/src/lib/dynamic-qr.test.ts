import { describe, expect, it } from "vitest";
import {
  dynamicContentSchemas,
  generateSlug,
  parseDynamicContent,
  resolveQrDestination,
} from "./dynamic-qr";
import { safeReturnTo } from "./return-to";

describe("dynamic QR content", () => {
  it("accepts only safe web destinations for redirect and PDF codes", () => {
    expect(dynamicContentSchemas.url.safeParse({
      type: "url",
      title: "My page",
      url: "https://example.com",
    }).success).toBe(true);
    expect(dynamicContentSchemas.url.safeParse({
      type: "url",
      title: "Unsafe",
      url: "javascript:alert(1)",
    }).success).toBe(false);
    expect(dynamicContentSchemas.url.safeParse({
      type: "url",
      title: "Malformed",
      url: "https://",
    }).success).toBe(false);
    expect(dynamicContentSchemas.pdf.safeParse({
      type: "pdf",
      title: "Menu",
      pdfUrl: "https://cdn.example.com/menu.pdf",
    }).success).toBe(true);
    expect(dynamicContentSchemas.product.safeParse({
      type: "product",
      title: "Soft shell jacket",
      description: "New season drop",
      price: "$79",
      url: "https://shop.example.com/products/jacket",
      badge: "New",
    }).success).toBe(true);
    expect(dynamicContentSchemas.video.safeParse({
      type: "video",
      title: "Product tour",
      videoUrl: "https://example.com/video",
      cta: "Watch demo",
    }).success).toBe(true);
    expect(dynamicContentSchemas.image_gallery.safeParse({
      type: "image_gallery",
      title: "Gallery",
      images: ["https://images.example.com/1.jpg", "https://images.example.com/2.jpg"],
      url: "https://example.com/gallery",
    }).success).toBe(true);
    expect(dynamicContentSchemas.lead_form.safeParse({
      type: "lead_form",
      title: "Book a demo",
      formUrl: "https://example.com/demo",
      buttonLabel: "Book now",
    }).success).toBe(true);
    expect(dynamicContentSchemas.lead_form.safeParse({
      type: "lead_form",
      title: "Contact sales",
      mode: "capture",
      formUrl: "",
    }).success).toBe(true);
    expect(dynamicContentSchemas.lead_form.safeParse({
      type: "lead_form",
      title: "Contact sales",
      mode: "external",
      formUrl: "",
    }).success).toBe(false);
    expect(dynamicContentSchemas.feedback.safeParse({
      type: "feedback",
      title: "Tell us what you think",
      prompt: "How was your visit?",
    }).success).toBe(true);
    expect(dynamicContentSchemas.event.safeParse({
      type: "event",
      title: "Product launch",
      startAt: "2026-12-01T10:00:00.000Z",
      endAt: "2026-12-01T11:00:00.000Z",
    }).success).toBe(true);
    expect(dynamicContentSchemas.event.safeParse({
      type: "event",
      title: "Invalid event",
      startAt: "2026-12-01T11:00:00.000Z",
      endAt: "2026-12-01T10:00:00.000Z",
    }).success).toBe(false);
    expect(dynamicContentSchemas.app_store.safeParse({
      type: "app_store",
      title: "Our app",
      iosUrl: "https://apps.apple.com/app/example",
      androidUrl: "",
      fallbackUrl: "https://example.com/app",
    }).success).toBe(true);
    expect(dynamicContentSchemas.business_card.safeParse({
      type: "business_card",
      title: "Contact",
      fullName: "Alex Morgan",
      email: "   ",
      website: "   ",
    }).success).toBe(true);
  });

  it("validates link pages and resolves redirect destinations", () => {
    const content = parseDynamicContent({
      type: "multiple_links",
      title: "Around the web",
      links: [{ label: "Website", url: "https://example.com" }],
    });
    expect(content?.type).toBe("multiple_links");
    expect(resolveQrDestination(content!)).toBeNull();
    expect(dynamicContentSchemas.multiple_links.safeParse({
      type: "multiple_links",
      title: "No links",
      links: [],
    }).success).toBe(false);
  });

  it("creates unguessable short slugs", () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(generateSlug()).not.toBe(slug);
  });

  it("allows only known local post-auth destinations", () => {
    expect(safeReturnTo("/dynamic-qr-codes")).toBe("/dynamic-qr-codes");
    expect(safeReturnTo("//attacker.example")).toBe("/dashboard");
    expect(safeReturnTo("https://attacker.example")).toBe("/dashboard");
  });
});
