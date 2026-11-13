import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { WorkspaceInvitationForm } from "@/components/workspace-invitation-form";
import { WorkspaceMemberControls } from "@/components/workspace-member-controls";

export const metadata = { title: "Workspace members", robots: { index: false } };

export default async function WorkspaceTeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspace = await db.workspace.findFirst({
    where: {
      members: {
        some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } },
      },
    },
    select: {
      id: true,
      name: true,
      members: {
        orderBy: { createdAt: "asc" },
        select: { userId: true, role: true, user: { select: { name: true, email: true } } },
      },
      invitations: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: { email: true, role: true, expiresAt: true },
      },
    },
  });
  if (!workspace) notFound();
  const actorRole = workspace.members.find((member) => member.userId === session.user.id)?.role;
  if (actorRole !== "OWNER" && actorRole !== "ADMIN") notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">{workspace.name}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Workspace members</h1>
      <section className="mt-8 rounded-3xl border border-[#e3e9de] bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold">Invite a teammate</h2>
        <p className="mt-2 text-sm leading-6 text-[#71877c]">Invitations expire after seven days. The invited person must verify and use the invited email address.</p>
        <WorkspaceInvitationForm workspaceId={workspace.id} />
      </section>
      <section className="mt-8 rounded-3xl border border-[#e3e9de] bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold">Members</h2>
        <ul className="mt-5 divide-y divide-[#e3e9de]">
          {workspace.members.map((member) => (
            <li key={member.user.email} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">{member.user.name ?? member.user.email}</p>
                {member.user.name && <p className="text-sm text-[#71877c]">{member.user.email}</p>}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-[#eff6e7] px-3 py-1 text-xs font-bold text-[#557b52]">{member.role}</span>
                {member.userId !== session.user.id && (
                  <WorkspaceMemberControls
                    workspaceId={workspace.id}
                    targetUserId={member.userId}
                    role={member.role}
                    actorRole={actorRole}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      {workspace.invitations.length > 0 && (
        <section className="mt-8 rounded-3xl border border-[#e3e9de] bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold">Pending invitations</h2>
          <ul className="mt-5 divide-y divide-[#e3e9de]">
            {workspace.invitations.map((invitation) => (
              <li key={invitation.email} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold">{invitation.email}</p>
                  <p className="text-sm text-[#71877c]">Expires {invitation.expiresAt.toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-[#f7f8f2] px-3 py-1 text-xs font-bold text-[#60796e]">{invitation.role}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
