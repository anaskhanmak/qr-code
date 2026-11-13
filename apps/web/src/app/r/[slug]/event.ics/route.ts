import { NextResponse } from "next/server";
import { db } from "@loopmark/db";
import { parseDynamicContent } from "@/lib/dynamic-qr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeCalendarText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toCalendarDate(value: string) {
  return new Date(value).toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

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
    select: { status: true, expiresAt: true, content: true },
  });
  if (
    !qrCode ||
    qrCode.status !== "ACTIVE" ||
    (qrCode.expiresAt !== null && qrCode.expiresAt <= new Date())
  ) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const content = parseDynamicContent(qrCode.content);
  if (!content || content.type !== "event") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const details = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Loopmark//QR Event//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${slug}@loopmark`,
    `DTSTAMP:${toCalendarDate(new Date().toISOString())}`,
    `DTSTART:${toCalendarDate(content.startAt)}`,
    `DTEND:${toCalendarDate(content.endAt)}`,
    `SUMMARY:${escapeCalendarText(content.title)}`,
    ...(content.description ? [`DESCRIPTION:${escapeCalendarText(content.description)}`] : []),
    ...(content.location ? [`LOCATION:${escapeCalendarText(content.location)}`] : []),
    ...(content.eventUrl ? [`URL:${content.eventUrl}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new NextResponse(details, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="loopmark-${slug}.ics"`,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
