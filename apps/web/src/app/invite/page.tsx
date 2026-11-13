import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@loopmark/db";
import { AcceptWorkspaceInvitationForm } from "@/components/accept-workspace-invitation-form";
import { hashWorkspaceInvitationToken, isWorkspaceInvitationToken } from "@/lib/workspace-invitations";

export const metadata = { title: "Accept workspace invitation", robots: { index: false, follow: false } };

export default async function WorkspaceInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token || !isWorkspaceInvitationToken(token)) notFound();

  const invitation = await db.workspaceInvitation.findUnique({
    where: { token: hashWorkspaceInvitationToken(token) },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      workspace: { select: { name: true } },
    },
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    const returnTo = `/invite?token=${encodeURIComponent(token)}`;
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });
  if (!user?.emailVerified) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <section className="rounded-3xl border border-[#e3e9de] bg-white p-8">
          <h1 className="text-2xl font-semibold">Verify your email first</h1>
          <p className="mt-3 text-sm leading-6 text-[#71877c]">Verify your account email before accepting this workspace invitation.</p>
          <Link href="/dashboard" className="focus-ring mt-6 inline-flex rounded-xl bg-[#173a32] px-5 py-3 text-sm font-bold text-white">Go to dashboard</Link>
        </section>
      </main>
    );
  }
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <section className="rounded-3xl border border-[#e3e9de] bg-white p-8">
          <h1 className="text-2xl font-semibold">Use the invited email address</h1>
          <p className="mt-3 text-sm leading-6 text-[#71877c]">This invitation was sent to {invitation.email}. Sign in with that verified email to join.</p>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: `/invite?token=${encodeURIComponent(token)}` });
          }} className="mt-6">
            <button className="focus-ring rounded-xl border border-[#dce4d9] px-5 py-3 text-sm font-bold text-[#173a32]">Sign out and switch accounts</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <section className="rounded-3xl border border-[#e3e9de] bg-white p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Workspace invitation</p>
        <h1 className="mt-3 text-3xl font-semibold">Join {invitation.workspace.name}</h1>
        <p className="mt-3 text-sm leading-6 text-[#71877c]">You will join as a {invitation.role.toLowerCase()}. This invitation expires {invitation.expiresAt.toLocaleDateString()}.</p>
        <AcceptWorkspaceInvitationForm token={token} />
      </section>
    </main>
  );
}
