"use client";

import { useActionState } from "react";
import {
  bulkManageQrAction,
  createQrFolderAction,
  deleteQrFolderAction,
  renameQrFolderAction,
} from "@/app/actions/qr-management-actions";

type FolderOption = { id: string; name: string };
type ActionState = { error?: string; success?: string };
const initialState: ActionState = {};

export function QRBulkCheckbox({ qrId }: { qrId: string }) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-[#315947]">
      <input
        type="checkbox"
        name="qrIds"
        value={qrId}
        form="qr-bulk-action"
        className="size-4 accent-[#173a32]"
      />
      Select
    </label>
  );
}

export function QRBulkManagement({ folders, workspaceId }: { folders: FolderOption[]; workspaceId: string }) {
  const [bulkState, bulkAction, isApplying] = useActionState(bulkManageQrAction, initialState);
  const [folderState, folderAction, isCreatingFolder] = useActionState(createQrFolderAction, initialState);

  return (
    <div className="mb-5 grid gap-4 rounded-2xl border border-[#e3e9de] bg-white p-4 sm:grid-cols-2">
      <form
        id="qr-bulk-action"
        action={bulkAction}
        onSubmit={(event) => {
          const operation = new FormData(event.currentTarget).get("operation");
          if (operation === "delete" && !window.confirm("Delete the selected QR codes? This cannot be undone.")) {
            event.preventDefault();
          }
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <label className="text-xs font-semibold text-[#315947]">
          Bulk action
          <select name="operation" className="focus-ring mt-1 block rounded-lg border border-[#dce4d9] bg-white px-3 py-2 text-sm font-normal text-[#173a32]">
            <option value="pause">Pause</option>
            <option value="resume">Resume</option>
            <option value="move">Move to folder</option>
            <option value="delete">Delete</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[#315947]">
          Folder
          <select name="folderId" className="focus-ring mt-1 block max-w-48 rounded-lg border border-[#dce4d9] bg-white px-3 py-2 text-sm font-normal text-[#173a32]">
            <option value="unfiled">Unfiled</option>
            {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </label>
        <button disabled={isApplying} className="focus-ring rounded-lg bg-[#173a32] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {isApplying ? "Applying..." : "Apply to selected"}
        </button>
        {(bulkState.error || bulkState.success) && (
          <p role={bulkState.error ? "alert" : "status"} className={`basis-full text-xs ${bulkState.error ? "text-red-700" : "text-emerald-800"}`}>
            {bulkState.error ?? bulkState.success}
          </p>
        )}
      </form>

      <form action={folderAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <label className="min-w-36 flex-1 text-xs font-semibold text-[#315947]">
          New folder
          <input name="name" required maxLength={50} placeholder="e.g. Summer campaign" className="focus-ring mt-1 block w-full rounded-lg border border-[#dce4d9] px-3 py-2 text-sm font-normal text-[#173a32]" />
        </label>
        <button disabled={isCreatingFolder} className="focus-ring rounded-lg border border-[#dce4d9] px-4 py-2 text-sm font-semibold text-[#173a32] disabled:opacity-60">
          {isCreatingFolder ? "Creating..." : "Create folder"}
        </button>
        {(folderState.error || folderState.success) && (
          <p role={folderState.error ? "alert" : "status"} className={`basis-full text-xs ${folderState.error ? "text-red-700" : "text-emerald-800"}`}>
            {folderState.error ?? folderState.success}
          </p>
        )}
      </form>

      {folders.length > 0 && (
        <details className="sm:col-span-2">
          <summary className="focus-ring w-fit cursor-pointer text-sm font-semibold text-[#315947]">Manage folders ({folders.length})</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {folders.map((folder) => (
              <QRFolderControls key={folder.id} folder={folder} workspaceId={workspaceId} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function QRFolderControls({ folder, workspaceId }: { folder: FolderOption; workspaceId: string }) {
  const [renameState, renameAction, isRenaming] = useActionState(renameQrFolderAction, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteQrFolderAction, initialState);

  return (
    <div className="rounded-xl border border-[#edf0eb] p-3">
      <form action={renameAction} className="flex gap-2">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="folderId" value={folder.id} />
        <label className="sr-only" htmlFor={`folder-${folder.id}`}>Rename {folder.name}</label>
        <input id={`folder-${folder.id}`} name="name" required maxLength={50} defaultValue={folder.name} className="focus-ring min-w-0 flex-1 rounded-lg border border-[#dce4d9] px-3 py-2 text-sm text-[#173a32]" />
        <button disabled={isRenaming} className="focus-ring rounded-lg border border-[#dce4d9] px-3 py-2 text-xs font-semibold text-[#315947] disabled:opacity-60">
          {isRenaming ? "Saving..." : "Rename"}
        </button>
      </form>
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm(`Delete "${folder.name}"? Its QR codes will become unfiled.`)) event.preventDefault();
        }}
        className="mt-2"
      >
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="folderId" value={folder.id} />
        <button disabled={isDeleting} className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-red-700 disabled:opacity-60">
          {isDeleting ? "Deleting..." : "Delete folder"}
        </button>
      </form>
      {(renameState.error || deleteState.error) && <p role="alert" className="mt-2 text-xs text-red-700">{renameState.error ?? deleteState.error}</p>}
      {(renameState.success || deleteState.success) && <p role="status" className="mt-2 text-xs text-emerald-800">{renameState.success ?? deleteState.success}</p>}
    </div>
  );
}
