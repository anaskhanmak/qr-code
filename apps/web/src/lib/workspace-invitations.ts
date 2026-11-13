import { createHash, randomBytes } from "node:crypto";

export function createWorkspaceInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashWorkspaceInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isWorkspaceInvitationToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
