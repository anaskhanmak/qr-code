import { beforeEach, describe, expect, it, vi } from "vitest";
import worker from "./index";

const slug = "aB1234567890cDef";

function createEnvironment(
  cached: Record<string, unknown> | null = null,
): {
  environment: Parameters<typeof worker.fetch>[1];
  cache: { values: Map<string, string>; deleted: string[] };
} {
  const values = new Map<string, string>();
  if (cached) values.set(slug, JSON.stringify(cached));
  const deleted: string[] = [];
  const cache = {
    values,
    deleted,
    async get<T>(key: string, type: "json"): Promise<T | null> {
      if (type !== "json") return null;
      const value = values.get(key);
      return value ? JSON.parse(value) as T : null;
    },
    async put(key: string, value: string): Promise<void> {
      values.set(key, value);
    },
    async delete(key: string): Promise<void> {
      deleted.push(key);
      values.delete(key);
    },
  };
  return {
    environment: {
      SHORT_LINK_CACHE: cache as unknown as KVNamespace,
      APP_ORIGIN: "https://app.loopmark.test",
      CACHE_TTL_SECONDS: "30",
      REDIRECT_REVALIDATION_SECRET: "test-secret",
    },
    cache,
  };
}

function createContext() {
  const pending: Promise<unknown>[] = [];
  const context = {
    pending,
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
  };
  return { context: context as unknown as ExecutionContext, pending };
}

describe("Loopmark short-link edge worker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a branded 404 without resolving malformed or missing slugs", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { environment } = createEnvironment();
    const { context } = createContext();

    const response = await worker.fetch(new Request("https://go.loopmark.test/short"), environment, context);

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("resolves and caches dynamic URL redirects at the edge", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({
      slug,
      status: "ACTIVE",
      type: "url",
      destination: "https://example.com/new",
    }));
    vi.stubGlobal("fetch", fetch);
    const { environment, cache } = createEnvironment();
    const { context, pending } = createContext();

    const response = await worker.fetch(
      new Request(`https://go.loopmark.test/${slug}`),
      environment,
      context,
    );
    await Promise.all(pending);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/new");
    expect(fetch).toHaveBeenCalledOnce();
    expect(cache.values.has(slug)).toBe(true);
  });

  it("routes hosted content to the app landing page instead of redirecting away", async () => {
    const { environment } = createEnvironment({
      slug,
      status: "ACTIVE",
      type: "business_card",
      destination: null,
    });
    const { context } = createContext();

    const response = await worker.fetch(
      new Request(`https://go.loopmark.test/${slug}`),
      environment,
      context,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(`https://app.loopmark.test/r/${slug}`);
  });

  it("fails safely when a cached URL destination is unsafe", async () => {
    const { environment } = createEnvironment({
      slug,
      status: "ACTIVE",
      type: "url",
      destination: "javascript:alert(1)",
    });
    const { context } = createContext();

    const response = await worker.fetch(
      new Request(`https://go.loopmark.test/${slug}`),
      environment,
      context,
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toContain("text/html");
  });

  it("requires the revalidation secret before clearing cached slugs", async () => {
    const { environment, cache } = createEnvironment({ slug, status: "ACTIVE", type: "url", destination: "https://example.com" });
    const { context } = createContext();
    const unauthorized = await worker.fetch(
      new Request(`https://go.loopmark.test/__invalidate/${slug}`, { method: "POST" }),
      environment,
      context,
    );
    const cleared = await worker.fetch(
      new Request(`https://go.loopmark.test/__invalidate/${slug}`, {
        method: "POST",
        headers: { Authorization: "Bearer test-secret" },
      }),
      environment,
      context,
    );

    expect(unauthorized.status).toBe(401);
    expect(cleared.status).toBe(204);
    expect(cache.deleted).toEqual([slug]);
  });
});
