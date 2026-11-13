import Link from "next/link";
import { planDefinitions, supportedCurrencies } from "@/lib/plans";

export const metadata = {
  title: "Plans and pricing",
  description: "Compare Loopmark pricing tiers for dynamic QR codes, analytics, custom domains, and enterprise features.",
};

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Pricing</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#173a32]">Choose the plan that matches your workflow</h1>
        <p className="mt-4 text-[#60796e]">Every plan includes the core QR editor, while higher tiers unlock more dynamic codes, retention, and advanced workspace controls.</p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-5">
        {Object.values(planDefinitions).map((plan) => (
          <section key={plan.id} className={`rounded-3xl border p-6 ${plan.id === "pro" ? "border-[#173a32] bg-[#173a32] text-white shadow-lg" : "border-[#e3e9de] bg-white text-[#173a32]"}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              {plan.id === "pro" && <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">Popular</span>}
            </div>
            <p className={`mt-4 text-sm ${plan.id === "pro" ? "text-[#d8eae3]" : "text-[#61806d]"}`}>{plan.description}</p>
            <div className="mt-6 flex items-end gap-1">
              <span className="text-3xl font-semibold">{plan.prices.USD.monthly === 0 ? "$0" : `$${plan.prices.USD.monthly}`}</span>
              <span className={`pb-1 text-xs ${plan.id === "pro" ? "text-[#d8eae3]" : "text-[#71877c]"}`}>/{plan.prices.USD.monthly === 0 ? "forever" : "mo"}</span>
            </div>
            <ul className={`mt-6 space-y-3 text-sm ${plan.id === "pro" ? "text-[#edf7f0]" : "text-[#425d52]"}`}>
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 text-xs uppercase tracking-[0.12em] text-[#759078]">
              {plan.limits.dynamicCodes === Number.POSITIVE_INFINITY ? "Unlimited dynamic codes" : `${plan.limits.dynamicCodes} dynamic codes`}
            </div>
            <div className="mt-6">
              <Link href="/register" className={`inline-flex rounded-xl px-4 py-3 text-sm font-bold ${plan.id === "pro" ? "bg-white text-[#173a32]" : "bg-[#173a32] text-white"}`}>
                {plan.id === "free" ? "Get started" : "Choose plan"}
              </Link>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border border-[#e3e9de] bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#759078]">Supported billing currencies</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {supportedCurrencies.map((currency) => (
            <span key={currency} className="rounded-full border border-[#dce7d4] bg-[#f6f9f5] px-3 py-2 text-sm font-semibold text-[#173a32]">{currency}</span>
          ))}
        </div>
      </div>
    </main>
  );
}
