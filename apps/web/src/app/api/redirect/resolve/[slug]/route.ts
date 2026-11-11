import { NextResponse } from "next/server";
import { db } from "@loopmark/db";
import { parseDynamicContent, resolveQrDestination } from "@/lib/dynamic-qr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[A-Za-z0-9]{16}$/.test(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const qrCode = await db.qRCode.findUnique({
    where: { slug },
    select: { kind: true, status: true, content: true, expiresAt: true },
  });
  if (!qrCode || qrCode.kind !== "DYNAMIC") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isExpired = qrCode.status === "EXPIRED" || Boolean(
    qrCode.expiresAt && qrCode.expiresAt <= new Date(),
  );
  const status = isExpired ? "EXPIRED" : qrCode.status;
  const content = parseDynamicContent(qrCode.content);
  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(
    {
      slug,
      status,
      type: content.type,
      destination: content.type === "url" ? resolveQrDestination(content) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
