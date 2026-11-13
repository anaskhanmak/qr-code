import type { Metadata } from "next";

export type SeoPageConfig = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex,
}: SeoPageConfig): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

export function renderJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Loopmark",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    logo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/favicon.ico`,
    description: "QR code tools for connections that need to keep working after the scan.",
    sameAs: [],
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Loopmark",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    potentialAction: {
      "@type": "SearchAction",
      target: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildSoftwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Loopmark",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function buildFaqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildPricingOfferJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Loopmark QR plans",
    brand: {
      "@type": "Brand",
      name: "Loopmark",
    },
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
      {
        "@type": "Offer",
        price: "29",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    ],
  };
}
