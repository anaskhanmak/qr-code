import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@loopmark/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const exportLimits = { qrCodes: 5000, scans: 20_000, responses: 20_000 };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerified: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    select: { workspaceId: true, role: true, createdAt: true, workspace: { select: { name: true } } },
  });
  const workspaceIds = memberships.map(({ workspaceId }) => workspaceId);
  const [qrCodes, scans, responses] = await Promise.all([
    db.qRCode.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: { createdAt: "desc" },
      take: exportLimits.qrCodes + 1,
      select: { id: true, workspaceId: true, name: true, kind: true, status: true, content: true, design: true, slug: true, expiresAt: true, favorite: true, createdAt: true, updatedAt: true },
    }),
    db.qRCodeScan.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: { createdAt: "desc" },
      take: exportLimits.scans + 1,
      select: { qrCodeId: true, classification: true, country: true, city: true, language: true, deviceType: true, browser: true, os: true, referrer: true, isUnique: true, createdAt: true },
    }),
    db.qRFormResponse.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: { createdAt: "desc" },
      take: exportLimits.responses + 1,
      select: { qrCodeId: true, kind: true, name: true, email: true, rating: true, message: true, createdAt: true },
    }),
  ]);
  if (
    qrCodes.length > exportLimits.qrCodes ||
    scans.length > exportLimits.scans ||
    responses.length > exportLimits.responses
  ) {
    return NextResponse.json({
      error: "This account export exceeds the current self-service limits. Contact support for a complete export.",
      limits: exportLimits,
    }, { status: 413 });
  }

  const [apiKeys, invitations] = await Promise.all([
    db.apiKey.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: { createdAt: "desc" },
      select: { workspaceId: true, name: true, keyPrefix: true, scopes: true, lastUsedAt: true, expiresAt: true, revokedAt: true, createdAt: true },
    }),
    db.workspaceInvitation.findMany({
      where: { invitedById: user.id },
      select: { workspaceId: true, email: true, role: true, acceptedAt: true, expiresAt: true, createdAt: true },
    }),
  ]);

  return new NextResponse(JSON.stringify({
    exportedAt: new Date().toISOString(),
    user,
    memberships,
    qrCodes,
    scans,
    formResponses: responses,
    apiKeys,
    invitationsSent: invitations,
    exclusions: [
      "Raw IP addresses are never stored. Hashed IP scan identifiers are excluded from this export.",
      "API key secrets and hashes, webhook secret hashes, and user-agent strings are excluded.",
    ],
  }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"loopmark-account-export.json\"",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
