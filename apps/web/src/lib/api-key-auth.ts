import { db } from "@loopmark/db";
import { hashWorkspaceApiKey, isWorkspaceApiKey } from "@/lib/workspace-api-keys";

export async function authorizeApiKey(request: Request, requiredScope: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer (lm_live_[A-Za-z0-9_-]{43})$/.exec(authorization);
  if (!match || !isWorkspaceApiKey(match[1])) return null;

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash: hashWorkspaceApiKey(match[1]) },
    select: { id: true, workspaceId: true, scopes: true, expiresAt: true, revokedAt: true },
  });
  if (
    !apiKey ||
    apiKey.revokedAt ||
    (apiKey.expiresAt !== null && apiKey.expiresAt <= new Date()) ||
    !apiKey.scopes.includes(requiredScope as (typeof apiKey.scopes)[number])
  ) return null;

  await db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return apiKey;
}
