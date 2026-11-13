import type { Metadata } from "next";
import Link from "next/link";
import { AccountForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; next?: string }>;
}) {
  const { verified, next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 py-12 sm:py-20">
      <div className="rounded-3xl border border-[#e3e9de] bg-white p-6 shadow-[0_25px_70px_-45px_#385b48] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Welcome back</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Sign in to Loopmark</h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-[#71877c]">Your workspace is ready when you are.</p>
        <AccountForm
          mode="login"
          verified={verified}
          returnTo={next}
          googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
        />
        <p className="mt-7 text-center text-xs leading-5 text-[#84968d]">
          New to Loopmark?           <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="focus-ring rounded font-semibold text-[#315947] underline underline-offset-4">Create a free account</Link>
        </p>
      </div>
    </div>
  );
}
