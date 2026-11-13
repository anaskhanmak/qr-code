export const apiKeyScopes = [
  "qr:read",
  "qr:write",
  "analytics:read",
  "webhooks:write",
  "workspace:read",
  "workspace:write",
] as const;

export type ApiKeyScope = (typeof apiKeyScopes)[number];

export const webhookEventNames = [
  "qr.created",
  "qr.updated",
  "qr.deleted",
  "scan.logged",
  "lead.received",
  "billing.updated",
] as const;

export type WebhookEventName = (typeof webhookEventNames)[number];

export type DomainVerificationState = "PENDING" | "VERIFIED" | "FAILED";

export function normalizeCustomDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

export function isValidCustomDomain(value: string): boolean {
  const normalized = normalizeCustomDomain(value);

  if (!normalized || normalized.includes("/")) {
    return false;
  }

  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized);
}

export function canIssueApiKey(
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER",
  scope: ApiKeyScope,
): boolean {
  if (role === "OWNER" || role === "ADMIN") {
    return true;
  }

  if (role === "EDITOR") {
    return ["qr:read", "qr:write", "analytics:read", "workspace:read"].includes(scope);
  }

  return scope === "workspace:read" && role === "VIEWER";
}

export function validateWebhookUrl(url: string): { ok: boolean; message?: string } {
  if (!url?.trim()) {
    return { ok: false, message: "Webhook URL is required." };
  }

  try {
    const parsed = new URL(url);

    if (!["https:", "http:"].includes(parsed.protocol)) {
      return { ok: false, message: "Webhook URL must use http or https." };
    }

    if (!parsed.hostname) {
      return { ok: false, message: "Webhook URL must include a host." };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Webhook URL is not valid." };
  }
}

export function createApiKeyPreview(prefix: string, value: string): string {
  const sanitizedPrefix = prefix.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]+/g, "");
  const safePrefix = sanitizedPrefix || "lk";
  const preview = value.slice(0, 12);
  return `${safePrefix}_${preview}`;
}

export function getDefaultDomainStatus(): DomainVerificationState {
  return "PENDING";
}

export function getRecommendedRetentionDays(): number {
  return 180;
}

export function getSignedWebhookHeader(secret: string, payload: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${secret}:${payload}`);
  let hash = 0;

  for (let i = 0; i < data.length; i += 1) {
    hash = (hash * 31 + data[i]) >>> 0;
  }

  return `sha256-${hash.toString(16).padStart(8, "0")}`;
}
