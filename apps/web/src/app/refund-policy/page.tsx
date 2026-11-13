import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Refund policy",
  description: "Review Loopmark's refund policy for subscriptions, trials, and billing-related support requests.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Refund policy</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#173a32]">Billing fairness and clear support.</h1>

      <div className="mt-8 space-y-6 text-[#60796e]">
        <p>
          Loopmark aims to keep billing straightforward and customer-friendly. If a charge was made in error, or a customer is dissatisfied within the first billing cycle, support may review the request for a credit or refund.
        </p>
        <p>
          Refunds are evaluated on a case-by-case basis and may depend on the payment provider, subscription start date, product usage, and whether the issue was caused by a service outage or account misuse.
        </p>
        <p>
          For enterprise or annual commitments, any refund request should be raised before the renewal date so the support team can review the account history and any active service usage.
        </p>
        <p>
          To request a review, contact the support team with the account email, invoice ID, and a short explanation. We will respond with the next steps and any available remedy.
        </p>
      </div>
    </div>
  );
}
