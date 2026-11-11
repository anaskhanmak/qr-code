import type { Metadata } from "next";
import { PasswordResetRequestForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-12 sm:py-20">
      <div className="rounded-3xl border border-[#e3e9de] bg-white p-6 shadow-[0_25px_70px_-45px_#385b48] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Account recovery</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Forgot your password?</h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-[#71877c]">We will send a one-time reset link if an account matches your email.</p>
        <PasswordResetRequestForm />
      </div>
    </div>
  );
}
