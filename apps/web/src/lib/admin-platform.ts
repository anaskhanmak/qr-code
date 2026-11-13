export type ModerationStatus = "PENDING" | "REVIEW" | "APPROVED" | "BLOCKED";

export type ModerationCase = {
  id: string;
  qrCodeId: string;
  workspaceId: string;
  status: ModerationStatus;
  riskScore: number;
  reason: string;
  reviewedBy?: string;
};

export type CmsEntry = {
  id: string;
  kind: "testimonial" | "faq" | "logo" | "stat" | "blog";
  title: string;
  body: string;
  isPublished: boolean;
  lastUpdated: string;
};

export type PlatformMetric = {
  label: string;
  value: number;
  change: number;
};

export function createModerationCase(
  input: Omit<ModerationCase, "id" | "status" | "riskScore"> & { id?: string; status?: ModerationStatus; riskScore?: number },
): ModerationCase {
  const riskScore = Math.min(100, Math.max(0, input.riskScore ?? 50));

  return {
    id: input.id || `mod-${Math.random().toString(36).slice(2, 10)}`,
    qrCodeId: input.qrCodeId,
    workspaceId: input.workspaceId,
    status: input.status ?? "PENDING",
    riskScore,
    reason: input.reason,
    reviewedBy: input.reviewedBy,
  };
}

export function shouldBlockDestination(destination: string): boolean {
  if (!destination || destination.trim().length === 0) {
    return true;
  }

  try {
    const normalized = destination.trim();
    const parsed = new URL(normalized);
    const protocol = parsed.protocol.toLowerCase();

    if (["javascript:", "data:", "file:", "blob:"].includes(protocol)) {
      return true;
    }

    if (parsed.hostname.toLowerCase().includes("localhost") && !normalized.startsWith("https://")) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

export function buildCmsEntry(input: Omit<CmsEntry, "id" | "lastUpdated"> & { id?: string; lastUpdated?: string }): CmsEntry {
  const title = input.title.trim();
  const body = input.body.trim();

  return {
    id: input.id || `cms-${Math.random().toString(36).slice(2, 10)}`,
    kind: input.kind,
    title,
    body,
    isPublished: input.isPublished,
    lastUpdated: input.lastUpdated || new Date().toISOString(),
  };
}

export function summarizePlatformMetrics(metrics: PlatformMetric[]): { total: number; changes: number } {
  const total = metrics.reduce((sum, metric) => sum + metric.value, 0);
  const changes = metrics.reduce((sum, metric) => sum + metric.change, 0);

  return { total, changes };
}
