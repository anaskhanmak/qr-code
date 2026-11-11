interface Environment {
  SHORT_LINK_CACHE: KVNamespace;
  APP_ORIGIN: string;
  REDIRECT_REVALIDATION_SECRET?: string;
  CACHE_TTL_SECONDS?: string;
}

interface RedirectEntry {
  slug: string;
  status: "ACTIVE" | "PAUSED" | "EXPIRED";
  type: "url" | "business_card" | "pdf" | "multiple_links";
  destination: string | null;
}

const slugPattern = /^[A-Za-z0-9]{16}$/;
const unavailablePage =
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link unavailable · Loopmark</title><body style="font:16px/1.6 system-ui,sans-serif;background:#f7f8f2;color:#173a32;display:grid;min-height:90vh;place-items:center;margin:0"><main style="max-width:28rem;padding:2rem;text-align:center;background:white;border:1px solid #e3e9de;border-radius:1.5rem"><strong style="display:inline-grid;place-items:center;width:3rem;height:3rem;border-radius:1rem;background:#c5f277">L</strong><h1>This link is not available</h1><p>It may have expired, been paused, or the address may be incorrect.</p><small>Loopmark · A little link with a long life</small></main></body></html>';

export default {
  async fetch(
    request: Request,
    environment: Environment,
    context: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const invalidateMatch = /^\/__invalidate\/([A-Za-z0-9]{16})$/.exec(url.pathname);
    if (invalidateMatch) {
      if (request.method !== "POST") {
        return new Response("Method not allowed.", {
          status: 405,
          headers: { Allow: "POST" },
        });
      }
      const expectedSecret = environment.REDIRECT_REVALIDATION_SECRET;
      const providedSecret = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      if (!expectedSecret || !providedSecret || !constantTimeEqual(providedSecret, expectedSecret)) {
        return new Response("Unauthorized.", { status: 401 });
      }
      try {
        await environment.SHORT_LINK_CACHE.delete(invalidateMatch[1]);
        return new Response(null, { status: 204 });
      } catch (error) {
        console.error("Could not clear the short-link KV entry.", error);
        return new Response("Cache invalidation failed.", { status: 503 });
      }
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed.", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const slug = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!slugPattern.test(slug)) return unavailableResponse(404);

    let entry: RedirectEntry | null = null;
    try {
      entry = await environment.SHORT_LINK_CACHE.get<RedirectEntry>(slug, "json");
    } catch (error) {
      console.error("Short-link KV lookup failed; falling back to the app resolver.", error);
    }

    if (!entry) {
      let resolverResponse: Response;
      try {
        const appOrigin = new URL(environment.APP_ORIGIN);
        const resolverUrl = new URL(`/api/redirect/resolve/${slug}`, appOrigin);
        resolverResponse = await fetch(resolverUrl, {
          headers: { Accept: "application/json" },
          cf: { cacheTtl: 0, cacheEverything: false },
        });
      } catch (error) {
        console.error("Short-link resolver request failed.", error);
        return unavailableResponse(502);
      }

      if (resolverResponse.status === 404) return unavailableResponse(404);
      if (!resolverResponse.ok) {
        console.error("Short-link resolver returned an unexpected status.", resolverResponse.status);
        return unavailableResponse(502);
      }

      try {
        entry = await resolverResponse.json<RedirectEntry>();
      } catch (error) {
        console.error("Short-link resolver returned invalid JSON.", error);
        return unavailableResponse(502);
      }

      if (!isValidEntry(entry, slug)) return unavailableResponse(502);
      const ttl = Number(environment.CACHE_TTL_SECONDS ?? "30");
      if (Number.isInteger(ttl) && ttl > 0) {
        context.waitUntil(
          environment.SHORT_LINK_CACHE.put(slug, JSON.stringify(entry), {
            expirationTtl: Math.min(ttl, 300),
          }).catch((error: unknown) => {
            console.error("Short-link KV cache write failed.", error);
          }),
        );
      }
    }

    if (entry.status !== "ACTIVE") {
      return Response.redirect(new URL(`/r/${slug}`, environment.APP_ORIGIN), 302);
    }

    if (entry.type === "url" && entry.destination) {
      const destination = new URL(entry.destination);
      if (destination.protocol !== "http:" && destination.protocol !== "https:") {
        return unavailableResponse(502);
      }
      return Response.redirect(destination.toString(), 302);
    }

    return Response.redirect(new URL(`/r/${slug}`, environment.APP_ORIGIN), 302);
  },
} satisfies ExportedHandler<Environment>;

function isValidEntry(value: unknown, slug: string): value is RedirectEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<RedirectEntry>;
  return entry.slug === slug &&
    (entry.status === "ACTIVE" || entry.status === "PAUSED" || entry.status === "EXPIRED") &&
    (entry.type === "url" || entry.type === "business_card" || entry.type === "pdf" || entry.type === "multiple_links") &&
    (entry.destination === null || typeof entry.destination === "string");
}

function unavailableResponse(status: number): Response {
  return new Response(unavailablePage, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    },
  });
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
