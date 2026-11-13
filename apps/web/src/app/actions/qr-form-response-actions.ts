"use server";

import { headers } from "next/headers";
import { db } from "@loopmark/db";
import type { FormState } from "@/app/actions/auth-actions";
import { parseDynamicContent } from "@/lib/dynamic-qr";
import { createRateLimiter } from "@/lib/url-safety";
import { hashIdentifier } from "@/lib/scan-analytics";
import { z } from "zod";

const responseLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 8 });
const responseSchema = z.object({
  slug: z.string().regex(/^[A-Za-z0-9]{16}$/),
  name: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  message: z.string().trim().max(2000).optional().default(""),
  website: z.string().max(200).optional().default(""),
});

export async function submitQrFormResponseAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = responseSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    rating: formData.get("rating") || undefined,
    message: formData.get("message") ?? "",
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) return { error: "Please check your details and try again." };
  if (parsed.data.website) return { success: "Thanks for your response." };

  const requestHeaders = await headers();
  const ip = (requestHeaders.get("x-forwarded-for")?.split(",")[0] ??
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-real-ip") ??
    "").trim();
  if (!ip) return { error: "We could not verify this submission. Please try again later." };
  const rateLimitKey = hashIdentifier(ip, process.env.SCAN_HASH_SECRET ?? process.env.AUTH_SECRET ?? "local-form-limit");
  const rateLimit = responseLimiter(rateLimitKey);
  if (!rateLimit.allowed) return { error: "Too many submissions. Please wait a few minutes and try again." };

  const qrCode = await db.qRCode.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true, workspaceId: true, status: true, expiresAt: true, content: true },
  });
  if (
    !qrCode ||
    qrCode.status !== "ACTIVE" ||
    (qrCode.expiresAt !== null && qrCode.expiresAt <= new Date())
  ) return { error: "This form is no longer available." };

  const content = parseDynamicContent(qrCode.content);
  if (!content) return { error: "This form is no longer available." };
  const isLeadForm = content.type === "lead_form" && content.mode === "capture";
  const isFeedback = content.type === "feedback";
  if (!isLeadForm && !isFeedback) return { error: "This form is no longer available." };
  if (isLeadForm && (!parsed.data.name || !parsed.data.email)) {
    return { error: "Enter your name and a valid email address." };
  }
  if (isFeedback && !parsed.data.rating) return { error: "Choose a rating from 1 to 5." };
  if (!parsed.data.message.trim() && isFeedback) return { error: "Add a short comment before submitting." };

  await db.qRFormResponse.create({
    data: {
      qrCodeId: qrCode.id,
      workspaceId: qrCode.workspaceId,
      kind: isLeadForm ? "LEAD" : "FEEDBACK",
      name: parsed.data.name || null,
      email: parsed.data.email || null,
      rating: isFeedback ? parsed.data.rating : null,
      message: parsed.data.message || null,
    },
  });
  return { success: isFeedback ? content.thankYouMessage : "Thanks! Your message has been sent." };
}
