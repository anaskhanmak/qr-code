import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { db } from "@loopmark/db";
import { getShortUrl, parseDynamicContent } from "@/lib/dynamic-qr";

export const metadata = { title: "Your workspace", robots: { index: false } };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; cacheRefresh?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { created, updated, cacheRefresh } = await searchParams;
  const workspace = await db.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    select: {
      id: true,
      name: true,
      qrCodes: {
        where: { kind: "DYNAMIC" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, name: true, slug: true, status: true, content: true, createdAt: true },
      },
    },
  });

  return (
    <div className="mx-auto min-h-[65vh] max-w-7xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">{workspace?.name ?? "Your workspace"}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Good to have you, {session.user.name ?? "there"}.</h1>
          <p className="mt-3 text-[#60796e]">Your Loopmark space is ready. Make a free static code now.</p>
        </div>
        <form action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}>
          <button className="focus-ring rounded-xl border border-[#dce4d9] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f8faf6]">Sign out</button>
        </form>
      </div>
      <section className="mt-12 rounded-3xl border border-[#e3e9de] bg-white p-7 sm:p-10">
        {created && <p role="status" className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Your dynamic QR code is saved and ready to share.</p>}
        {updated && <p role="status" className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Your QR content is updated. Its short link has not changed.</p>}
        {updated && cacheRefresh && <p role="status" className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">The short-link edge cache could not be cleared immediately. Some scans may show the previous destination briefly.</p>}
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#eff6e7] text-xl text-[#50744d]" aria-hidden>⌁</div>
        <h2 className="mt-5 text-xl font-bold">Your QR codes</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#71877c]">Dynamic links stay editable after you print. Your saved QR codes will be here.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dynamic-qr-codes" className="focus-ring inline-flex rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">Create a dynamic QR</Link>
          <Link href="/free-qr-codes" className="focus-ring inline-flex rounded-xl border border-[#dce4d9] bg-white px-5 py-3.5 text-sm font-bold text-[#173a32] hover:bg-[#f8faf6]">Make a free static QR</Link>
        </div>
      </section>
      <section className="mt-8">
        {workspace?.qrCodes.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspace.qrCodes.map((qrCode) => {
              const content = parseDynamicContent(qrCode.content);
              const isExpired = qrCode.status === "EXPIRED";
              return (
                <article key={qrCode.id} className="rounded-2xl border border-[#e3e9de] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#759078]">{content ? content.type.replaceAll("_", " ") : "Dynamic QR"}</p>
                      <h3 className="mt-2 font-bold">{qrCode.name}</h3>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isExpired ? "bg-amber-50 text-amber-800" : qrCode.status === "PAUSED" ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-800"}`}>
                      {isExpired ? "Expired" : qrCode.status === "PAUSED" ? "Paused" : "Active"}
                    </span>
                  </div>
                  <p className="mt-3 break-all text-xs text-[#71877c]">{qrCode.slug ? getShortUrl(qrCode.slug) : "Short link unavailable"}</p>
                  <p className="mt-3 text-xs text-[#9aa89e]">Created {qrCode.createdAt.toLocaleDateString()}</p>
                  {qrCode.slug && (
                    <div className="mt-4 flex flex-wrap gap-4">
                      <Link href={getShortUrl(qrCode.slug)} target="_blank" rel="noreferrer" className="focus-ring rounded text-sm font-semibold text-[#315947] underline underline-offset-4">Open QR link</Link>
                      <Link href={`/dynamic-qr-codes?edit=${encodeURIComponent(qrCode.id)}`} className="focus-ring rounded text-sm font-semibold text-[#315947] underline underline-offset-4">Edit content</Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cbd8c8] p-8 text-center text-sm text-[#71877c]">
            No saved dynamic codes yet. Create one to get started.
          </div>
        )}
      </section>
    </div>
  );
}
