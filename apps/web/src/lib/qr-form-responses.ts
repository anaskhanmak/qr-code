import type { DynamicQRContent } from "@/lib/dynamic-qr";

export type QRFormResponseKind = "LEAD" | "FEEDBACK" | "CONTACT";

export function getPublicResponseKind(content: DynamicQRContent): QRFormResponseKind | null {
  if (content.type === "lead_form" && content.mode === "capture") return "LEAD";
  if (content.type === "feedback") return "FEEDBACK";
  if (content.type === "business_card") return "CONTACT";
  return null;
}
