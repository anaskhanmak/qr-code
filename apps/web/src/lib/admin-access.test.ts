import { describe, expect, it } from "vitest";
import {
  canAccessAdminPanel,
  canAuditChanges,
  canManageCms,
  canManageModeration,
  canManagePlans,
  canModerateQr,
  canViewPlatformStats,
  getAdminRoleForEmail,
  getAdminNavigation,
} from "./admin-access";

describe("admin access controls", () => {
  it("keeps moderation and plan management scoped to privileged roles", () => {
    expect(canModerateQr("SUPER_ADMIN")).toBe(true);
    expect(canModerateQr("AUDITOR")).toBe(false);
    expect(canManagePlans("SUPER_ADMIN")).toBe(true);
    expect(canManagePlans("MODERATOR")).toBe(false);
  });

  it("allows auditors and moderators to view platform stats without direct mutation rights", () => {
    expect(canViewPlatformStats("AUDITOR")).toBe(true);
    expect(canAuditChanges("AUDITOR")).toBe(true);
    expect(canAuditChanges("MODERATOR")).toBe(false);
  });

  it("exposes admin panel and CMS controls for the right roles", () => {
    expect(canAccessAdminPanel("AUDITOR")).toBe(true);
    expect(canManageCms("SUPER_ADMIN")).toBe(true);
    expect(canManageCms("MODERATOR")).toBe(false);
    expect(canManageModeration("MODERATOR")).toBe(true);
    expect(getAdminNavigation("AUDITOR").some((item) => item.label === "Overview")).toBe(true);
  });

  it("only grants admin access to explicitly configured email addresses", () => {
    expect(getAdminRoleForEmail(" ADMIN@example.com ", "admin@example.com,owner@example.com")).toBe("SUPER_ADMIN");
    expect(getAdminRoleForEmail("user@example.com", "admin@example.com")).toBeNull();
    expect(getAdminRoleForEmail("admin@example.com", "")).toBeNull();
    expect(getAdminRoleForEmail(null, "admin@example.com")).toBeNull();
  });
});
