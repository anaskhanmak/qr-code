import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { canViewAnalytics } from "@/lib/workspace-access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Form responses", robots: { index: false } };

export default async function FormResponsesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspace = await db.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      members: {
        where: { userId: session.user.id },
        take: 1,
        select: { role: true },
      },
    },
  });
  if (!workspace || !canViewAnalytics(workspace.members[0]?.role ?? "EDITOR")) redirect("/dashboard");

  const responses = await db.qRFormResponse.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      kind: true,
      name: true,
      email: true,
      rating: true,
      message: true,
      createdAt: true,
      qrCode: { select: { name: true, slug: true } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">{workspace.name}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.05em]">Form responses</h1>
          <p className="mt-2 text-sm leading-6 text-[#71877c]">Recent lead enquiries and feedback submitted through your QR pages.</p>
        </div>
        <a href="/api/workspace/forms/export" className="focus-ring rounded-xl border border-[#dce4d9] bg-white px-4 py-3 text-sm font-semibold text-[#173a32]">Export last 90 days (CSV)</a>
      </div>
      {responses.length ? (
        <div className="mt-8 space-y-4">
          {responses.map((response) => (
            <article key={response.id} className="rounded-2xl border border-[#e3e9de] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#759078]">{response.kind === "FEEDBACK" ? "Feedback" : "Lead"} · {response.qrCode.name}</p>
                  <p className="mt-2 font-semibold">{response.name ?? response.email ?? "Anonymous visitor"}</p>
                  {response.email && <a className="focus-ring mt-1 inline-block rounded text-sm text-[#315947] underline underline-offset-4" href={`mailto:${response.email}`}>{response.email}</a>}
                </div>
                <div className="text-right">
                  {response.rating !== null && <p className="font-bold text-[#557b52]">{response.rating}/5</p>}
                  <time className="mt-1 block text-xs text-[#81948a]" dateTime={response.createdAt.toISOString()}>{response.createdAt.toLocaleString()}</time>
                </div>
              </div>
              {response.message && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#60796e]">{response.message}</p>}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[#cbd8c8] p-10 text-center text-sm text-[#71877c]">No form responses yet.</div>
      )}
    </main>
  );
}
