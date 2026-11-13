"use client";

import { useActionState } from "react";
import { createWorkspaceInvitationAction } from "@/app/actions/workspace-invitation-actions";
import type { FormState } from "@/app/actions/auth-actions";

const initialState: FormState = {};

export function WorkspaceInvitationForm({ workspaceId }: { workspaceId: string }) {
  const [state, action, pending] = useActionState(createWorkspaceInvitationAction, initialState);

  return (
    <form action={action} className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_auto]">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label className="grid gap-2 text-sm font-semibold text-[#315947]">
        Teammate email
        <input required type="email" name="email" maxLength={320} autoComplete="email" className="focus-ring rounded-xl border border-[#dce4d9] bg-white px-4 py-3 font-normal text-[#18342d]" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[#315947]">
        Role
        <select name="role" defaultValue="EDITOR" className="focus-ring rounded-xl border border-[#dce4d9] bg-white px-4 py-3 font-normal text-[#18342d]">
          <option value="ADMIN">Admin</option>
          <option value="EDITOR">Editor</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </label>
      <button disabled={pending} className="focus-ring self-end rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Sending..." : "Send invite"}
      </button>
      {state.error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-emerald-800 sm:col-span-3">{state.success}</p>}
    </form>
  );
}
