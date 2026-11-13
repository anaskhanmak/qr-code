import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { buildPageMetadata, buildFaqJsonLd, buildWebsiteJsonLd, renderJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Loopmark blog",
  description: "Learn how QR codes can support menus, events, products, signage, and modern customer journeys.",
  path: "/blog",
  keywords: ["blog", "QR best practices", "marketing", "customer journey"],
});

const posts = [
  {
    slug: "qr-codes-that-feel-like-a-better-landing-page",
    title: "QR codes that feel like a better landing page",
    excerpt: "A practical look at making your scan experience clear, quick, and useful for real-world customer journeys.",
  },
  {
    slug: "when-to-use-a-static-vs-dynamic-code",
    title: "When to use a static vs dynamic code",
    excerpt: "Understand when a fixed destination is enough and when editability matters for real-world deployments.",
  },
  {
    slug: "building-a-qr-journey-for-events-and-packaging",
    title: "Building a QR journey for events and packaging",
    excerpt: "Designing a product or event flow that feels intentional from the label to the final destination.",
  },
];

const faqs = [
  {
    question: "Do I need an account for a free QR code?",
    answer: "No. Static QR codes can be generated without an account, while dynamic QR features usually require an authenticated workspace.",
  },
  {
    question: "Can I update a QR after printing it?",
    answer: "Yes, when using a dynamic QR code. The printed code stays the same and the destination can be updated later.",
  },
];

export default async function BlogPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(buildWebsiteJsonLd()) }} />
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(buildFaqJsonLd(faqs)) }} />
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Blog</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#173a32] sm:text-5xl">Ideas for better scanned moments.</h1>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-[2rem] border border-[#e3e9de] bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#759078]">Guide</p>
              <h2 className="mt-4 text-xl font-semibold text-[#173a32]">{post.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#60796e]">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex text-sm font-bold text-[#173a32]">Read article →</Link>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
