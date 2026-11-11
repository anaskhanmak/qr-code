"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  googleSignInAction,
  loginAction,
  registerAction,
  resendVerificationAction,
  requestPasswordResetAction,
  resetPasswordAction,
  type FormState,
} from "@/app/actions/auth-actions";

function Feedback({ state }: { state: FormState }) {
  if (!state.error && !state.success) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm ${state.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}
    >
      {state.error ?? state.success}
    </p>
  );
}

const fieldClass = "focus-ring mt-2 w-full rounded-xl border border-[#dce4d9] bg-white px-3.5 py-3 text-sm";

export function AccountForm({
  mode,
  verified,
  googleEnabled,
  returnTo = "/dashboard",
}: {
  mode: "login" | "register";
  verified?: string;
  googleEnabled: boolean;
  returnTo?: string;
}) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <div className="space-y-5">
      {mode === "login" && verified === "success" && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Email verified. Sign in to continue.</p>
      )}
      {mode === "login" && verified === "invalid" && (
        <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">That verification link is invalid or expired. Request a fresh one below.</p>
      )}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="returnTo" value={returnTo} />
        {mode === "register" && (
          <label className="block text-sm font-semibold text-[#284b40]">
            Your name
            <input name="name" autoComplete="name" required maxLength={100} className={fieldClass} />
          </label>
        )}
        <label className="block text-sm font-semibold text-[#284b40]">
          Email address
          <input name="email" type="email" autoComplete="email" required maxLength={320} className={fieldClass} />
        </label>
        <label className="block text-sm font-semibold text-[#284b40]">
          Password
          <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 10 : 1} maxLength={72} className={fieldClass} />
          {mode === "register" && <span className="mt-1 block text-xs font-normal text-[#789087]">Use at least 10 characters.</span>}
        </label>
        <Feedback state={state} />
        <button disabled={pending} className="focus-ring w-full rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749] disabled:opacity-60">
          {pending ? "Please wait..." : mode === "login" ? "Sign in" : "Create free account"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="relative py-1 text-center text-xs text-[#81948a]">
            <span className="relative z-10 bg-[#fbfcf8] px-3">or continue with</span>
            <span className="absolute inset-x-0 top-1/2 border-t border-[#e2e8de]" />
          </div>
          <form action={googleSignInAction}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <button className="focus-ring w-full rounded-xl border border-[#dce4d9] bg-white px-5 py-3 text-sm font-semibold text-[#284b40] hover:bg-[#f8faf6]">
              Continue with Google
            </button>
          </form>
        </>
      )}
      <div className="flex flex-wrap justify-between gap-3 text-sm text-[#60796e]">
        {mode === "login" ? (
          <>
            <Link href="/forgot-password" className="focus-ring rounded underline underline-offset-4">Forgot password?</Link>
            <Link href="/verify-email" className="focus-ring rounded underline underline-offset-4">Resend verification</Link>
          </>
        ) : (
          <span>Already have an account? <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="focus-ring rounded font-semibold text-[#173a32] underline underline-offset-4">Sign in</Link></span>
        )}
      </div>
    </div>
  );
}

export function ResendVerificationForm() {
  const [state, formAction, pending] = useActionState(resendVerificationAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-semibold text-[#284b40]">
        Email address
        <input name="email" type="email" autoComplete="email" required className={fieldClass} />
      </label>
      <Feedback state={state} />
      <button disabled={pending} className="focus-ring w-full rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749] disabled:opacity-60">
        {pending ? "Sending..." : "Send a fresh link"}
      </button>
    </form>
  );
}

export function PasswordResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-semibold text-[#284b40]">
        Email address
        <input name="email" type="email" autoComplete="email" required className={fieldClass} />
      </label>
      <Feedback state={state} />
      <button disabled={pending} className="focus-ring w-full rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749] disabled:opacity-60">
        {pending ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}

export function PasswordResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm font-semibold text-[#284b40]">
        New password
        <input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required className={fieldClass} />
        <span className="mt-1 block text-xs font-normal text-[#789087]">Use 10 or more characters (up to 72 bytes).</span>
      </label>
      <Feedback state={state} />
      {state.success ? (
        <Link href="/login" className="focus-ring block rounded-xl bg-[#173a32] px-5 py-3.5 text-center text-sm font-bold text-white">Go to sign in</Link>
      ) : (
        <button disabled={pending || !token} className="focus-ring w-full rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749] disabled:opacity-60">
          {pending ? "Updating..." : "Update password"}
        </button>
      )}
    </form>
  );
}
