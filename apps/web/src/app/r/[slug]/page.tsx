import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@loopmark/db";
import { parseDynamicContent } from "@/lib/dynamic-qr";
import { QrResponseForm } from "@/components/qr-response-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shared with Loopmark",
    robots: { index: false, follow: false },
  };
}

export default async function DynamicQRPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const qrCode = await db.qRCode.findUnique({
    where: { slug },
    select: {
      kind: true,
      status: true,
      content: true,
      expiresAt: true,
      slug: true,
    },
  });
  if (!qrCode || qrCode.kind !== "DYNAMIC") notFound();

  const isExpired = qrCode.status === "EXPIRED" || Boolean(
    qrCode.expiresAt && qrCode.expiresAt <= new Date(),
  );
  if (isExpired) return <UnavailablePage title="This link has expired" />;
  if (qrCode.status === "PAUSED") return <UnavailablePage title="This link is taking a short break" />;

  const content = parseDynamicContent(qrCode.content);
  if (!content) notFound();
  if (content.type === "url") redirect(content.url);
  if (content.type === "app_store") {
    const userAgent = (await headers()).get("user-agent")?.toLowerCase() ?? "";
    const storeUrl = /iphone|ipad|ipod/.test(userAgent)
      ? content.iosUrl
      : /android/.test(userAgent) && content.androidUrl
        ? content.androidUrl
        : content.fallbackUrl;
    redirect(storeUrl);
  }
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const contactCardUrl = new URL(`/r/${encodeURIComponent(qrCode.slug!)}/contact`, appBaseUrl).toString();

  return (
    <main className="mx-auto flex min-h-[72vh] max-w-lg items-center px-5 py-12">
      <article className="w-full rounded-3xl border border-[#e3e9de] bg-white p-6 text-center shadow-[0_25px_70px_-45px_#385b48] sm:p-9">
        <BrandMark />
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">{content.title}</h1>

        {content.type === "business_card" && (
          <div className="mt-5">
            <p className="text-xl font-semibold text-[#315947]">{content.fullName}</p>
            {(content.role || content.organization) && (
              <p className="mt-1 text-sm text-[#71877c]">
                {[content.role, content.organization].filter(Boolean).join(" · ")}
              </p>
            )}
            {content.bio && <p className="mt-4 text-sm leading-6 text-[#60796e]">{content.bio}</p>}
            <div className="mt-5 space-y-2 text-sm text-[#60796e]">
              {content.email && <p>{content.email}</p>}
              {content.phone && <p>{content.phone}</p>}
              {content.website && (
                <a className="focus-ring break-all font-semibold text-[#315947] underline underline-offset-4" href={content.website} rel="noreferrer">{content.website}</a>
              )}
            </div>
            <a href={contactCardUrl} className="focus-ring mt-7 block rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
              Save contact
            </a>
          </div>
        )}

        {content.type === "pdf" && (
          <div className="mt-5">
            <div aria-hidden className="mx-auto grid size-20 place-items-center rounded-2xl bg-[#eff6e7] text-2xl font-bold text-[#557b52]">PDF</div>
            {content.description && <p className="mt-4 text-sm leading-6 text-[#60796e]">{content.description}</p>}
            <a href={content.pdfUrl} target="_blank" rel="noreferrer" className="focus-ring mt-7 block rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
              View PDF
            </a>
            <p className="mt-3 text-xs text-[#81948a]">The document opens from its original hosting location.</p>
          </div>
        )}

        {content.type === "multiple_links" && (
          <div className="mt-5">
            {content.description && <p className="mb-5 text-sm leading-6 text-[#60796e]">{content.description}</p>}
            <nav aria-label={`${content.title} links`} className="space-y-3">
              {content.links.map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  rel="noreferrer"
                  className="focus-ring block break-words rounded-xl border border-[#dce4d9] bg-[#f7f8f2] px-4 py-3.5 text-sm font-bold text-[#315947] transition hover:bg-[#eff6e7]"
                >
                  {link.label} <span aria-hidden>↗</span>
                </a>
              ))}
            </nav>
          </div>
        )}
        {content.type === "social" && (
          <div className="mt-5">
            {content.description && <p className="mb-5 text-sm leading-6 text-[#60796e]">{content.description}</p>}
            <a href={content.url} target="_blank" rel="noreferrer" className="focus-ring block break-all rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
              Visit {content.platform === "custom" ? "social profile" : content.platform}
            </a>
          </div>
        )}
        {content.type === "coupon" && (
          <div className="mt-5 rounded-2xl border border-dashed border-[#cbd8c8] bg-[#f7f8f2] p-5">
            {content.description && <p className="text-sm leading-6 text-[#60796e]">{content.description}</p>}
            <p className="mt-4 text-2xl font-bold tracking-widest text-[#173a32]">{content.offerCode}</p>
            {content.expiryDate && <p className="mt-2 text-xs text-[#71877c]">Offer ends {content.expiryDate}</p>}
            <a href={content.url} target="_blank" rel="noreferrer" className="focus-ring mt-5 block rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
              Redeem offer
            </a>
          </div>
        )}
        {content.type === "product" && (
          <div className="mt-5">
            {content.badge && <p className="inline-flex rounded-full bg-[#eff6e7] px-3 py-1 text-xs font-bold text-[#557b52]">{content.badge}</p>}
            {content.description && <p className="mt-4 text-sm leading-6 text-[#60796e]">{content.description}</p>}
            {content.price && <p className="mt-4 text-xl font-bold text-[#173a32]">{content.price}</p>}
            <a href={content.url} target="_blank" rel="noreferrer" className="focus-ring mt-5 block rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
              View product
            </a>
          </div>
        )}
        {content.type === "video" && (
          <div className="mt-5">
            {content.description && <p className="mb-5 text-sm leading-6 text-[#60796e]">{content.description}</p>}
            <a href={content.videoUrl} target="_blank" rel="noreferrer" className="focus-ring block rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
              {content.cta}
            </a>
          </div>
        )}
        {content.type === "image_gallery" && (
          <div className="mt-5">
            {content.description && <p className="mb-5 text-sm leading-6 text-[#60796e]">{content.description}</p>}
            <div className="grid grid-cols-2 gap-3">
              {content.images.map((image, index) => (
                <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer" className="focus-ring overflow-hidden rounded-xl border border-[#e3e9de]">
                  <Image unoptimized width={600} height={600} src={image} alt={`${content.title}, image ${index + 1}`} className="aspect-square w-full object-cover" />
                </a>
              ))}
            </div>
            {content.url && content.url !== "https://example.com" && (
              <a href={content.url} target="_blank" rel="noreferrer" className="focus-ring mt-5 block rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
                Learn more
              </a>
            )}
          </div>
        )}
        {content.type === "lead_form" && (
          <div className="mt-5">
            {content.description && <p className="mb-5 text-sm leading-6 text-[#60796e]">{content.description}</p>}
            {content.mode === "capture" ? (
              <QrResponseForm slug={qrCode.slug!} kind="lead" />
            ) : (
              <a href={content.formUrl} target="_blank" rel="noreferrer" className="focus-ring block rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
                {content.buttonLabel}
              </a>
            )}
          </div>
        )}
        {content.type === "feedback" && (
          <div className="mt-5">
            {content.description && <p className="mb-5 text-sm leading-6 text-[#60796e]">{content.description}</p>}
            <QrResponseForm slug={qrCode.slug!} kind="feedback" prompt={content.prompt} />
          </div>
        )}
        {content.type === "event" && (
          <div className="mt-5">
            {content.description && <p className="text-sm leading-6 text-[#60796e]">{content.description}</p>}
            <dl className="mt-5 space-y-3 text-left text-sm">
              <div><dt className="font-semibold text-[#315947]">Starts</dt><dd className="mt-1 text-[#60796e]">{new Date(content.startAt).toLocaleString()}</dd></div>
              <div><dt className="font-semibold text-[#315947]">Ends</dt><dd className="mt-1 text-[#60796e]">{new Date(content.endAt).toLocaleString()}</dd></div>
              {content.location && <div><dt className="font-semibold text-[#315947]">Location</dt><dd className="mt-1 text-[#60796e]">{content.location}</dd></div>}
            </dl>
            <a href={`/r/${encodeURIComponent(qrCode.slug!)}/event.ics`} className="focus-ring mt-6 block rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275749]">
              Add to calendar
            </a>
            {content.eventUrl && <a href={content.eventUrl} target="_blank" rel="noreferrer" className="focus-ring mt-3 block rounded-xl border border-[#dce4d9] px-5 py-3.5 text-sm font-semibold text-[#315947]">Event website</a>}
          </div>
        )}
        <p className="mt-8 text-xs text-[#9aa89e]">Made with <Link href="/" className="font-semibold text-[#60796e] hover:underline">Loopmark</Link></p>
      </article>
    </main>
  );
}

function BrandMark() {
  return <span aria-hidden className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#c5f277] text-xl font-bold text-[#173a32]">L</span>;
}

function UnavailablePage({ title }: { title: string }) {
  return (
    <main className="mx-auto flex min-h-[72vh] max-w-lg items-center px-5 py-12">
      <section className="w-full rounded-3xl border border-[#e3e9de] bg-white p-8 text-center shadow-[0_25px_70px_-45px_#385b48] sm:p-10">
        <BrandMark />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#71877c]">This QR code is not available right now. If you think this is a mistake, check with the person who shared it.</p>
        <p className="mt-7 text-xs text-[#9aa89e]">Loopmark · A little link with a long life</p>
      </section>
    </main>
  );
}
