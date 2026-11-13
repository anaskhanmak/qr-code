"use client";

import { useActionState } from "react";
import { submitQrFormResponseAction } from "@/app/actions/qr-form-response-actions";
import type { FormState } from "@/app/actions/auth-actions";

const initialState: FormState = {};
const inputClass = "focus-ring mt-2 w-full rounded-xl border border-[#dce4d9] bg-white px-3.5 py-3 text-sm text-[#173a32]";

export function QrResponseForm({
  slug,
  kind,
  prompt,
}: {
  slug: string;
  kind: "lead" | "feedback";
  prompt?: string;
}) {
  const [state, action, pending] = useActionState(submitQrFormResponseAction, initialState);

  return (
    <form action={action} className="mt-5 space-y-4 text-left">
      <input type="hidden" name="slug" value={slug} />
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto size-px overflow-hidden">
        <label htmlFor={`website-${slug}`}>Leave this field empty</label>
        <input id={`website-${slug}`} tabIndex={-1} autoComplete="off" name="website" />
      </div>
      {kind === "lead" ? (
        <>
          <label className="block text-sm font-semibold text-[#284b40]">
            Your name
            <input name="name" required maxLength={120} autoComplete="name" className={inputClass} />
          </label>
          <label className="block text-sm font-semibold text-[#284b40]">
            Email address
            <input name="email" required type="email" maxLength={320} autoComplete="email" className={inputClass} />
          </label>
          <label className="block text-sm font-semibold text-[#284b40]">
            How can we help?
            <textarea name="message" maxLength={2000} rows={4} className={inputClass} />
          </label>
        </>
      ) : (
        <>
          <fieldset>
            <legend className="text-sm font-semibold text-[#284b40]">{prompt}</legend>
            <div className="mt-2 flex justify-between gap-2" role="radiogroup" aria-label="Rating from 1 to 5">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label key={rating} className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl border border-[#dce4d9] px-2 py-2 text-sm font-semibold text-[#315947]">
                  <input type="radio" name="rating" value={rating} required className="accent-[#315947]" />
                  {rating}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold text-[#284b40]">
            Tell us more
            <textarea name="message" required maxLength={2000} rows={4} className={inputClass} />
          </label>
        </>
      )}
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
      {state.success ? (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{state.success}</p>
      ) : (
        <button disabled={pending} className="focus-ring w-full rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">
          {pending ? "Sending..." : kind === "feedback" ? "Send feedback" : "Send message"}
        </button>
      )}
      <p className="text-xs leading-5 text-[#81948a]">Your response is shared with the workspace that manages this QR code.</p>
    </form>
  );
}
