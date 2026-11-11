import { NextResponse } from "next/server";
import { db } from "@loopmark/db";
import { parseDynamicContent } from "@/lib/dynamic-qr";

export const runtime = "nodejs";

function escapeVCard(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/([;,])/g, "\\$1");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const qrCode = await db.qRCode.findUnique({
    where: { slug },
    select: { kind: true, status: true, content: true, expiresAt: true },
  });
  if (
    !qrCode ||
    qrCode.kind !== "DYNAMIC" ||
    qrCode.status !== "ACTIVE" ||
    (qrCode.expiresAt && qrCode.expiresAt <= new Date())
  ) {
    return new NextResponse("Contact card not found.", { status: 404 });
  }

  const content = parseDynamicContent(qrCode.content);
  if (!content || content.type !== "business_card") {
    return new NextResponse("Contact card not found.", { status: 404 });
  }

  const fields = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(content.fullName)}`,
    content.organization ? `ORG:${escapeVCard(content.organization)}` : "",
    content.role ? `TITLE:${escapeVCard(content.role)}` : "",
    content.phone ? `TEL;TYPE=WORK,VOICE:${escapeVCard(content.phone)}` : "",
    content.email ? `EMAIL:${escapeVCard(content.email)}` : "",
    content.website ? `URL:${escapeVCard(content.website)}` : "",
    content.bio ? `NOTE:${escapeVCard(content.bio)}` : "",
    "END:VCARD",
    "",
  ].filter(Boolean);

  return new NextResponse(fields.join("\r\n"), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.vcf"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
