"use client";

import { useActionState } from "react";
import {
  changeWorkspaceMemberRoleAction,
  removeWorkspaceMemberAction,
} from "@/app/actions/workspace-invitation-actions";
import type { FormState } from "@/app/actions/auth-actions";

const initialState: FormState = {};

export function WorkspaceMemberControls({
  workspaceId,
  targetUserId,
  role,
  actorRole,
}: {
  workspaceId: string;
  targetUserId: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
  actorRole: "OWNER" | "ADMIN";
}) {
  const [roleState, changeRole, rolePending] = useActionState(changeWorkspaceMemberRoleAction, initialState);
  const [removeState, removeMember, removePending] = useActionState(removeWorkspaceMemberAction, initialState);
  const canManageTarget = role !== "OWNER" && (actorRole === "OWNER" || role !== "ADMIN");

  if (!canManageTarget) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={changeRole} className="flex items-center gap-2">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="targetUserId" value={targetUserId} />
        <label className="sr-only" htmlFor={`role-${targetUserId}`}>Role</label>
        <select id={`role-${targetUserId}`} name="role" defaultValue={role} className="focus-ring rounded-lg border border-[#dce4d9] bg-white px-2 py-2 text-xs">
          {actorRole === "OWNER" && <option value="ADMIN">Admin</option>}
          <option value="EDITOR">Editor</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <button disabled={rolePending} className="focus-ring rounded-lg border border-[#dce4d9] px-3 py-2 text-xs font-semibold text-[#315947] disabled:opacity-60">
          {rolePending ? "Saving..." : "Update"}
        </button>
      </form>
      <form action={removeMember}>
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="targetUserId" value={targetUserId} />
        <button disabled={removePending} className="focus-ring rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60">
          {removePending ? "Removing..." : "Remove"}
        </button>
      </form>
      {(roleState.error || removeState.error) && <p role="alert" className="basis-full text-xs text-red-700">{roleState.error ?? removeState.error}</p>}
      {(roleState.success || removeState.success) && <p role="status" className="basis-full text-xs text-emerald-800">{roleState.success ?? removeState.success}</p>}
    </div>
  );
}
