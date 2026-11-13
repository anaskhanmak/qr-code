export const workspaceRoles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

export const workspaceRolePermissions: Record<WorkspaceRole, {
  canEditQr: boolean;
  canManageMembers: boolean;
  canViewAnalytics: boolean;
  canManageBilling: boolean;
}> = {
  OWNER: {
    canEditQr: true,
    canManageMembers: true,
    canViewAnalytics: true,
    canManageBilling: true,
  },
  ADMIN: {
    canEditQr: true,
    canManageMembers: true,
    canViewAnalytics: true,
    canManageBilling: false,
  },
  EDITOR: {
    canEditQr: true,
    canManageMembers: false,
    canViewAnalytics: false,
    canManageBilling: false,
  },
  VIEWER: {
    canEditQr: false,
    canManageMembers: false,
    canViewAnalytics: true,
    canManageBilling: false,
  },
};

export function canEditQr(role: WorkspaceRole): boolean {
  return workspaceRolePermissions[role].canEditQr;
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return workspaceRolePermissions[role].canManageMembers;
}

export function canViewAnalytics(role: WorkspaceRole): boolean {
  return workspaceRolePermissions[role].canViewAnalytics;
}

export function canManageBilling(role: WorkspaceRole): boolean {
  return workspaceRolePermissions[role].canManageBilling;
}
