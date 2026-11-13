import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { getAnalyticsSince, getQrScanSummary, parseAnalyticsDays } from "@/lib/scan-analytics";

export const dynamic = "force-dynamic";
export const metadata = { title: "QR analytics", robots: { index: false } };

type DailyCount = { day: Date; total: bigint; unique: bigint };

export default async function QrAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!/^[A-Za-z0-9]{16}$/.test(slug)) notFound();
  const days = parseAnalyticsDays(query.days ?? null);
  if (days === null) notFound();

  const qrCode = await db.qRCode.findFirst({
    where: {
      slug,
      workspace: {
        members: {
          some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN", "VIEWER"] } },
        },
      },
    },
    select: { id: true, name: true },
  });
  if (!qrCode) notFound();

  const since = getAnalyticsSince(days);
  const [summary, dailyCounts, countries, devices, browsers] = await Promise.all([
    getQrScanSummary(qrCode.id, since),
    db.$queryRaw<DailyCount[]>`
      SELECT date_trunc('day', "createdAt") AS day,
             COUNT(*)::bigint AS total,
             COUNT(*) FILTER (WHERE "isUnique" = true)::bigint AS unique
      FROM "QRCodeScan"
      WHERE "qrCodeId" = ${qrCode.id} AND "createdAt" >= ${since}
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY day DESC
      LIMIT 365
    `,
    db.qRCodeScan.groupBy({
      by: ["country"],
      where: { qrCodeId: qrCode.id, classification: "HUMAN", createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
    db.qRCodeScan.groupBy({
      by: ["deviceType"],
      where: { qrCodeId: qrCode.id, classification: "HUMAN", createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { deviceType: "desc" } },
      take: 10,
    }),
    db.qRCodeScan.groupBy({
      by: ["browser"],
      where: { qrCodeId: qrCode.id, classification: "HUMAN", createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { browser: "desc" } },
      take: 10,
    }),
  ]);

  const filterLink = (range: number) => `/dashboard/analytics/${slug}?days=${range}`;
  const selectedClass = "rounded-full border border-[#173a32] bg-[#173a32] px-4 py-2 text-sm font-semibold text-white";
  const unselectedClass = "rounded-full border border-[#dce4d9] bg-white px-4 py-2 text-sm font-semibold text-[#315947]";

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <Link href="/dashboard" className="focus-ring rounded text-sm font-semibold text-[#315947] underline underline-offset-4">Back to dashboard</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">QR analytics</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{qrCode.name}</h1>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Analytics date range" className="flex flex-wrap gap-2">
          {[7, 30, 90, 365].map((range) => (
            <Link key={range} href={filterLink(range)} aria-current={days === range ? "page" : undefined} className={days === range ? selectedClass : unselectedClass}>
              {range} days
            </Link>
          ))}
        </nav>
        <a href={`/api/qr/${slug}/analytics/export?days=${days}`} className="focus-ring rounded-xl border border-[#dce4d9] bg-white px-4 py-3 text-sm font-semibold text-[#173a32]">
          Export CSV
        </a>
      </div>
      <section aria-label="Scan totals" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total scans", summary.total],
          ["Human scans", summary.byClassification.human],
          ["Unique estimates", summary.unique],
          ["Bots and previews", summary.byClassification.bot + summary.byClassification.preview],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-[#e3e9de] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#759078]">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
          </article>
        ))}
      </section>
      <section className="mt-7 grid gap-6 lg:grid-cols-2">
        <AnalyticsBreakdown title="Daily scans" rows={dailyCounts.map((row) => [row.day.toLocaleDateString(), Number(row.total), Number(row.unique)])} headers={["Date", "Scans", "Unique"]} />
        <AnalyticsBreakdown title="Countries" rows={countries.map((row) => [row.country ?? "Unknown", row._count._all])} headers={["Country", "Human scans"]} />
        <AnalyticsBreakdown title="Devices" rows={devices.map((row) => [row.deviceType ?? "Unknown", row._count._all])} headers={["Device", "Human scans"]} />
        <AnalyticsBreakdown title="Browsers" rows={browsers.map((row) => [row.browser ?? "Unknown", row._count._all])} headers={["Browser", "Human scans"]} />
      </section>
      <p className="mt-6 text-xs leading-5 text-[#71877c]">
        Unique values are estimates based on a keyed, rotating-independent IP hash and the first human scan recorded within a 24-hour window. They are not person-level visitor counts.
      </p>
    </main>
  );
}

function AnalyticsBreakdown({
  title,
  rows,
  headers,
}: {
  title: string;
  rows: (string | number)[][];
  headers: string[];
}) {
  return (
    <section className="rounded-2xl border border-[#e3e9de] bg-white p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e3e9de] text-xs uppercase tracking-wide text-[#71877c]">
                {headers.map((header) => <th key={header} className="pb-2 pr-4 font-semibold">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row[0]}-${index}`} className="border-b border-[#f0f3ed] last:border-0">
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="py-2.5 pr-4">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="mt-4 text-sm text-[#71877c]">No scan data in this period.</p>}
    </section>
  );
}
