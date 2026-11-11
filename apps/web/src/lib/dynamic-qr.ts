import { z } from "zod";

function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

const httpUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(isHttpUrl, "Use a website address that begins with http:// or https://.");

const linkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: httpUrl,
});

export const dynamicQRTypes = [
  "url",
  "business_card",
  "pdf",
  "multiple_links",
] as const;

export type DynamicQRType = (typeof dynamicQRTypes)[number];

export const dynamicContentSchemas = {
  url: z.object({
    type: z.literal("url"),
    title: z.string().trim().min(1).max(120),
    url: httpUrl,
  }),
  business_card: z.object({
    type: z.literal("business_card"),
    title: z.string().trim().min(1).max(120),
    fullName: z.string().trim().min(1).max(120),
    role: z.string().trim().max(120).optional().default(""),
    organization: z.string().trim().max(120).optional().default(""),
    phone: z.string().trim().max(40).optional().default(""),
    email: z.string().trim().email().max(320).optional().or(z.literal("")).default(""),
    website: z.union([httpUrl, z.literal("")]).optional().default(""),
    bio: z.string().trim().max(500).optional().default(""),
  }),
  pdf: z.object({
    type: z.literal("pdf"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    pdfUrl: httpUrl,
  }),
  multiple_links: z.object({
    type: z.literal("multiple_links"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(300).optional().default(""),
    links: z.array(linkSchema).min(1).max(12),
  }),
} as const;

export type DynamicQRContent =
  | z.output<typeof dynamicContentSchemas.url>
  | z.output<typeof dynamicContentSchemas.business_card>
  | z.output<typeof dynamicContentSchemas.pdf>
  | z.output<typeof dynamicContentSchemas.multiple_links>;

export function parseDynamicContent(value: unknown): DynamicQRContent | null {
  if (!value || typeof value !== "object" || !("type" in value)) return null;
  const type = (value as { type?: unknown }).type;
  if (typeof type !== "string" || !dynamicQRTypes.includes(type as DynamicQRType)) return null;
  const parsed = dynamicContentSchemas[type as DynamicQRType].safeParse(value);
  return parsed.success ? (parsed.data as DynamicQRContent) : null;
}

export function generateSlug(): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function getShortUrl(slug: string): string {
  const appBase = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (process.env.NEXT_PUBLIC_SHORT_URL) {
    const shortBase = process.env.NEXT_PUBLIC_SHORT_URL.endsWith("/")
      ? process.env.NEXT_PUBLIC_SHORT_URL
      : `${process.env.NEXT_PUBLIC_SHORT_URL}/`;
    return new URL(slug, shortBase).toString();
  }
  return new URL(`/r/${slug}`, appBase).toString();
}

export function resolveQrDestination(content: DynamicQRContent): string | null {
  switch (content.type) {
    case "url":
      return content.url;
    case "pdf":
      return content.pdfUrl;
    default:
      return null;
  }
}
