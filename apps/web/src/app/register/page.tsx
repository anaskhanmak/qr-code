import type { Metadata } from "next";
import { AccountForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 py-12 sm:py-20">
      <div className="rounded-3xl border border-[#e3e9de] bg-white p-6 shadow-[0_25px_70px_-45px_#385b48] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Start with a good connection</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Create your account</h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-[#71877c]">Your account is free. Email verification is required to sign in.</p>
        <AccountForm
          mode="register"
          returnTo={next}
          googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
        />
      </div>
    </div>
  );
}
