import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of service",
  description: "Review the service terms for using Loopmark QR tools, accounts, and workspace features.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Terms</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">Terms of service</h1>
      <div className="mt-8 space-y-6 text-[15px] leading-7 text-[#47615a]">
        <p>Loopmark provides QR creation and short-link services for lawful personal, business, and marketing use. Customers remain responsible for the destinations they publish and the content they share.</p>
        <p>Users must not create QR codes that facilitate spam, fraud, abusive content, or services that violate local laws or platform policies.</p>
        <p>Loopmark may suspend or disable access to QR codes or workspaces when abuse, security, or legal risk is identified. Service availability is not guaranteed for every workload or region.</p>
        <p>Dynamic QR links may be edited or paused in the workspace dashboard, and account access is controlled by the service authentication and role model.</p>
        <p>These terms are subject to change when the product evolves. Use of the platform after updates constitutes acceptance of the current terms.</p>
      </div>
    </div>
  );
}
