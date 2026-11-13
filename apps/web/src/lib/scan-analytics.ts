import { createHmac } from "node:crypto";
import { db } from "@loopmark/db";

export type ScanClassification = "human" | "bot" | "preview";

const botPatterns = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /bingpreview/i,
  /facebookexternalhit/i,
  /duckduckbot/i,
  /headless/i,
  /preview/i,
];

const previewPatterns = [/linkedinbot/i, /facebookexternalhit/i, /twitterbot/i, /whatsapp/i];

export function hashIdentifier(value: string, key: string): string {
  const normalized = value.trim();
  if (!normalized) return "empty";

  return createHmac("sha256", key).update(normalized).digest("hex");
}

function getScanHashKey(): string {
  const key = process.env.SCAN_HASH_SECRET ?? (
    process.env.NODE_ENV === "production" ? undefined : process.env.AUTH_SECRET
  );
  if (!key) throw new Error("SCAN_HASH_SECRET is required to hash scan identifiers.");
  return key;
}

export function classifyScan(input: {
  userAgent?: string | null;
  referrer?: string | null;
  isPreviewFetch?: boolean;
}): ScanClassification {
  const userAgent = input.userAgent ?? "";
  const referrer = input.referrer ?? "";

  if (input.isPreviewFetch) return "preview";
  if (previewPatterns.some((pattern) => pattern.test(userAgent)) || referenceLooksLikePreview(referrer)) {
    return "preview";
  }
  if (botPatterns.some((pattern) => pattern.test(userAgent))) {
    return "bot";
  }
  return "human";
}

export function extractScanMetadata(request: Request, hashKey = getScanHashKey()) {
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");
  const language = request.headers.get("accept-language")?.split(",")[0]?.trim() || null;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = (forwardedFor?.split(",")[0] ?? request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? "").trim();
  const country = request.headers.get("cf-ipcountry") || null;
  const city = request.headers.get("cf-ipcity") || null;
  const classification = classifyScan({ userAgent, referrer });
  const browserInfo = parseBrowserInfo(userAgent);

  return {
    userAgent,
    referrer,
    language,
    country,
    city,
    classification,
    hashedIp: ip ? hashIdentifier(ip, hashKey) : "empty",
    ...browserInfo,
  };
}

export async function recordQrScan(input: {
  qrCodeId: string;
  workspaceId: string;
  request: Request;
}) {
  const metadata = extractScanMetadata(input.request);
  const hashedIp = metadata.hashedIp;
  const uniqueSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const isUnique = metadata.classification === "human" && hashedIp !== "empty"
    ? !(await db.qRCodeScan.findFirst({
        where: {
          qrCodeId: input.qrCodeId,
          hashedIp,
          classification: "HUMAN",
          createdAt: { gte: uniqueSince },
        },
        select: { id: true },
      }))
    : false;

  return db.qRCodeScan.create({
    data: {
      qrCodeId: input.qrCodeId,
      workspaceId: input.workspaceId,
      classification: metadata.classification === "human"
        ? "HUMAN"
        : metadata.classification === "bot"
          ? "BOT"
          : "PREVIEW",
      hashedIp,
      country: metadata.country,
      city: metadata.city,
      userAgent: metadata.userAgent,
      referrer: metadata.referrer,
      language: metadata.language,
      deviceType: metadata.deviceType,
      browser: metadata.browser,
      os: metadata.os,
      isUnique,
    },
  });
}

export async function getQrScanSummary(qrCodeId: string, since?: Date) {
  const where = { qrCodeId, ...(since ? { createdAt: { gte: since } } : {}) };
  const [classificationCounts, uniqueCount, distinctVisitors] = await Promise.all([
    db.qRCodeScan.groupBy({
      by: ["classification"],
      where,
      _count: { _all: true },
    }),
    db.qRCodeScan.count({ where: { ...where, classification: "HUMAN", isUnique: true } }),
    db.qRCodeScan.findMany({
      where: { ...where, classification: "HUMAN", hashedIp: { not: null, notIn: ["empty"] } },
      distinct: ["hashedIp"],
      select: { hashedIp: true },
    }),
  ]);
  const byClassification = { human: 0, bot: 0, preview: 0 };
  let total = 0;
  for (const item of classificationCounts) {
    total += item._count._all;
    if (item.classification === "HUMAN") byClassification.human = item._count._all;
    if (item.classification === "BOT") byClassification.bot = item._count._all;
    if (item.classification === "PREVIEW") byClassification.preview = item._count._all;
  }

  return {
    total,
    unique: uniqueCount > 0 ? uniqueCount : distinctVisitors.length,
    byClassification,
  };
}

export function getAnalyticsSince(days: number, now = new Date()): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function parseAnalyticsDays(value: string | null, fallback = 30): number | null {
  if (value === null) return fallback;
  if (!/^\d{1,3}$/.test(value)) return null;
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 && days <= 365 ? days : null;
}

export function toSafeCsvCell(value: string | number | Date | null): string {
  let text = value instanceof Date
    ? value.toISOString()
    : value === null
      ? ""
      : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function parseBrowserInfo(userAgent: string | null) {
  const value = userAgent ?? "";
  const normalized = value.toLowerCase();

  return {
    deviceType: /iphone|ipad|ipod|android/.test(normalized)
      ? "mobile"
      : /tablet/.test(normalized)
        ? "tablet"
        : /windows|macintosh|linux/.test(normalized)
          ? "desktop"
          : "unknown",
    browser: /edg|edge/.test(normalized)
      ? "Edge"
      : /opr|opera/.test(normalized)
        ? "Opera"
        : /firefox/.test(normalized)
          ? "Firefox"
          : /chrome/.test(normalized)
            ? "Chrome"
            : /safari/.test(normalized)
              ? "Safari"
              : "Unknown",
    os: /iphone|ipad|ipod/.test(normalized)
      ? "iOS"
      : /android/.test(normalized)
        ? "Android"
        : /windows/.test(normalized)
          ? "Windows"
          : /macintosh/.test(normalized)
            ? "macOS"
            : /linux/.test(normalized)
              ? "Linux"
              : "Unknown",
  };
}

function referenceLooksLikePreview(referrer: string): boolean {
  if (!referrer) return false;
  try {
    const host = new URL(referrer).host.toLowerCase();
    return host.includes("linkedin.com") || host.includes("facebook.com") || host.includes("twitter.com");
  } catch {
    return false;
  }
}
