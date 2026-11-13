import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@loopmark/db";
import { getRetentionCutoff, parseRetentionDays } from "@/lib/retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const batchSize = 5000;
const maxBatchesPerRun = 20;

function isAuthorized(request: Request, secret: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const secret = process.env.ANALYTICS_RETENTION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Analytics retention job is not configured." }, { status: 503 });
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const retentionDays = parseRetentionDays(process.env.ANALYTICS_RETENTION_DAYS);
  if (retentionDays === null) {
    return NextResponse.json({ error: "ANALYTICS_RETENTION_DAYS must be between 30 and 3650." }, { status: 500 });
  }
  const cutoff = getRetentionCutoff(retentionDays);
  let deletedScans = 0;
  let deletedResponses = 0;

  for (let batchNumber = 0; batchNumber < maxBatchesPerRun; batchNumber += 1) {
    const batch = await db.qRCodeScan.findMany({
      where: { createdAt: { lt: cutoff } },
      orderBy: { createdAt: "asc" },
      take: batchSize,
      select: { id: true },
    });
    if (batch.length === 0) break;
    const result = await db.qRCodeScan.deleteMany({ where: { id: { in: batch.map(({ id }) => id) } } });
    deletedScans += result.count;
    if (batch.length < batchSize) break;
  }

  for (let batchNumber = 0; batchNumber < maxBatchesPerRun; batchNumber += 1) {
    const batch = await db.qRFormResponse.findMany({
      where: { createdAt: { lt: cutoff } },
      orderBy: { createdAt: "asc" },
      take: batchSize,
      select: { id: true },
    });
    if (batch.length === 0) break;
    const result = await db.qRFormResponse.deleteMany({ where: { id: { in: batch.map(({ id }) => id) } } });
    deletedResponses += result.count;
    if (batch.length < batchSize) break;
  }

  const [remainingScans, remainingResponses] = await Promise.all([
    db.qRCodeScan.findFirst({ where: { createdAt: { lt: cutoff } }, select: { id: true } }),
    db.qRFormResponse.findFirst({ where: { createdAt: { lt: cutoff } }, select: { id: true } }),
  ]);
  return NextResponse.json({
    retentionDays,
    deletedScans,
    deletedFormResponses: deletedResponses,
    hasMoreScans: Boolean(remainingScans),
    hasMoreFormResponses: Boolean(remainingResponses),
    cutoff: cutoff.toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
