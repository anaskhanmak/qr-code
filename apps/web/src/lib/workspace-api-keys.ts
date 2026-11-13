import { createHash, randomBytes } from "node:crypto";

const apiKeyPrefix = "lm_live_";

export function createWorkspaceApiKey() {
  const secret = randomBytes(32).toString("base64url");
  return {
    value: `${apiKeyPrefix}${secret}`,
    prefix: `${apiKeyPrefix}${secret.slice(0, 8)}`,
  };
}

export function hashWorkspaceApiKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function isWorkspaceApiKey(value: string) {
  return /^lm_live_[A-Za-z0-9_-]{43}$/.test(value);
}
