import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@loopmark/db";
import { authorizeApiKey, getApiRateLimitRetryAfter } from "@/lib/api-key-auth";
import { invalidateRedirectCache } from "@/lib/redirect-cache";
import { getShortUrl } from "@/lib/dynamic-qr";
import { parseQrApiUpdate } from "@/lib/api-qr-update";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function rateLimitResponse(keyId: string) {
  const retryAfter = getApiRateLimitRetryAfter(keyId);
  return retryAfter === null
    ? null
    : NextResponse.json(
        { error: "Rate limit exceeded." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
}

function validId(id: string) {
  return /^[A-Za-z0-9_-]{1,40}$/.test(id);
}

export async function GET(request: Request, { params }: RouteContext) {
  const apiKey = await authorizeApiKey(request, "QR_READ");
  if (!apiKey) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const limited = rateLimitResponse(apiKey.id);
  if (limited) return limited;

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  const qrCode = await db.qRCode.findFirst({
    where: { id, workspaceId: apiKey.workspaceId },
    select: { id: true, name: true, kind: true, status: true, slug: true, content: true, design: true, createdAt: true, updatedAt: true },
  });
  if (!qrCode) return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  return NextResponse.json({
    data: { ...qrCode, shortUrl: qrCode.slug ? getShortUrl(qrCode.slug) : null },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const apiKey = await authorizeApiKey(request, "QR_WRITE");
  if (!apiKey) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const limited = rateLimitResponse(apiKey.id);
  if (limited) return limited;

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 20_000) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });

  let rawBody: unknown;
  try {
    const body = await request.text();
    if (body.length > 20_000) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    rawBody = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const update = parseQrApiUpdate(rawBody);
  if (!update) return NextResponse.json({ error: "Provide a valid name, content, or design update." }, { status: 400 });

  const existing = await db.qRCode.findFirst({
    where: { id, workspaceId: apiKey.workspaceId },
    select: { id: true, slug: true, kind: true },
  });
  if (!existing) return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  if (update.content && existing.kind !== "DYNAMIC") {
    return NextResponse.json({ error: "Only dynamic QR content can be updated." }, { status: 400 });
  }

  const data: Prisma.QRCodeUpdateInput = {};
  if (update.name !== undefined) data.name = update.name;
  if (update.content !== undefined) data.content = update.content;
  if (update.design !== undefined) data.design = update.design === null ? Prisma.DbNull : update.design;
  const qrCode = await db.qRCode.update({
    where: { id: existing.id },
    data,
    select: { id: true, name: true, kind: true, status: true, slug: true, content: true, design: true, createdAt: true, updatedAt: true },
  });

  let warning: string | undefined;
  if (update.content !== undefined && existing.slug && !(await invalidateRedirectCache(existing.slug))) {
    warning = "The QR code was updated, but its short-link cache could not be refreshed immediately.";
  }
  return NextResponse.json({
    data: { ...qrCode, shortUrl: qrCode.slug ? getShortUrl(qrCode.slug) : null },
    ...(warning ? { warning } : {}),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const apiKey = await authorizeApiKey(request, "QR_WRITE");
  if (!apiKey) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const limited = rateLimitResponse(apiKey.id);
  if (limited) return limited;

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  const qrCode = await db.qRCode.findFirst({
    where: { id, workspaceId: apiKey.workspaceId },
    select: { id: true, slug: true },
  });
  if (!qrCode) return NextResponse.json({ error: "QR code not found." }, { status: 404 });

  if (qrCode.slug) {
    await db.qRCode.update({
      where: { id: qrCode.id },
      data: { status: "PAUSED" },
    });
    if (!(await invalidateRedirectCache(qrCode.slug))) {
      return NextResponse.json(
        { error: "The QR code was paused, but its redirect cache could not be cleared. Retry deletion later." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  await db.qRCode.delete({ where: { id: qrCode.id } });
  return new NextResponse(null, { status: 204 });
}
