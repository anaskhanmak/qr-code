export const adminRoleNames = ["SUPER_ADMIN", "MODERATOR", "AUDITOR"] as const;
export type AdminRole = (typeof adminRoleNames)[number];

export function getAdminRoleForEmail(
  email: string | null | undefined,
  configuredEmails = process.env.ADMIN_EMAILS,
): AdminRole | null {
  if (!email || !configuredEmails) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const allowedEmails = configuredEmails.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);

  return allowedEmails.includes(normalizedEmail) ? "SUPER_ADMIN" : null;
}

export const adminPermissions: Record<AdminRole, {
  canModerateQr: boolean;
  canManagePlans: boolean;
  canViewPlatformStats: boolean;
  canAuditChanges: boolean;
  canManageCms: boolean;
  canManageModeration: boolean;
  canAccessAdminPanel: boolean;
}> = {
  SUPER_ADMIN: {
    canModerateQr: true,
    canManagePlans: true,
    canViewPlatformStats: true,
    canAuditChanges: true,
    canManageCms: true,
    canManageModeration: true,
    canAccessAdminPanel: true,
  },
  MODERATOR: {
    canModerateQr: true,
    canManagePlans: false,
    canViewPlatformStats: true,
    canAuditChanges: false,
    canManageCms: false,
    canManageModeration: true,
    canAccessAdminPanel: true,
  },
  AUDITOR: {
    canModerateQr: false,
    canManagePlans: false,
    canViewPlatformStats: true,
    canAuditChanges: true,
    canManageCms: false,
    canManageModeration: false,
    canAccessAdminPanel: true,
  },
};

export function canModerateQr(role: AdminRole): boolean {
  return adminPermissions[role].canModerateQr;
}

export function canManagePlans(role: AdminRole): boolean {
  return adminPermissions[role].canManagePlans;
}

export function canViewPlatformStats(role: AdminRole): boolean {
  return adminPermissions[role].canViewPlatformStats;
}

export function canAuditChanges(role: AdminRole): boolean {
  return adminPermissions[role].canAuditChanges;
}

export function canManageCms(role: AdminRole): boolean {
  return adminPermissions[role].canManageCms;
}

export function canManageModeration(role: AdminRole): boolean {
  return adminPermissions[role].canManageModeration;
}

export function canAccessAdminPanel(role: AdminRole): boolean {
  return adminPermissions[role].canAccessAdminPanel;
}

export function getAdminNavigation(role: AdminRole): Array<{ label: string; href: string; requires: "all" | "moderation" | "plans" | "cms" }> {
  const base: Array<{ label: string; href: string; requires: "all" | "moderation" | "plans" | "cms" }> = [{ label: "Overview", href: "/admin", requires: "all" }];

  if (canViewPlatformStats(role)) {
    base.push({ label: "Platform stats", href: "/admin/stats", requires: "all" });
  }

  if (canManageModeration(role)) {
    base.push({ label: "Moderation", href: "/admin/moderation", requires: "moderation" });
  }

  if (canManagePlans(role)) {
    base.push({ label: "Pricing", href: "/admin/pricing", requires: "plans" });
  }

  if (canManageCms(role)) {
    base.push({ label: "CMS", href: "/admin/cms", requires: "cms" });
  }

  return base;
}
