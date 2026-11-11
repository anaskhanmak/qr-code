import type { Metadata } from "next";
import { PasswordResetForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 py-12 sm:py-20">
      <div className="rounded-3xl border border-[#e3e9de] bg-white p-6 shadow-[0_25px_70px_-45px_#385b48] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Account recovery</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Choose a new password</h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-[#71877c]">Your reset link can only be used once and expires after one hour.</p>
        {token ? <PasswordResetForm token={token} /> : <p role="alert" className="text-sm text-red-800">This reset link is missing. Request a new one from the sign-in page.</p>}
      </div>
    </div>
  );
}
