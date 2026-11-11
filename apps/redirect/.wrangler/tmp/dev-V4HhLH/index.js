var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var slugPattern = /^[A-Za-z0-9]{16}$/;
var unavailablePage = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link unavailable \xB7 Loopmark</title><body style="font:16px/1.6 system-ui,sans-serif;background:#f7f8f2;color:#173a32;display:grid;min-height:90vh;place-items:center;margin:0"><main style="max-width:28rem;padding:2rem;text-align:center;background:white;border:1px solid #e3e9de;border-radius:1.5rem"><strong style="display:inline-grid;place-items:center;width:3rem;height:3rem;border-radius:1rem;background:#c5f277">L</strong><h1>This link is not available</h1><p>It may have expired, been paused, or the address may be incorrect.</p><small>Loopmark \xB7 A little link with a long life</small></main></body></html>';
var src_default = {
  async fetch(request, environment, context) {
    const url = new URL(request.url);
    const invalidateMatch = /^\/__invalidate\/([A-Za-z0-9]{16})$/.exec(url.pathname);
    if (invalidateMatch) {
      if (request.method !== "POST") {
        return new Response("Method not allowed.", {
          status: 405,
          headers: { Allow: "POST" }
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
        headers: { Allow: "GET, HEAD" }
      });
    }
    const slug = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!slugPattern.test(slug)) return unavailableResponse(404);
    let entry = null;
    try {
      entry = await environment.SHORT_LINK_CACHE.get(slug, "json");
    } catch (error) {
      console.error("Short-link KV lookup failed; falling back to the app resolver.", error);
    }
    if (!entry) {
      let resolverResponse;
      try {
        const appOrigin = new URL(environment.APP_ORIGIN);
        const resolverUrl = new URL(`/api/redirect/resolve/${slug}`, appOrigin);
        resolverResponse = await fetch(resolverUrl, {
          headers: { Accept: "application/json" },
          cf: { cacheTtl: 0, cacheEverything: false }
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
        entry = await resolverResponse.json();
      } catch (error) {
        console.error("Short-link resolver returned invalid JSON.", error);
        return unavailableResponse(502);
      }
      if (!isValidEntry(entry, slug)) return unavailableResponse(502);
      const ttl = Number(environment.CACHE_TTL_SECONDS ?? "30");
      if (Number.isInteger(ttl) && ttl > 0) {
        context.waitUntil(
          environment.SHORT_LINK_CACHE.put(slug, JSON.stringify(entry), {
            expirationTtl: Math.min(ttl, 300)
          }).catch((error) => {
            console.error("Short-link KV cache write failed.", error);
          })
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
  }
};
function isValidEntry(value, slug) {
  if (!value || typeof value !== "object") return false;
  const entry = value;
  return entry.slug === slug && (entry.status === "ACTIVE" || entry.status === "PAUSED" || entry.status === "EXPIRED") && (entry.type === "url" || entry.type === "business_card" || entry.type === "pdf" || entry.type === "multiple_links") && (entry.destination === null || typeof entry.destination === "string");
}
__name(isValidEntry, "isValidEntry");
function unavailableResponse(status) {
  return new Response(unavailablePage, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"
    }
  });
}
__name(unavailableResponse, "unavailableResponse");
function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
__name(constantTimeEqual, "constantTimeEqual");

// ../../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-UgY215/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-UgY215/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
