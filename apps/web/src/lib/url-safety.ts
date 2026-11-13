export function isSafeRedirectTarget(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    return true;
  } catch {
    return false;
  }
}

export type SecurityHeaderOptions = {
  isHttps?: boolean;
  isProduction?: boolean;
  nonce?: string;
};

export function getSecurityHeaders(options: SecurityHeaderOptions = {}): Record<string, string> {
  const { isHttps = process.env.NODE_ENV === "production", isProduction = process.env.NODE_ENV === "production", nonce } = options;
  const scriptSources = ["'self'", nonce ? `'nonce-${nonce}'` : "'unsafe-inline'", ...(isProduction ? [] : ["'unsafe-eval'"])];

  return {
    "Content-Security-Policy": `default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src ${scriptSources.join(" ")}; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store",
    ...(isHttps || isProduction ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } : {}),
  };
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function createRateLimiter(options: { windowMs?: number; maxRequests?: number } = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 10;
  const buckets = new Map<string, number[]>();
  let lastCleanup = Date.now();

  return (identifier: string): RateLimitResult => {
    const now = Date.now();
    if (now - lastCleanup >= windowMs) {
      for (const [key, timestamps] of buckets) {
        const recentTimestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);
        if (recentTimestamps.length) buckets.set(key, recentTimestamps);
        else buckets.delete(key);
      }
      lastCleanup = now;
    }
    const requests = buckets.get(identifier) ?? [];
    const recent = requests.filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= maxRequests) {
      const retryAfterMs = Math.max(0, windowMs - (now - recent[0]));
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    recent.push(now);
    buckets.set(identifier, recent);
    return { allowed: true, remaining: maxRequests - recent.length, retryAfterMs: 0 };
  };
}

export function isTrustedOrigin(origin: string, allowlist: string[] = []): boolean {
  if (!origin) return false;

  const normalizedOrigin = origin.trim().toLowerCase();
  if (allowlist.length === 0) {
    return false;
  }

  return allowlist.some((allowed) => normalizedOrigin === allowed.trim().toLowerCase());
}
