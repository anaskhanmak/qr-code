import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { getAnalyticsSince, getQrScanSummary, parseAnalyticsDays } from "@/lib/scan-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
    select: { id: true, name: true },
  });

  if (!qrCode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const requestedDays = parseAnalyticsDays(new URL(request.url).searchParams.get("days"));
  if (requestedDays === null) {
    return NextResponse.json({ error: "days must be an integer from 1 to 365." }, { status: 400 });
  }
  const summary = await getQrScanSummary(qrCode.id, getAnalyticsSince(requestedDays));

  return NextResponse.json({
    slug,
    name: qrCode.name,
    days: requestedDays,
    total: summary.total,
    unique: summary.unique,
    byClassification: summary.byClassification,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
