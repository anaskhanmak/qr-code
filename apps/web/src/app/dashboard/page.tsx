import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { db } from "@loopmark/db";
import { getShortUrl, parseDynamicContent } from "@/lib/dynamic-qr";
import { toggleQrFavoriteAction, toggleQrStatusAction } from "@/app/actions/qr-management-actions";
import { canManageMembers, canViewAnalytics } from "@/lib/workspace-access";
import { QRManagementControls } from "@/components/qr-management-controls";

export const metadata = { title: "Your workspace", robots: { index: false } };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    cacheRefresh?: string;
    statusUpdated?: string;
    view?: string;
    q?: string;
    status?: string;
    cursor?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { created, updated, cacheRefresh, statusUpdated, view, q, status, cursor } = await searchParams;
  const showFavorites = view === "favorites";
  const search = q?.trim().slice(0, 100) ?? "";
  const statusFilter = status === "ACTIVE" || status === "PAUSED" || status === "EXPIRED" ? status : undefined;
  const validCursor = cursor && /^[a-zA-Z0-9_-]{1,40}$/.test(cursor) ? cursor : undefined;
  const workspace = await db.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    select: {
      id: true,
      name: true,
      members: {
        where: { userId: session.user.id },
        take: 1,
        select: { role: true },
      },
      qrCodes: {
        where: {
          kind: "DYNAMIC",
          ...(showFavorites ? { favorite: true } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 51,
        ...(validCursor ? { cursor: { id: validCursor }, skip: 1 } : {}),
        select: { id: true, name: true, slug: true, status: true, favorite: true, content: true, createdAt: true },
      },
    },
  });

  const hasMoreCodes = (workspace?.qrCodes.length ?? 0) > 50;
  const displayedQrCodes = workspace?.qrCodes.slice(0, 50) ?? [];
  const showAnalytics = canViewAnalytics(workspace?.members[0]?.role ?? "EDITOR");
  const canInviteMembers = canManageMembers(workspace?.members[0]?.role ?? "EDITOR");
  const qrCodeIds = displayedQrCodes.map((qrCode) => qrCode.id);
  const scanSummary = showAnalytics && qrCodeIds.length
    ? await db.qRCodeScan.groupBy({
        by: ["qrCodeId", "classification"],
        where: { qrCodeId: { in: qrCodeIds } },
        _count: { _all: true },
      })
    : [];

  const scanSummaryByQrCode = new Map<string, { total: number; human: number; bot: number; preview: number }>();
  for (const qrCode of displayedQrCodes) {
    scanSummaryByQrCode.set(qrCode.id, { total: 0, human: 0, bot: 0, preview: 0 });
  }
  for (const item of scanSummary) {
    const current = scanSummaryByQrCode.get(item.qrCodeId) ?? { total: 0, human: 0, bot: 0, preview: 0 };
    current.total += item._count._all;
    if (item.classification === "HUMAN") current.human += item._count._all;
    if (item.classification === "BOT") current.bot += item._count._all;
    if (item.classification === "PREVIEW") current.preview += item._count._all;
    scanSummaryByQrCode.set(item.qrCodeId, current);
  }

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
        {statusUpdated && <p role="status" className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Your QR code status was updated.</p>}
        {!updated && cacheRefresh && <p role="status" className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">The code status changed, but the edge cache could not be cleared. Some scans may reflect its previous status briefly.</p>}
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#eff6e7] text-xl text-[#50744d]" aria-hidden>⌁</div>
        <h2 className="mt-5 text-xl font-bold">Your QR codes</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#71877c]">Dynamic links stay editable after you print. Your saved QR codes will be here.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dynamic-qr-codes" className="focus-ring inline-flex rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">Create a dynamic QR</Link>
          <Link href="/free-qr-codes" className="focus-ring inline-flex rounded-xl border border-[#dce4d9] bg-white px-5 py-3.5 text-sm font-bold text-[#173a32] hover:bg-[#f8faf6]">Make a free static QR</Link>
          {showAnalytics && <Link href="/dashboard/forms" className="focus-ring inline-flex rounded-xl border border-[#dce4d9] bg-white px-5 py-3.5 text-sm font-bold text-[#173a32] hover:bg-[#f8faf6]">View form responses</Link>}
          {canInviteMembers && <Link href="/dashboard/integrations" className="focus-ring inline-flex rounded-xl border border-[#dce4d9] bg-white px-5 py-3.5 text-sm font-bold text-[#173a32] hover:bg-[#f8faf6]">Manage API keys</Link>}
          <a href="/api/account/export" className="focus-ring inline-flex rounded-xl border border-[#dce4d9] bg-white px-5 py-3.5 text-sm font-bold text-[#173a32] hover:bg-[#f8faf6]">Export account data</a>
          {canInviteMembers && <Link href="/dashboard/team" className="focus-ring inline-flex rounded-xl border border-[#dce4d9] bg-white px-5 py-3.5 text-sm font-bold text-[#173a32] hover:bg-[#f8faf6]">Manage workspace members</Link>}
        </div>
      </section>
      <section className="mt-8">
        <nav aria-label="QR code filters" className="mb-5 flex flex-wrap gap-2">
          <Link href="/dashboard" aria-current={!showFavorites ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-semibold ${!showFavorites ? "border-[#173a32] bg-[#173a32] text-white" : "border-[#dce4d9] bg-white text-[#315947]"}`}>All dynamic</Link>
          <Link href="/dashboard?view=favorites" aria-current={showFavorites ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-semibold ${showFavorites ? "border-[#173a32] bg-[#173a32] text-white" : "border-[#dce4d9] bg-white text-[#315947]"}`}>Favourites</Link>
        </nav>
        <form action="/dashboard" className="mb-5 flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1 text-sm font-semibold text-[#315947]">
            Search QR codes
            <input name="q" defaultValue={search} maxLength={100} placeholder="Search by name" className="focus-ring mt-2 w-full rounded-xl border border-[#dce4d9] bg-white px-4 py-3 text-sm font-normal text-[#173a32]" />
          </label>
          <label className="text-sm font-semibold text-[#315947]">
            Status
            <select name="status" defaultValue={statusFilter ?? ""} className="focus-ring mt-2 rounded-xl border border-[#dce4d9] bg-white px-4 py-3 text-sm font-normal text-[#173a32]">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </label>
          {showFavorites && <input type="hidden" name="view" value="favorites" />}
          <button className="focus-ring rounded-xl bg-[#173a32] px-5 py-3 text-sm font-bold text-white">Filter</button>
        </form>
        {displayedQrCodes.length ? (
          <>
            {showAnalytics && (
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[#e3e9de] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#759078]">Total scans</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                    {displayedQrCodes.reduce((sum, qrCode) => sum + (scanSummaryByQrCode.get(qrCode.id)?.total ?? 0), 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e3e9de] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#759078]">Human</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                    {displayedQrCodes.reduce((sum, qrCode) => sum + (scanSummaryByQrCode.get(qrCode.id)?.human ?? 0), 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e3e9de] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#759078]">Bot & preview</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                    {displayedQrCodes.reduce((sum, qrCode) => sum + (scanSummaryByQrCode.get(qrCode.id)?.bot ?? 0) + (scanSummaryByQrCode.get(qrCode.id)?.preview ?? 0), 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e3e9de] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#759078]">Active codes</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                    {displayedQrCodes.filter((qrCode) => qrCode.status === "ACTIVE").length}
                  </p>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedQrCodes.map((qrCode) => {
                const content = parseDynamicContent(qrCode.content);
                const isExpired = qrCode.status === "EXPIRED";
                const summary = scanSummaryByQrCode.get(qrCode.id) ?? { total: 0, human: 0, bot: 0, preview: 0 };
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
                    {showAnalytics && (
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-[#f6f9f5] px-2 py-2">
                          <div className="font-bold text-[#173a32]">{summary.total}</div>
                          <div className="text-[#71877c]">Total</div>
                        </div>
                        <div className="rounded-lg bg-[#f6f9f5] px-2 py-2">
                          <div className="font-bold text-[#173a32]">{summary.human}</div>
                          <div className="text-[#71877c]">Human</div>
                        </div>
                        <div className="rounded-lg bg-[#f6f9f5] px-2 py-2">
                          <div className="font-bold text-[#173a32]">{summary.bot + summary.preview}</div>
                          <div className="text-[#71877c]">Filtered</div>
                        </div>
                      </div>
                    )}
                    {qrCode.slug && (
                      <div className="mt-4 flex flex-wrap gap-4">
                        <Link href={getShortUrl(qrCode.slug)} target="_blank" rel="noreferrer" className="focus-ring rounded text-sm font-semibold text-[#315947] underline underline-offset-4">Open QR link</Link>
                        <Link href={`/dynamic-qr-codes?edit=${encodeURIComponent(qrCode.id)}`} className="focus-ring rounded text-sm font-semibold text-[#315947] underline underline-offset-4">Edit content</Link>
                        {showAnalytics && <Link href={`/dashboard/analytics/${encodeURIComponent(qrCode.slug)}`} className="focus-ring rounded text-sm font-semibold text-[#315947] underline underline-offset-4">Analytics</Link>}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf0eb] pt-4">
                      <form action={toggleQrFavoriteAction}>
                        <input type="hidden" name="qrId" value={qrCode.id} />
                        <button className="focus-ring rounded-lg border border-[#dce4d9] px-3 py-2 text-xs font-semibold text-[#315947]" aria-pressed={qrCode.favorite}>
                          {qrCode.favorite ? "Remove favourite" : "Add favourite"}
                        </button>
                      </form>
                      {qrCode.status !== "EXPIRED" && (
                        <form action={toggleQrStatusAction}>
                          <input type="hidden" name="qrId" value={qrCode.id} />
                          <button className="focus-ring rounded-lg border border-[#dce4d9] px-3 py-2 text-xs font-semibold text-[#315947]">
                            {qrCode.status === "PAUSED" ? "Resume" : "Pause"}
                          </button>
                        </form>
                      )}
                    </div>
                    <QRManagementControls qrId={qrCode.id} />
                  </article>
                );
              })}
            </div>
            {hasMoreCodes && displayedQrCodes.length > 0 && (
              <div className="mt-6 text-center">
                <Link
                  href={`/dashboard?${new URLSearchParams({
                    ...(search ? { q: search } : {}),
                    ...(statusFilter ? { status: statusFilter } : {}),
                    ...(showFavorites ? { view: "favorites" } : {}),
                    cursor: displayedQrCodes[displayedQrCodes.length - 1].id,
                  }).toString()}`}
                  className="focus-ring inline-flex rounded-xl border border-[#dce4d9] bg-white px-5 py-3 text-sm font-semibold text-[#173a32]"
                >
                  Load next 50
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cbd8c8] p-8 text-center text-sm text-[#71877c]">
            {search || statusFilter || showFavorites ? "No dynamic QR codes match these filters." : "No saved dynamic codes yet. Create one to get started."}
          </div>
        )}
      </section>
    </div>
  );
}
