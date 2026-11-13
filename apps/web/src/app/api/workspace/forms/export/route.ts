import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { getAnalyticsSince, toSafeCsvCell } from "@/lib/scan-analytics";
import { canViewAnalytics } from "@/lib/workspace-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const exportLimit = 10_000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const workspace = await db.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      members: { where: { userId: session.user.id }, take: 1, select: { role: true } },
    },
  });
  if (!workspace || !canViewAnalytics(workspace.members[0]?.role ?? "EDITOR")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const responses = await db.qRFormResponse.findMany({
    where: { workspaceId: workspace.id, createdAt: { gte: getAnalyticsSince(90) } },
    orderBy: { createdAt: "desc" },
    take: exportLimit + 1,
    select: { createdAt: true, kind: true, name: true, email: true, rating: true, message: true, qrCode: { select: { name: true } } },
  });
  if (responses.length > exportLimit) {
    return NextResponse.json({ error: `This export exceeds ${exportLimit} rows.` }, { status: 413 });
  }

  const columns = ["created_at", "kind", "qr_name", "name", "email", "rating", "message"];
  const rows = responses.map((response) => [
    response.createdAt,
    response.kind,
    response.qrCode.name,
    response.name,
    response.email,
    response.rating ?? "",
    response.message,
  ].map(toSafeCsvCell).join(","));
  return new NextResponse([columns.join(","), ...rows].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"loopmark-form-responses-90d.csv\"",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
