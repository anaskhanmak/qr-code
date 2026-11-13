import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

const productTypes = [
  ["Websites", "Take someone to a page, portfolio, or product."],
  ["Wi-Fi", "Let a guest join your network without typing a password."],
  ["Contact cards", "Share a ready-to-save contact card in one scan."],
  ["More ways", "Share a note, location, email, phone number, or SMS."],
];

export default async function HomePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Loopmark",
            url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
            description: "QR codes that make a clear connection from print to digital.",
          }),
        }}
      />
      <section className="relative overflow-hidden">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dce7d4] bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#567268]">
              <span className="size-2 rounded-full bg-[#a1d957]" />
              A little link with a long life
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-[#173a32] sm:text-6xl lg:text-7xl">
              Make a mark.
              <br />
              <span className="text-[#718c6d]">Keep the moment moving.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#60796e]">
              Put a thoughtful, useful connection on a label, menu, or card. Start with a free QR code that works wherever it goes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/free-qr-codes" className="focus-ring rounded-xl bg-[#173a32] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#173a32]/10 transition hover:-translate-y-0.5 hover:bg-[#275749]">
                Create your first QR — free
              </Link>
              <Link href="/dynamic-qr-codes" className="focus-ring rounded-xl border border-[#dce7d4] bg-white/80 px-5 py-4 text-sm font-bold text-[#3d5e51] hover:bg-white">
                Make an editable QR
              </Link>
              <Link href="#how-it-works" className="focus-ring rounded-xl px-5 py-4 text-sm font-bold text-[#3d5e51] hover:bg-white/70">
                See how it works <span aria-hidden>↓</span>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-[#789087]">
              <span className="flex -space-x-2" aria-hidden>
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#f7f8f2] bg-[#d7e8c1] text-xs font-bold text-[#345747]">1</span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#f7f8f2] bg-[#e6d9c6] text-xs font-bold text-[#654e3b]">2</span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#f7f8f2] bg-[#d3e2e8] text-xs font-bold text-[#3d5962]">3</span>
              </span>
              No account needed for static codes
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px]">
            <div aria-hidden className="absolute -left-7 top-16 size-20 rounded-full bg-[#d9e9c8] blur-2xl" />
            <div className="relative rotate-1 rounded-[2rem] border border-white bg-[#edf1e8] p-4 shadow-[0_35px_80px_-40px_#23483677] sm:p-6">
              <div className="rounded-[1.45rem] bg-white p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#87a08d]">Your next connection</p>
                    <p className="mt-1 font-semibold text-[#21463a]">A link with a little more life</p>
                  </div>
                  <span className="rounded-full bg-[#eff6e7] px-3 py-1 text-xs font-semibold text-[#5b7955]">Ready to share</span>
                </div>
                <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl bg-[#f7f8f2] p-4">
                  <div className="space-y-2">
                    <div className="h-2 w-24 rounded bg-[#c4d6c3]" />
                    <div className="h-2 w-36 rounded bg-[#e0e8dd]" />
                    <div className="h-2 w-28 rounded bg-[#e0e8dd]" />
                  </div>
                  <div className="grid grid-cols-5 gap-1 rounded-lg bg-white p-2" aria-hidden>
                    {Array.from({ length: 25 }, (_, index) => (
                      <span key={index} className={`size-3 rounded-[2px] ${[0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 15, 16, 18, 19, 20, 21, 22, 24].includes(index) ? "bg-[#21463a]" : "bg-[#d5dfd3]"}`} />
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#edf0e9] p-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#c5f277] text-lg text-[#173a32]" aria-hidden>↗</span>
                  <div>
                    <p className="text-sm font-bold text-[#21463a]">A simple scan. A useful next step.</p>
                    <p className="mt-1 text-xs text-[#81948a]">Made to feel like you.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between px-2 text-xs font-medium text-[#71887b]">
                <span>Made for the real world</span>
                <span>loopmark · 01</span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-[#e5ebdf] bg-white px-4 py-3 shadow-lg shadow-[#173a32]/5">
              <p className="text-xs font-bold text-[#3e6550]">Simple to make</p>
              <p className="mt-1 text-xs text-[#81948a]">Ready in a few moments</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Small steps, good connections</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">A QR code should feel like an open door.</h2>
          <p className="mt-4 leading-7 text-[#60796e]">Choose where it leads, make it yours, and share it wherever someone might need that next step.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["01", "Choose what to share", "A website, a useful note, your Wi-Fi, or a contact card."],
            ["02", "Make your code", "Preview it as you go, then download a crisp image."],
            ["03", "Put it to work", "Print it, post it, or add it to the things people already use."],
          ].map(([number, title, copy]) => (
            <article key={number} className="rounded-2xl border border-[#e3e9de] bg-white p-6">
              <span className="text-sm font-bold text-[#8ba36f]">{number}</span>
              <h3 className="mt-7 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#71877c]">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">One small square, many good uses</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">What will you connect?</h2>
            </div>
            <Link href="/free-qr-codes" className="focus-ring w-fit rounded-lg px-2 py-2 text-sm font-bold text-[#3d5e51] underline underline-offset-4">Explore the free generator</Link>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productTypes.map(([title, copy], index) => (
              <article key={title} className="rounded-2xl bg-[#f5f7f1] p-5">
                <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-white text-lg text-[#52745d] shadow-sm">{["↗", "⌁", "▤", "＋"][index]}</span>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#71877c]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col items-start justify-between gap-8 rounded-[2rem] bg-[#173a32] p-7 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#bddc9c]">Your first QR is waiting</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Give someone a good reason to scan.</h2>
          </div>
          <Link href="/free-qr-codes" className="focus-ring shrink-0 rounded-xl bg-[#c5f277] px-6 py-4 text-sm font-bold text-[#173a32] hover:bg-[#b6e865]">Create your first QR — free</Link>
        </div>
      </section>
    </>
  );
}
