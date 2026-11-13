import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { getAnalyticsSince, parseAnalyticsDays, toSafeCsvCell } from "@/lib/scan-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const exportLimit = 10_000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { slug } = await params;
  if (!/^[A-Za-z0-9]{16}$/.test(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const qrCode = await db.qRCode.findFirst({
    where: {
      slug,
      workspace: {
        members: {
          some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN", "VIEWER"] } },
        },
      },
    },
    select: { name: true, id: true },
  });
  if (!qrCode) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const days = parseAnalyticsDays(new URL(request.url).searchParams.get("days"));
  if (days === null) {
    return NextResponse.json({ error: "days must be an integer from 1 to 365." }, { status: 400 });
  }
  const scans = await db.qRCodeScan.findMany({
    where: { qrCodeId: qrCode.id, createdAt: { gte: getAnalyticsSince(days) } },
    orderBy: { createdAt: "desc" },
    take: exportLimit + 1,
    select: {
      createdAt: true,
      classification: true,
      country: true,
      city: true,
      deviceType: true,
      browser: true,
      os: true,
      language: true,
      referrer: true,
      isUnique: true,
    },
  });
  if (scans.length > exportLimit) {
    return NextResponse.json({
      error: `This export exceeds ${exportLimit} rows. Choose a shorter date range.`,
    }, { status: 413 });
  }

  const columns = ["created_at", "classification", "country", "city", "device", "browser", "os", "language", "referrer", "unique"];
  const rows = scans.map((scan) => [
    scan.createdAt,
    scan.classification,
    scan.country,
    scan.city,
    scan.deviceType,
    scan.browser,
    scan.os,
    scan.language,
    scan.referrer,
    scan.isUnique ? "true" : "false",
  ].map(toSafeCsvCell).join(","));
  const filename = `qr-analytics-${slug}-${days}d.csv`;
  return new NextResponse([columns.join(","), ...rows].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
