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
