import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSecurityHeaders } from "@/lib/url-safety";

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const headers = getSecurityHeaders({
    isHttps: request.nextUrl.protocol === "https:",
    isProduction: process.env.NODE_ENV === "production",
    nonce,
  });
  const contentSecurityPolicy = headers["Content-Security-Policy"];
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};
