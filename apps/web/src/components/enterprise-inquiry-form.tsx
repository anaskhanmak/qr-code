"use client";

import { useActionState } from "react";
import { submitEnterpriseInquiryAction } from "@/app/actions/enterprise-actions";

const fieldClass = "focus-ring mt-2 w-full rounded-xl border border-[#dce7d4] bg-[#f8faf7] px-3 py-3 text-sm";

export function EnterpriseInquiryForm() {
  const [state, formAction, pending] = useActionState(submitEnterpriseInquiryAction, {});

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-[#173a32]">
        Name
        <input name="name" autoComplete="name" required maxLength={100} className={fieldClass} placeholder="Your name" />
      </label>
      <label className="block text-sm font-medium text-[#173a32]">
        Work email
        <input name="email" type="email" autoComplete="email" required maxLength={320} className={fieldClass} placeholder="name@company.com" />
      </label>
      <label className="block text-sm font-medium text-[#173a32]">
        Company <span className="font-normal text-[#81948a]">(optional)</span>
        <input name="company" autoComplete="organization" maxLength={120} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium text-[#173a32]">
        Use case
        <textarea name="message" required minLength={20} maxLength={5000} className={`${fieldClass} min-h-[120px]`} placeholder="Tell us about your QR workflow, scale, and support needs." />
      </label>
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.error || state.success ? (
        <p role={state.error ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${state.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}>
          {state.error ?? state.success}
        </p>
      ) : null}
      <button disabled={pending} className="focus-ring inline-flex rounded-xl bg-[#173a32] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Sending..." : "Send inquiry"}
      </button>
    </form>
  );
}
