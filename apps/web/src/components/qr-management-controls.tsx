"use client";

import { useActionState } from "react";
import { deleteQrAction, duplicateQrAction } from "@/app/actions/qr-management-actions";

const initialState: { error?: string; success?: string } = {};

export function QRManagementControls({ qrId }: { qrId: string }) {
  const [duplicateState, duplicateAction, duplicating] = useActionState(duplicateQrAction, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteQrAction, initialState);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <form action={duplicateAction}>
        <input type="hidden" name="qrId" value={qrId} />
        <button disabled={duplicating} className="focus-ring rounded-lg border border-[#dce4d9] px-3 py-2 text-xs font-semibold text-[#315947] disabled:opacity-60">
          {duplicating ? "Duplicating..." : "Duplicate"}
        </button>
      </form>
      <form action={deleteAction} onSubmit={(event) => {
        if (!window.confirm("Delete this QR code? This cannot be undone.")) event.preventDefault();
      }}>
        <input type="hidden" name="qrId" value={qrId} />
        <button disabled={deleting} className="focus-ring rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60">
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </form>
      {(duplicateState.error || deleteState.error) && <p role="alert" className="basis-full text-xs text-red-700">{duplicateState.error ?? deleteState.error}</p>}
      {(duplicateState.success || deleteState.success) && <p role="status" className="basis-full text-xs text-emerald-800">{duplicateState.success ?? deleteState.success}</p>}
    </div>
  );
}
