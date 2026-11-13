"use client";

import { useActionState } from "react";
import {
  createWorkspaceApiKeyAction,
  revokeWorkspaceApiKeyAction,
  type ApiKeyActionState,
} from "@/app/actions/workspace-api-key-actions";

const initialState: ApiKeyActionState = {};
const scopeOptions = [
  ["QR_READ", "Read QR codes"],
  ["QR_WRITE", "Create QR codes"],
  ["ANALYTICS_READ", "Read analytics"],
  ["WORKSPACE_READ", "Read workspace"],
  ["WORKSPACE_WRITE", "Manage workspace"],
  ["WEBHOOKS_WRITE", "Manage webhooks"],
] as const;

export function CreateWorkspaceApiKeyForm({ workspaceId }: { workspaceId: string }) {
  const [state, action, pending] = useActionState(createWorkspaceApiKeyAction, initialState);
  return (
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label className="block text-sm font-semibold text-[#315947]">
        Key name
        <input required name="name" maxLength={80} placeholder="Production integration" className="focus-ring mt-2 w-full rounded-xl border border-[#dce4d9] px-4 py-3 text-sm font-normal text-[#173a32]" />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold text-[#315947]">Permissions</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {scopeOptions.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 rounded-xl border border-[#e3e9de] p-3 text-sm text-[#60796e]">
              <input type="checkbox" name="scopes" value={value} className="accent-[#315947]" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-semibold text-[#315947]">
        Expiry
        <select name="expiresInDays" defaultValue="90" className="focus-ring mt-2 w-full rounded-xl border border-[#dce4d9] bg-white px-4 py-3 text-sm font-normal text-[#173a32]">
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
          <option value="never">Never (rotate manually)</option>
        </select>
      </label>
      {state.secret && <div role="status" className="break-all rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">{state.success}</p><code className="mt-2 block select-all">{state.secret}</code></div>}
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="focus-ring rounded-xl bg-[#173a32] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{pending ? "Creating..." : "Create API key"}</button>
    </form>
  );
}

export function RevokeWorkspaceApiKeyForm({
  workspaceId,
  apiKeyId,
}: {
  workspaceId: string;
  apiKeyId: string;
}) {
  const [state, action, pending] = useActionState(revokeWorkspaceApiKeyAction, initialState);
  return (
    <form action={action}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="apiKeyId" value={apiKeyId} />
      <button disabled={pending} className="focus-ring rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60">{pending ? "Revoking..." : "Revoke"}</button>
      {state.error && <p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="mt-2 text-xs text-emerald-800">{state.success}</p>}
    </form>
  );
}
