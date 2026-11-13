import type { Metadata } from "next";
import { headers } from "next/headers";
import { buildPageMetadata, buildOrganizationJsonLd, renderJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Loopmark",
  description: "Learn how Loopmark helps individuals and teams turn real-world moments into useful, trackable QR code experiences.",
  path: "/about",
  keywords: ["QR code platform", "product story", "marketing", "digital connection"],
});

const principles = [
  ["Make the next step clear", "Give every scan a useful, understandable destination."],
  ["Keep printed assets useful", "Use an editable destination when details may change after printing."],
  ["Build for real conditions", "Check readability across print sizes, lighting, and devices."],
];

export default async function AboutPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(buildOrganizationJsonLd()) }} />
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">About us</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#173a32] sm:text-5xl">We make scans feel useful.</h1>
          <p className="mt-5 text-lg leading-8 text-[#60796e]">
            Loopmark is built for the moments when a person scans something in the real world and expects an immediate, trustworthy next step.
            We help people and teams make that moment easier to navigate, track, and improve over time.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {principles.map(([title, description]) => (
            <article key={title} className="rounded-3xl border border-[#e3e9de] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#173a32]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#60796e]">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="rounded-[2rem] border border-[#e3e9de] bg-[#f7f8f2] p-8">
            <h2 className="text-2xl font-semibold text-[#173a32]">A QR code should make the next step obvious.</h2>
            <p className="mt-4 leading-7 text-[#60796e]">
              From a menu on a table to a product page in a store, we believe the best QR experiences are simple, readable, and built to survive real conditions: print quality, lighting, size, and device variation.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#425d52]">
              <li>• Clear destinations and strong content labels</li>
              <li>• Built for print, packaging, and event signage</li>
              <li>• Designed to be editable when the moment changes</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-[#e3e9de] bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#759078]">Principles</p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="font-semibold text-[#173a32]">Useful by default</p>
                <p className="mt-1 text-sm text-[#60796e]">We design for a clear next action, not just a pattern on a label.</p>
              </div>
              <div>
                <p className="font-semibold text-[#173a32]">Safe by design</p>
                <p className="mt-1 text-sm text-[#60796e]">Redirects, links, and hosted content are validated before they reach a scan.</p>
              </div>
              <div>
                <p className="font-semibold text-[#173a32]">Human-first</p>
                <p className="mt-1 text-sm text-[#60796e]">Whether shipping to a customer or handing a card to a guest, the experience stays clear and calm.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
