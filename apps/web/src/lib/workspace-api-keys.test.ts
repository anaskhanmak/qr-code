import { describe, expect, it } from "vitest";
import {
  createWorkspaceApiKey,
  hashWorkspaceApiKey,
  isWorkspaceApiKey,
} from "./workspace-api-keys";

describe("workspace API key helpers", () => {
  it("generates recognizable one-time secrets and stores only digests", () => {
    const key = createWorkspaceApiKey();
    expect(isWorkspaceApiKey(key.value)).toBe(true);
    expect(key.prefix).toBe(key.value.slice(0, 16));
    expect(hashWorkspaceApiKey(key.value)).not.toBe(key.value);
    expect(hashWorkspaceApiKey(key.value)).toBe(hashWorkspaceApiKey(key.value));
  });

  it("rejects malformed or non-production key formats", () => {
    expect(isWorkspaceApiKey("lm_live_short")).toBe(false);
    expect(isWorkspaceApiKey(`lm_live_${"x".repeat(43)}!`)).toBe(false);
  });
});
