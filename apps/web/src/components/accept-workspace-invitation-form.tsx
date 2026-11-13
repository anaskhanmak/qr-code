"use client";

import Link from "next/link";
import { useActionState } from "react";
import { acceptWorkspaceInvitationAction } from "@/app/actions/workspace-invitation-actions";
import type { FormState } from "@/app/actions/auth-actions";

const initialState: FormState = {};

export function AcceptWorkspaceInvitationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptWorkspaceInvitationAction, initialState);

  return (
    <form action={action} className="mt-7 space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
      {state.success ? (
        <div role="status" className="space-y-4">
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{state.success}</p>
          <Link href="/dashboard" className="focus-ring inline-flex rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white">Go to dashboard</Link>
        </div>
      ) : (
        <button disabled={pending} className="focus-ring rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">
          {pending ? "Joining..." : "Accept invitation"}
        </button>
      )}
    </form>
  );
}
