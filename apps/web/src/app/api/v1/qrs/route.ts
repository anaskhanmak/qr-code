import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@loopmark/db";
import { authorizeApiKey } from "@/lib/api-key-auth";
import { dynamicQRTypes, parseDynamicContent } from "@/lib/dynamic-qr";
import { generateSlug, getShortUrl } from "@/lib/dynamic-qr";
import { createRateLimiter } from "@/lib/url-safety";
import { canCreateDynamicCode, getPlanUpgradeMessage } from "@/lib/plans";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const apiRateLimit = createRateLimiter({ windowMs: 60_000, maxRequests: 120 });
const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  content: z.unknown(),
});

function rateLimitResponse(keyId: string) {
  const result = apiRateLimit(keyId);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: "Rate limit exceeded." },
    { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))) } },
  );
}

export async function GET(request: Request) {
  const apiKey = await authorizeApiKey(request, "QR_READ");
  if (!apiKey) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const limited = rateLimitResponse(apiKey.id);
  if (limited) return limited;

  const url = new URL(request.url);
  const pageSize = Number(url.searchParams.get("limit") ?? "50");
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return NextResponse.json({ error: "limit must be an integer from 1 to 100." }, { status: 400 });
  }
  const cursor = url.searchParams.get("cursor");
  if (cursor && !/^[A-Za-z0-9_-]{1,40}$/.test(cursor)) {
    return NextResponse.json({ error: "Invalid cursor." }, { status: 400 });
  }

  const codes = await db.qRCode.findMany({
    where: { workspaceId: apiKey.workspaceId, ...(cursor ? { id: { lt: cursor } } : {}) },
    orderBy: { id: "desc" },
    take: pageSize + 1,
    select: { id: true, name: true, kind: true, status: true, slug: true, content: true, createdAt: true, updatedAt: true },
  });
  const hasMore = codes.length > pageSize;
  const items = codes.slice(0, pageSize).map((code) => ({
    ...code,
    shortUrl: code.slug ? getShortUrl(code.slug) : null,
  }));
  return NextResponse.json({
    data: items,
    nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const apiKey = await authorizeApiKey(request, "QR_WRITE");
  if (!apiKey) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const limited = rateLimitResponse(apiKey.id);
  if (limited) return limited;

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 20_000) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Request body could not be read." }, { status: 400 });
  }
  if (body.length > 20_000) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  let rawBody: unknown;
  try {
    rawBody = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = createSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a name and a valid dynamic QR content object." }, { status: 400 });
  }
  const content = parseDynamicContent(parsed.data.content);
  if (!content || !dynamicQRTypes.includes(content.type)) {
    return NextResponse.json({ error: "The QR content type or fields are invalid." }, { status: 400 });
  }

  const dynamicCodeCount = await db.qRCode.count({
    where: { workspaceId: apiKey.workspaceId, kind: "DYNAMIC" },
  });
  if (!canCreateDynamicCode("free", dynamicCodeCount)) {
    return NextResponse.json({ error: getPlanUpgradeMessage("free") }, { status: 409 });
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const qrCode = await db.qRCode.create({
        data: {
          workspaceId: apiKey.workspaceId,
          name: parsed.data.name,
          kind: "DYNAMIC",
          content,
          slug: generateSlug(),
        },
        select: { id: true, name: true, status: true, slug: true, content: true, createdAt: true },
      });
      return NextResponse.json({ data: { ...qrCode, shortUrl: qrCode.slug ? getShortUrl(qrCode.slug) : null } }, {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  return NextResponse.json({ error: "Could not allocate a unique short link. Please retry." }, { status: 503 });
}
