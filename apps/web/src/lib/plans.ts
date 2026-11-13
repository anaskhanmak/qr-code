export const supportedCurrencies = ["PKR", "USD", "AED", "GBP", "CAD"] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];

export const planIds = ["free", "starter", "pro", "business", "enterprise"] as const;
export type PlanId = (typeof planIds)[number];

export type PlanLimit = {
  dynamicCodes: number;
  staticCodes: number;
  seats: number;
  analyticsRetentionDays: number;
  customDomains: boolean;
  apiAccess: boolean;
  whiteLabeling: boolean;
  bulkCsv: boolean;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  prices: Record<SupportedCurrency, { monthly: number; yearly: number }>;
  limits: PlanLimit;
  features: string[];
};

export type PlanFeature = "customDomains" | "apiAccess" | "whiteLabeling" | "bulkCsv";

export type PlanUsageStatus = {
  planId: PlanId;
  current: number;
  limit: number;
  usedPercent: number;
  isAtLimit: boolean;
  canAddMore: boolean;
  upgradePlanId: PlanId;
};

export const planDefinitions: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "Best for personal QR links and simple experiments.",
    prices: {
      PKR: { monthly: 0, yearly: 0 },
      USD: { monthly: 0, yearly: 0 },
      AED: { monthly: 0, yearly: 0 },
      GBP: { monthly: 0, yearly: 0 },
      CAD: { monthly: 0, yearly: 0 },
    },
    limits: {
      dynamicCodes: 3,
      staticCodes: 25,
      seats: 1,
      analyticsRetentionDays: 7,
      customDomains: false,
      apiAccess: false,
      whiteLabeling: false,
      bulkCsv: false,
    },
    features: ["Basic QR generator", "3 dynamic codes", "Basic analytics"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For small projects that need a little more flexibility.",
    prices: {
      PKR: { monthly: 1999, yearly: 19990 },
      USD: { monthly: 12, yearly: 120 },
      AED: { monthly: 45, yearly: 450 },
      GBP: { monthly: 10, yearly: 100 },
      CAD: { monthly: 15, yearly: 150 },
    },
    limits: {
      dynamicCodes: 25,
      staticCodes: 250,
      seats: 3,
      analyticsRetentionDays: 30,
      customDomains: false,
      apiAccess: false,
      whiteLabeling: false,
      bulkCsv: true,
    },
    features: ["25 dynamic codes", "CSV bulk import", "Custom QR names"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For teams and marketing pages that need richer tracking.",
    prices: {
      PKR: { monthly: 6999, yearly: 69990 },
      USD: { monthly: 29, yearly: 290 },
      AED: { monthly: 109, yearly: 1090 },
      GBP: { monthly: 24, yearly: 240 },
      CAD: { monthly: 39, yearly: 390 },
    },
    limits: {
      dynamicCodes: 250,
      staticCodes: 1000,
      seats: 10,
      analyticsRetentionDays: 180,
      customDomains: true,
      apiAccess: true,
      whiteLabeling: false,
      bulkCsv: true,
    },
    features: ["250 dynamic codes", "Custom domains", "API access"],
  },
  business: {
    id: "business",
    name: "Business",
    description: "For growing teams and automated campaigns.",
    prices: {
      PKR: { monthly: 17999, yearly: 179990 },
      USD: { monthly: 79, yearly: 790 },
      AED: { monthly: 290, yearly: 2900 },
      GBP: { monthly: 65, yearly: 650 },
      CAD: { monthly: 99, yearly: 990 },
    },
    limits: {
      dynamicCodes: 2500,
      staticCodes: 10000,
      seats: 50,
      analyticsRetentionDays: 365,
      customDomains: true,
      apiAccess: true,
      whiteLabeling: true,
      bulkCsv: true,
    },
    features: ["Unlimited marketing workspaces", "White labeling", "Advanced analytics"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For complex deployment, governance, and custom support needs.",
    prices: {
      PKR: { monthly: 0, yearly: 0 },
      USD: { monthly: 0, yearly: 0 },
      AED: { monthly: 0, yearly: 0 },
      GBP: { monthly: 0, yearly: 0 },
      CAD: { monthly: 0, yearly: 0 },
    },
    limits: {
      dynamicCodes: Number.POSITIVE_INFINITY,
      staticCodes: Number.POSITIVE_INFINITY,
      seats: Number.POSITIVE_INFINITY,
      analyticsRetentionDays: 730,
      customDomains: true,
      apiAccess: true,
      whiteLabeling: true,
      bulkCsv: true,
    },
    features: ["Dedicated onboarding", "Custom SLA", "Full platform controls"],
  },
} as const;

export function getPlanById(planId: string | PlanId): PlanDefinition {
  if (planId in planDefinitions) return planDefinitions[planId as PlanId];
  return planDefinitions.free;
}

export function canUsePlanFeature(planId: string | PlanId, feature: PlanFeature): boolean {
  const plan = getPlanById(planId);
  switch (feature) {
    case "customDomains":
      return plan.limits.customDomains;
    case "apiAccess":
      return plan.limits.apiAccess;
    case "whiteLabeling":
      return plan.limits.whiteLabeling;
    case "bulkCsv":
      return plan.limits.bulkCsv;
    default:
      return false;
  }
}

export function getPlanUsageStatus(planId: string | PlanId, current: number): PlanUsageStatus {
  const plan = getPlanById(planId);
  const limit = plan.limits.dynamicCodes;
  const finiteLimit = Number.isFinite(limit) ? limit : Number.MAX_SAFE_INTEGER;
  const usedPercent = finiteLimit === Number.MAX_SAFE_INTEGER ? 0 : Math.min((current / finiteLimit) * 100, 100);
  const canAddMore = current < finiteLimit;
  const upgradePlanId: PlanId = plan.id === "free" ? "starter" : plan.id === "starter" ? "pro" : plan.id === "pro" ? "business" : "enterprise";

  return {
    planId: plan.id,
    current,
    limit: finiteLimit,
    usedPercent,
    isAtLimit: current >= finiteLimit,
    canAddMore,
    upgradePlanId,
  };
}

export function getDefaultCurrency(countryCode?: string | null): SupportedCurrency {
  const upper = countryCode?.toUpperCase();
  const geoDefaults: Record<string, SupportedCurrency> = {
    PK: "PKR",
    AE: "AED",
    GB: "GBP",
    CA: "CAD",
  };
  return geoDefaults[upper ?? ""] ?? "USD";
}

export function canCreateDynamicCode(planId: string | PlanId, currentDynamicCodes: number): boolean {
  const plan = getPlanById(planId);
  const limit = plan.limits.dynamicCodes;
  return Number.isFinite(limit) ? currentDynamicCodes < limit : true;
}

export function getPlanUpgradeMessage(planId: string | PlanId): string {
  const plan = getPlanById(planId);
  const nextPlan = plan.id === "free" ? "starter" : plan.id === "starter" ? "pro" : plan.id === "pro" ? "business" : "enterprise";
  return `Your ${plan.name} workspace has reached its limit. Upgrade to ${getPlanById(nextPlan).name} to keep creating dynamic QR codes.`;
}

export function getPlanPrice(planId: string | PlanId, currency: SupportedCurrency, billingCycle: "monthly" | "yearly") {
  const plan = getPlanById(planId);
  return plan.prices[currency][billingCycle];
}
