import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy policy",
  description: "Learn how Loopmark handles account data, QR analytics, and privacy preferences.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Privacy</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">Privacy policy</h1>
      <div className="mt-8 space-y-6 text-[15px] leading-7 text-[#47615a]">
        <p>Loopmark processes only the data needed to deliver QR generation, account access, and optional analytics for dynamic codes. We do not retain raw IP addresses for marketing or analytics use.</p>
        <p>We use hashed identifiers for scan analytics and keep the data scope limited to what is required for product functionality and product improvement.</p>
        <p>Account information, password hashes, emails, and workspace content are stored securely and used only for account access, QR management, and service delivery.</p>
        <p>By default, static QR generation happens locally in the browser. Dynamic QR links and hosted content are handled through the app and redirect infrastructure.</p>
        <p>If you need a data export or account deletion, contact the product team and the request will be handled through the account settings workflow.</p>
      </div>
    </div>
  );
}
