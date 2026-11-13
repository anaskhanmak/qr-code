import { describe, expect, it } from "vitest";
import { canEditQr, canManageBilling, canManageMembers, canViewAnalytics } from "./workspace-access";

describe("workspace access roles", () => {
  it("matches the intended team permissions for each role", () => {
    expect(canEditQr("OWNER")).toBe(true);
    expect(canEditQr("VIEWER")).toBe(false);
    expect(canManageMembers("ADMIN")).toBe(true);
    expect(canManageBilling("OWNER")).toBe(true);
    expect(canViewAnalytics("VIEWER")).toBe(true);
  });

  it("locks billing and member management to power-user roles", () => {
    expect(canManageMembers("EDITOR")).toBe(false);
    expect(canManageBilling("ADMIN")).toBe(false);
  });
});
