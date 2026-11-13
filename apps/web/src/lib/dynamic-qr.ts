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

const emptyString = z.literal("");
const blankableHttpUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? "" : trimmed;
  },
  z.union([httpUrl, emptyString]),
);

const blankableEmail = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    return value.trim();
  },
  z.union([z.string().email().max(320), emptyString]),
);

const linkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: httpUrl,
});

export const dynamicQRTypes = [
  "url",
  "business_card",
  "pdf",
  "multiple_links",
  "social",
  "coupon",
  "product",
  "video",
  "image_gallery",
  "lead_form",
  "feedback",
  "event",
  "app_store",
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
    email: blankableEmail.optional().default(""),
    website: blankableHttpUrl.optional().default(""),
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
  social: z.object({
    type: z.literal("social"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(300).optional().default(""),
    platform: z.enum(["instagram", "x", "linkedin", "youtube", "tiktok", "facebook", "custom"]),
    url: httpUrl,
  }),
  coupon: z.object({
    type: z.literal("coupon"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(300).optional().default(""),
    offerCode: z.string().trim().min(1).max(80),
    url: httpUrl,
    expiryDate: z.string().trim().max(32).optional().default(""),
  }),
  product: z.object({
    type: z.literal("product"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    price: z.string().trim().max(80).optional().default(""),
    url: httpUrl,
    badge: z.string().trim().max(60).optional().default(""),
  }),
  video: z.object({
    type: z.literal("video"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    videoUrl: httpUrl,
    cta: z.string().trim().max(80).optional().default("Watch now"),
  }),
  image_gallery: z.object({
    type: z.literal("image_gallery"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    images: z.array(httpUrl).min(1).max(6),
    url: httpUrl.optional().default("https://example.com"),
  }),
  lead_form: z.object({
    type: z.literal("lead_form"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    mode: z.enum(["external", "capture"]).optional().default("external"),
    formUrl: blankableHttpUrl.optional().default(""),
    buttonLabel: z.string().trim().min(1).max(80).optional().default("Get started"),
  }).superRefine((value, context) => {
    if (value.mode === "external" && !value.formUrl) {
      context.addIssue({ code: "custom", path: ["formUrl"], message: "Add the external form URL." });
    }
  }),
  feedback: z.object({
    type: z.literal("feedback"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    prompt: z.string().trim().min(1).max(180).default("How was your experience?"),
    thankYouMessage: z.string().trim().max(180).optional().default("Thanks for sharing your feedback."),
  }),
  event: z.object({
    type: z.literal("event"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    location: z.string().trim().max(240).optional().default(""),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    eventUrl: blankableHttpUrl.optional().default(""),
  }).refine((value) => new Date(value.endAt) > new Date(value.startAt), {
    path: ["endAt"],
    message: "The event end must be after its start.",
  }),
  app_store: z.object({
    type: z.literal("app_store"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    iosUrl: httpUrl,
    androidUrl: blankableHttpUrl.optional().default(""),
    fallbackUrl: httpUrl,
  }),
} as const;

export type DynamicQRContent =
  | z.output<typeof dynamicContentSchemas.url>
  | z.output<typeof dynamicContentSchemas.business_card>
  | z.output<typeof dynamicContentSchemas.pdf>
  | z.output<typeof dynamicContentSchemas.multiple_links>
  | z.output<typeof dynamicContentSchemas.social>
  | z.output<typeof dynamicContentSchemas.coupon>
  | z.output<typeof dynamicContentSchemas.product>
  | z.output<typeof dynamicContentSchemas.video>
  | z.output<typeof dynamicContentSchemas.image_gallery>
  | z.output<typeof dynamicContentSchemas.lead_form>
  | z.output<typeof dynamicContentSchemas.feedback>
  | z.output<typeof dynamicContentSchemas.event>
  | z.output<typeof dynamicContentSchemas.app_store>;

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
    case "social":
      return content.url;
    case "coupon":
      return content.url;
    case "product":
      return content.url;
    case "video":
      return content.videoUrl;
    case "lead_form":
      return content.formUrl;
    case "app_store":
      return content.fallbackUrl;
    default:
      return null;
  }
}
