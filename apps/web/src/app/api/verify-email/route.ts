import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@loopmark/db";
import { safeReturnTo } from "@/lib/return-to";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const next = safeReturnTo(url.searchParams.get("next"));
  if (!token || token.length > 200) {
    const loginUrl = new URL("/login", url);
    loginUrl.searchParams.set("verified", "invalid");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = await db.$transaction(async (transaction) => {
    const record = await transaction.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expires: true },
    });
    if (!record || record.expires <= new Date()) return false;
    const consumed = await transaction.emailVerificationToken.deleteMany({
      where: { id: record.id, expires: { gt: new Date() } },
    });
    if (consumed.count !== 1) return false;
    await transaction.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    });
    return true;
  });
  const loginUrl = new URL("/login", url);
  loginUrl.searchParams.set("verified", result ? "success" : "invalid");
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
