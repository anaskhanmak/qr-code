"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { invalidateRedirectCache } from "@/lib/redirect-cache";
import { canCreateDynamicCode, getPlanUpgradeMessage } from "@/lib/plans";
import { generateSlug } from "@/lib/dynamic-qr";
import { Prisma } from "@prisma/client";
import { parseBulkQrIds } from "@/lib/qr-management";

type QrActionState = { error?: string; success?: string };

async function getEditableWorkspaceId(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const workspaceId = formData.get("workspaceId");
  if (typeof workspaceId !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(workspaceId)) return null;
  const membership = await db.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspaceId,
      role: { in: ["OWNER", "ADMIN", "EDITOR"] },
    },
    select: { workspaceId: true },
  });
  return membership?.workspaceId ?? null;
}

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

export async function createQrFolderAction(
  _state: QrActionState,
  formData: FormData,
): Promise<QrActionState> {
  const workspaceId = await getEditableWorkspaceId(formData);
  if (!workspaceId) return { error: "You do not have permission to create folders in a workspace." };
  const rawName = formData.get("name");
  if (typeof rawName !== "string" || !rawName.trim() || rawName.trim().length > 50) {
    return { error: "Folder names must be between 1 and 50 characters." };
  }
  const folderCount = await db.qRFolder.count({ where: { workspaceId } });
  if (folderCount >= 100) return { error: "This workspace has reached the 100-folder limit." };
  try {
    await db.qRFolder.create({ data: { workspaceId, name: rawName.trim() } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A folder with that name already exists in this workspace." };
    }
    throw error;
  }
  revalidatePath("/dashboard");
  return { success: "Folder created." };
}

export async function renameQrFolderAction(
  _state: QrActionState,
  formData: FormData,
): Promise<QrActionState> {
  const workspaceId = await getEditableWorkspaceId(formData);
  if (!workspaceId) return { error: "You do not have permission to manage folders in this workspace." };
  const folderId = formData.get("folderId");
  const rawName = formData.get("name");
  if (typeof folderId !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(folderId)) {
    return { error: "Choose a valid folder." };
  }
  if (typeof rawName !== "string" || !rawName.trim() || rawName.trim().length > 50) {
    return { error: "Folder names must be between 1 and 50 characters." };
  }
  try {
    const result = await db.qRFolder.updateMany({
      where: { id: folderId, workspaceId },
      data: { name: rawName.trim() },
    });
    if (!result.count) return { error: "That folder is not available in your workspace." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A folder with that name already exists in this workspace." };
    }
    throw error;
  }
  revalidatePath("/dashboard");
  return { success: "Folder renamed." };
}

export async function deleteQrFolderAction(
  _state: QrActionState,
  formData: FormData,
): Promise<QrActionState> {
  const workspaceId = await getEditableWorkspaceId(formData);
  if (!workspaceId) return { error: "You do not have permission to manage folders in this workspace." };
  const folderId = formData.get("folderId");
  if (typeof folderId !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(folderId)) {
    return { error: "Choose a valid folder." };
  }
  const result = await db.qRFolder.deleteMany({ where: { id: folderId, workspaceId } });
  if (!result.count) return { error: "That folder is not available in your workspace." };
  revalidatePath("/dashboard");
  return { success: "Folder deleted. Its QR codes are now unfiled." };
}

export async function bulkManageQrAction(
  _state: QrActionState,
  formData: FormData,
): Promise<QrActionState> {
  const workspaceId = await getEditableWorkspaceId(formData);
  if (!workspaceId) return { error: "You do not have permission to manage QR codes in a workspace." };

  const selection = parseBulkQrIds(formData.getAll("qrIds"));
  if ("error" in selection) return selection;
  const { ids } = selection;

  const operation = formData.get("operation");
  if (operation !== "pause" && operation !== "resume" && operation !== "delete" && operation !== "move") {
    return { error: "Choose a valid bulk action." };
  }

  const qrCodes = await db.qRCode.findMany({
    where: { id: { in: ids }, workspaceId, kind: "DYNAMIC" },
    select: { id: true, slug: true },
  });
  if (qrCodes.length !== ids.length) {
    return { error: "One or more selected codes are unavailable in your workspace. Refresh and try again." };
  }

  if (operation === "move") {
    const rawFolderId = formData.get("folderId");
    let folderId: string | null = null;
    if (rawFolderId !== "unfiled") {
      if (typeof rawFolderId !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(rawFolderId)) {
        return { error: "Choose a valid destination folder." };
      }
      const folder = await db.qRFolder.findFirst({
        where: { id: rawFolderId, workspaceId },
        select: { id: true },
      });
      if (!folder) return { error: "That folder is not available in your workspace." };
      folderId = folder.id;
    }
    await db.qRCode.updateMany({
      where: { id: { in: ids }, workspaceId, kind: "DYNAMIC" },
      data: { folderId },
    });
    revalidatePath("/dashboard");
    return { success: `Moved ${ids.length} QR code${ids.length === 1 ? "" : "s"}.` };
  }

  const nextStatus = operation === "pause" ? "PAUSED" : operation === "resume" ? "ACTIVE" : null;
  if (nextStatus) {
    await db.qRCode.updateMany({
      where: {
        id: { in: ids },
        workspaceId,
        kind: "DYNAMIC",
        ...(operation === "pause" ? { status: "ACTIVE" } : { status: "PAUSED" }),
      },
      data: { status: nextStatus },
    });
  } else {
    await db.qRCode.updateMany({
      where: { id: { in: ids }, workspaceId, kind: "DYNAMIC" },
      data: { status: "PAUSED" },
    });
  }

  const cacheResults = await Promise.all(
    qrCodes.filter((qrCode): qrCode is typeof qrCode & { slug: string } => qrCode.slug !== null).map(async (qrCode) => ({
      id: qrCode.id,
      cleared: await invalidateRedirectCache(qrCode.slug),
    })),
  );
  const failedInvalidations = new Set(cacheResults.filter((result) => !result.cleared).map((result) => result.id));
  let deletedCount = 0;
  if (operation === "delete") {
    const safeIds = qrCodes.filter((qrCode) => !failedInvalidations.has(qrCode.id)).map((qrCode) => qrCode.id);
    if (safeIds.length) {
      const result = await db.qRCode.deleteMany({
        where: { id: { in: safeIds }, workspaceId, kind: "DYNAMIC", status: "PAUSED" },
      });
      deletedCount = result.count;
    }
  }

  revalidatePath("/dashboard");
  if (failedInvalidations.size) {
    if (operation === "delete") {
      return { error: `Deleted ${deletedCount}; ${failedInvalidations.size} code(s) remain paused because the redirect cache could not be cleared.` };
    }
    return { error: `The action was saved, but cache invalidation failed for ${failedInvalidations.size} code(s). Their short links may briefly show stale status.` };
  }
  if (operation === "delete") return { success: `Deleted ${deletedCount} QR code${deletedCount === 1 ? "" : "s"}.` };
  return { success: `${operation === "pause" ? "Paused" : "Resumed"} ${ids.length} QR code${ids.length === 1 ? "" : "s"}.` };
}
