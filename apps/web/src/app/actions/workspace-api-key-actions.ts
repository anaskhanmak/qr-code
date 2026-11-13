"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { createWorkspaceApiKey, hashWorkspaceApiKey } from "@/lib/workspace-api-keys";
import { z } from "zod";

export type ApiKeyActionState = { error?: string; secret?: string; success?: string };

const createSchema = z.object({
  workspaceId: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  scopes: z.array(z.enum(["QR_READ", "QR_WRITE", "ANALYTICS_READ", "WORKSPACE_READ", "WORKSPACE_WRITE", "WEBHOOKS_WRITE"])).min(1).max(6),
  expiresInDays: z.enum(["30", "90", "365", "never"]),
});

async function canManageApiKeys(workspaceId: string, userId: string) {
  return db.workspaceMember.findFirst({
    where: { workspaceId, userId, role: { in: ["OWNER", "ADMIN"] } },
    select: { userId: true },
  });
}

export async function createWorkspaceApiKeyAction(
  _state: ApiKeyActionState,
  formData: FormData,
): Promise<ApiKeyActionState> {
  const parsed = createSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    scopes: formData.getAll("scopes"),
    expiresInDays: formData.get("expiresInDays"),
  });
  if (!parsed.success) return { error: "Choose a name, at least one scope, and a valid expiry." };
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to manage API keys." };
  if (!await canManageApiKeys(parsed.data.workspaceId, session.user.id)) {
    return { error: "Only workspace owners and admins can manage API keys." };
  }
  const existingKeyCount = await db.apiKey.count({
    where: { workspaceId: parsed.data.workspaceId, revokedAt: null },
  });
  if (existingKeyCount >= 20) return { error: "This workspace already has 20 active API keys. Revoke an unused key first." };

  const generated = createWorkspaceApiKey();
  const expiresAt = parsed.data.expiresInDays === "never"
    ? null
    : new Date(Date.now() + Number(parsed.data.expiresInDays) * 24 * 60 * 60 * 1000);
  await db.apiKey.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      name: parsed.data.name,
      keyHash: hashWorkspaceApiKey(generated.value),
      keyPrefix: generated.prefix,
      scopes: parsed.data.scopes,
      expiresAt,
    },
  });
  revalidatePath("/dashboard/integrations");
  return { secret: generated.value, success: "Copy this key now. It will not be shown again." };
}

export async function revokeWorkspaceApiKeyAction(
  _state: ApiKeyActionState,
  formData: FormData,
): Promise<ApiKeyActionState> {
  const parsed = z.object({
    workspaceId: z.string().min(1).max(40),
    apiKeyId: z.string().min(1).max(40),
  }).safeParse({
    workspaceId: formData.get("workspaceId"),
    apiKeyId: formData.get("apiKeyId"),
  });
  if (!parsed.success) return { error: "Choose a valid API key." };
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to manage API keys." };
  if (!await canManageApiKeys(parsed.data.workspaceId, session.user.id)) {
    return { error: "Only workspace owners and admins can manage API keys." };
  }

  const revoked = await db.apiKey.updateMany({
    where: {
      id: parsed.data.apiKeyId,
      workspaceId: parsed.data.workspaceId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
  if (revoked.count !== 1) return { error: "This API key is already revoked or could not be found." };
  revalidatePath("/dashboard/integrations");
  return { success: "API key revoked." };
}
