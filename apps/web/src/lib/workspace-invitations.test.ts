import { describe, expect, it } from "vitest";
import {
  createWorkspaceInvitationToken,
  hashWorkspaceInvitationToken,
  isWorkspaceInvitationToken,
} from "./workspace-invitations";

describe("workspace invitation tokens", () => {
  it("creates unguessable URL-safe tokens and stores a one-way digest", () => {
    const token = createWorkspaceInvitationToken();
    expect(isWorkspaceInvitationToken(token)).toBe(true);
    expect(hashWorkspaceInvitationToken(token)).not.toBe(token);
    expect(hashWorkspaceInvitationToken(token)).toBe(hashWorkspaceInvitationToken(token));
  });

  it("rejects malformed tokens", () => {
    expect(isWorkspaceInvitationToken("short")).toBe(false);
    expect(isWorkspaceInvitationToken("a".repeat(43) + "!")).toBe(false);
  });
});
