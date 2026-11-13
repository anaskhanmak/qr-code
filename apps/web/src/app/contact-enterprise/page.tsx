import type { Metadata } from "next";
import { headers } from "next/headers";
import { EnterpriseInquiryForm } from "@/components/enterprise-inquiry-form";
import { buildPageMetadata, buildOrganizationJsonLd, renderJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact enterprise sales",
  description: "Talk with Loopmark about enterprise QR workflows, custom domains, team access, and dedicated onboarding support.",
  path: "/contact-enterprise",
  keywords: ["enterprise QR codes", "custom domains", "sales", "support"],
});

export default async function ContactEnterprisePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(buildOrganizationJsonLd()) }} />
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Enterprise</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#173a32] sm:text-5xl">Bring QR workflows to a bigger footprint.</h1>
            <p className="mt-5 text-lg leading-8 text-[#60796e]">
              For teams that need custom domains, collaboration, governance, and deeper analytics, Loopmark can support a more deliberate rollout.
            </p>
            <div className="mt-8 space-y-4 text-sm text-[#425d52]">
              <p>• Custom domains and branded redirect flows</p>
              <p>• Workspace-level roles, audits, and moderation</p>
              <p>• API access, webhook delivery, and CSV exports</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#e3e9de] bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-[#173a32]">Tell us what you need</h2>
            <EnterpriseInquiryForm />
          </div>
        </div>
      </div>
    </>
  );
}
