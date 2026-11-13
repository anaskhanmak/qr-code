"use server";

import { db } from "@loopmark/db";
import { enterpriseInquirySchema } from "@/lib/enterprise-inquiry";
import { sendEnterpriseInquiryNotification } from "@/lib/email";

export type EnterpriseInquiryFormState = {
  error?: string;
  success?: string;
};

export async function submitEnterpriseInquiryAction(
  _state: EnterpriseInquiryFormState,
  formData: FormData,
): Promise<EnterpriseInquiryFormState> {
  if (String(formData.get("website") ?? "").trim()) {
    return { error: "Unable to submit this inquiry." };
  }

  const parsed = enterpriseInquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const inquiry = await db.enterpriseInquiry.create({
    data: parsed.data,
    select: { id: true },
  });

  try {
    await sendEnterpriseInquiryNotification(parsed.data);
  } catch (error) {
    console.error("Enterprise inquiry was saved but notification delivery failed.", {
      inquiryId: inquiry.id,
      error,
    });
    return {
      success: "Your inquiry was saved, but we could not send the notification right now. Please try again later if you do not hear from us.",
    };
  }

  return { success: "Thanks — your inquiry was sent. Our team will be in touch." };
}
