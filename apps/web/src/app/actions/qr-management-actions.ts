"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { invalidateRedirectCache } from "@/lib/redirect-cache";
import { canCreateDynamicCode, getPlanUpgradeMessage } from "@/lib/plans";
import { generateSlug } from "@/lib/dynamic-qr";
import { Prisma } from "@prisma/client";

type QrActionState = { error?: string; success?: string };

async function getManageableDynamicQr(qrId: FormDataEntryValue | null) {
  const session = await auth();
  if (!session?.user?.id || typeof qrId !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(qrId)) {
    return null;
  }

  return db.qRCode.findFirst({
    where: {
      id: qrId,
      kind: "DYNAMIC",
      workspace: {
        members: {
          some: {
            userId: session.user.id,
            role: { in: ["OWNER", "ADMIN", "EDITOR"] },
          },
        },
      },
    },
    select: { id: true, workspaceId: true, name: true, slug: true, status: true, favorite: true, content: true, design: true },
  });
}

export async function toggleQrFavoriteAction(formData: FormData): Promise<void> {
  const qrCode = await getManageableDynamicQr(formData.get("qrId"));
  if (!qrCode) return;

  await db.qRCode.update({
    where: { id: qrCode.id },
    data: { favorite: !qrCode.favorite },
  });
  revalidatePath("/dashboard");
}

export async function toggleQrStatusAction(formData: FormData): Promise<void> {
  const qrCode = await getManageableDynamicQr(formData.get("qrId"));
  if (!qrCode || !qrCode.slug || !["ACTIVE", "PAUSED"].includes(qrCode.status)) return;

  const nextStatus = qrCode.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  await db.qRCode.update({
    where: { id: qrCode.id },
    data: { status: nextStatus },
  });
  const cacheCleared = await invalidateRedirectCache(qrCode.slug);
  revalidatePath("/dashboard");
  revalidatePath(`/r/${qrCode.slug}`);

  if (!cacheCleared) {
    redirect("/dashboard?cacheRefresh=delayed");
  }
  redirect(`/dashboard?statusUpdated=${nextStatus.toLowerCase()}`);
}

export async function duplicateQrAction(
  _state: QrActionState,
  formData: FormData,
): Promise<QrActionState> {
  const qrCode = await getManageableDynamicQr(formData.get("qrId"));
  if (!qrCode) return { error: "This QR code could not be found in your workspace." };
  const count = await db.qRCode.count({
    where: { workspaceId: qrCode.workspaceId, kind: "DYNAMIC" },
  });
  if (!canCreateDynamicCode("free", count)) return { error: getPlanUpgradeMessage("free") };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await db.qRCode.create({
        data: {
          workspaceId: qrCode.workspaceId,
          name: `${qrCode.name} copy`.slice(0, 120),
          kind: "DYNAMIC",
          content: qrCode.content as Prisma.InputJsonValue,
          ...(qrCode.design ? { design: qrCode.design as Prisma.InputJsonValue } : {}),
          slug: generateSlug(),
        },
      });
      revalidatePath("/dashboard");
      return { success: "QR code duplicated." };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  return { error: "Could not allocate a unique short link. Please try again." };
}

export async function deleteQrAction(
  _state: QrActionState,
  formData: FormData,
): Promise<QrActionState> {
  const qrCode = await getManageableDynamicQr(formData.get("qrId"));
  if (!qrCode) return { error: "This QR code could not be found in your workspace." };
  if (qrCode.slug) {
    await db.qRCode.update({ where: { id: qrCode.id }, data: { status: "PAUSED" } });
    const cacheCleared = await invalidateRedirectCache(qrCode.slug);
    if (!cacheCleared) {
      revalidatePath("/dashboard");
      return { error: "The QR code is paused, but its short-link cache could not be cleared. It was kept so you can retry safely." };
    }
  }
  await db.qRCode.delete({ where: { id: qrCode.id } });
  revalidatePath("/dashboard");
  return { success: "QR code deleted." };
}
