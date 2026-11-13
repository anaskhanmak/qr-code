import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";

const posts = {
  "qr-codes-that-feel-like-a-better-landing-page": {
    title: "QR codes that feel like a better landing page",
    description: "Design a QR-powered destination that feels clear, quick, and useful from the moment someone scans it.",
    body: [
      "The best QR experiences feel like a natural extension of the environment around them. A menu, a packaging label, or a product shelf should never ask the user to do more than the moment requires.",
      "Start with a single purpose: a menu, a product, a Wi-Fi login, or a contact exchange. Then trim the friction. Keep the destination fast, readable, and relevant to the place where the scan happens.",
      "Ask yourself whether the destination is still accurate after printing. If the content may change, a dynamic QR keeps the code stable while the destination evolves.",
    ],
  },
  "when-to-use-a-static-vs-dynamic-code": {
    title: "When to use a static vs dynamic code",
    description: "Know the tradeoffs between fixed destinations and editable QR codes before you print or share them widely.",
    body: [
      "Static QR codes are useful when the destination is meant to stay permanent. A company address, a clean URL, or a stable contact card is a strong fit.",
      "Dynamic QR codes are better when you need to update the destination after printing, track scans, or redirect to a campaign-specific view without changing the printed pattern.",
      "In practice, the decision often comes down to control. If you might change the link later, a dynamic code offers flexibility without replacing the physical asset.",
    ],
  },
  "building-a-qr-journey-for-events-and-packaging": {
    title: "Building a QR journey for events and packaging",
    description: "Create a scan flow that supports onboarding, context, and timely action in physical environments.",
    body: [
      "Events and packaging have a limited window to make an impression. That means the destination should do exactly one job well: provide a clear next step, not a general information dump.",
      "Use the QR code to lead to a simple landing page or action, such as viewing tickets, scanning a menu, or learning more about the product. Keep the copy short and the actions obvious.",
      "When there are multiple touchpoints, the same code can become part of a system: entry, details, offer, follow-up, and analytics. That is where a dynamic QR becomes especially valuable.",
    ],
  },
} as const;

export async function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug as keyof typeof posts];

  if (!post) {
    return buildPageMetadata({
      title: "Blog post not found",
      description: "This post could not be found.",
      path: "/blog",
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts[slug as keyof typeof posts];

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <h1 className="text-3xl font-semibold text-[#173a32]">This article could not be found.</h1>
        <Link href="/blog" className="mt-6 inline-flex text-sm font-bold text-[#173a32]">Back to the blog →</Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Loopmark journal</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#173a32]">{post.title}</h1>
      <div className="mt-8 space-y-5 text-lg leading-8 text-[#60796e]">
        {post.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-10">
        <Link href="/blog" className="inline-flex rounded-xl border border-[#dce7d4] bg-white px-4 py-3 text-sm font-bold text-[#173a32]">Back to all articles</Link>
      </div>
    </article>
  );
}
