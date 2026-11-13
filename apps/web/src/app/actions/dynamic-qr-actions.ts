"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { dynamicQRTypes, parseDynamicContent } from "@/lib/dynamic-qr";
import { generateSlug } from "@/lib/dynamic-qr";
import { invalidateRedirectCache } from "@/lib/redirect-cache";
import { canCreateDynamicCode, getPlanUpgradeMessage } from "@/lib/plans";
import { qrDesignSchema } from "@/lib/qr-design";
import type { z } from "zod";

export type SaveDynamicQRState = {
  error?: string;
  slug?: string;
  updated?: boolean;
  warning?: string;
};

export async function saveDynamicQRAction(
  _previousState: SaveDynamicQRState,
  formData: FormData,
): Promise<SaveDynamicQRState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to save a dynamic QR code." };

  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 120) {
    return { error: "Give your QR code a name of 1–120 characters." };
  }

  const rawContent = formData.get("content");
  if (typeof rawContent !== "string" || rawContent.length > 12_000) {
    return { error: "Add the details for your QR code, then try again." };
  }

  let contentValue: unknown;
  try {
    contentValue = JSON.parse(rawContent);
  } catch {
    return { error: "QR details could not be read. Please review your code and try again." };
  }

  const content = parseDynamicContent(contentValue);
  if (!content || !dynamicQRTypes.includes(content.type)) {
    return { error: "Some QR details are missing or invalid. Review them and try again." };
  }

  const membership = await db.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      role: { in: ["OWNER", "ADMIN", "EDITOR"] },
    },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) return { error: "You do not have permission to create QR codes in a workspace." };

  const rawDesign = formData.get("design");
  let design: z.infer<typeof qrDesignSchema> | null = null;
  if (typeof rawDesign === "string") {
    try {
      const parsedDesign = qrDesignSchema.safeParse(JSON.parse(rawDesign));
      if (!parsedDesign.success) return { error: "The QR design settings are invalid." };
      design = parsedDesign.data;
    } catch {
      return { error: "The QR design settings could not be read." };
    }
  }

  const existingId = formData.get("qrId");
  if (typeof existingId === "string" && existingId) {
    if (existingId.length > 30) return { error: "This QR code could not be found in your workspace." };
    const existing = await db.qRCode.findFirst({
      where: {
        id: existingId,
        workspaceId: membership.workspaceId,
        kind: "DYNAMIC",
      },
      select: { id: true, slug: true },
    });
    if (!existing?.slug) return { error: "This QR code could not be found in your workspace." };

    try {
      await db.qRCode.update({
        where: { id: existing.id },
        data: { name: name.trim(), content, ...(design ? { design } : {}) },
      });
    } catch (error) {
      console.error("Could not update dynamic QR code.", error);
      return { error: "The QR code could not be updated right now. Please try again." };
    }

    const cacheCleared = await invalidateRedirectCache(existing.slug);
    revalidatePath("/dashboard");
    revalidatePath(`/r/${existing.slug}`);
    return {
      slug: existing.slug,
      updated: true,
      warning: cacheCleared ? undefined : "The code was updated. Some scans may show the previous destination briefly while the short-link cache refreshes.",
    };
  }

  const workspacePlanId = "free";
  const dynamicCodeCount = await db.qRCode.count({
    where: { workspaceId: membership.workspaceId, kind: "DYNAMIC" },
  });
  if (!canCreateDynamicCode(workspacePlanId, dynamicCodeCount)) {
    return { error: getPlanUpgradeMessage(workspacePlanId) };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const qrCode = await db.qRCode.create({
        data: {
          workspaceId: membership.workspaceId,
          name: name.trim(),
          kind: "DYNAMIC",
          content,
          ...(design ? { design } : {}),
          slug: generateSlug(),
        },
        select: { slug: true },
      });
      if (!qrCode.slug) throw new Error("The new QR code did not receive a short link.");
      revalidatePath("/dashboard");
      return { slug: qrCode.slug };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      console.error("Could not save dynamic QR code.", error);
      return { error: "The QR code could not be saved right now. Please try again." };
    }
  }

  return { error: "We could not create a unique short link. Please try again." };
}
