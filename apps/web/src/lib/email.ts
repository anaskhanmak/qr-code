import { Resend } from "resend";
import type { EnterpriseInquiryInput } from "@/lib/enterprise-inquiry";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export async function sendAccountEmail(
  email: string,
  subject: string,
  heading: string,
  actionLabel: string,
  actionUrl: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required to send account emails.");
    }
    console.info(`[Loopmark email: ${email}] ${subject}: ${actionUrl}`);
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is required to send account emails.");
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: email,
    subject,
    html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;color:#18342d"><p style="color:#59766e">LOOPMARK</p><h1>${heading}</h1><p>Use the secure link below to continue. It expires in one hour.</p><p><a href="${actionUrl}" style="display:inline-block;background:#c5f277;color:#18342d;padding:12px 18px;border-radius:8px;text-decoration:none">${actionLabel}</a></p><p>If you did not request this, you can ignore this email.</p></main>`,
  });
  if (result.error) {
    console.error("Could not send account email.", result.error);
    throw new Error("Email delivery failed. Please try again later.");
  }
}

export async function sendEnterpriseInquiryNotification(inquiry: EnterpriseInquiryInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.SALES_INBOX;
  if (!apiKey || !from || !to) {
    throw new Error("RESEND_API_KEY, EMAIL_FROM, and SALES_INBOX are required for enterprise inquiry notifications.");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    replyTo: inquiry.email,
    subject: "New enterprise inquiry",
    html: [
      "<main style=\"font-family:Arial,sans-serif;max-width:560px;margin:40px auto;color:#18342d\">",
      "<h1>New enterprise inquiry</h1>",
      `<p><strong>Name:</strong> ${escapeHtml(inquiry.name)}</p>`,
      `<p><strong>Email:</strong> ${escapeHtml(inquiry.email)}</p>`,
      `<p><strong>Company:</strong> ${escapeHtml(inquiry.company ?? "Not provided")}</p>`,
      `<p><strong>Use case:</strong></p><p>${escapeHtml(inquiry.message).replace(/\n/g, "<br>")}</p>`,
      "</main>",
    ].join(""),
  });

  if (result.error) {
    throw new Error("Enterprise inquiry notification delivery failed.");
  }
}

export async function sendWorkspaceInvitationEmail(input: {
  email: string;
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required to send workspace invitations.");
    }
    console.info(`[Loopmark invitation: ${input.email}] ${input.workspaceName}: ${input.inviteUrl}`);
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is required to send workspace invitations.");
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: input.email,
    subject: `Join ${input.workspaceName} on Loopmark`,
    html: [
      "<main style=\"font-family:Arial,sans-serif;max-width:560px;margin:40px auto;color:#18342d\">",
      "<p style=\"color:#59766e\">LOOPMARK</p>",
      `<h1>You're invited to ${escapeHtml(input.workspaceName)}</h1>`,
      `<p>${escapeHtml(input.inviterName)} invited you to collaborate in this workspace.</p>`,
      `<p><a href="${escapeHtml(input.inviteUrl)}" style="display:inline-block;background:#c5f277;color:#18342d;padding:12px 18px;border-radius:8px;text-decoration:none">Accept invitation</a></p>`,
      "<p>This invitation expires in seven days. If you did not expect it, you can ignore this email.</p>",
      "</main>",
    ].join(""),
  });
  if (result.error) {
    console.error("Could not send workspace invitation.", result.error);
    throw new Error("Invitation email delivery failed. Please try again later.");
  }
}

export function accountActionUrl(path: string, token: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredUrl && process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is required for account email links.");
  }
  const url = new URL(path, configuredUrl ?? "http://localhost:3000");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production.");
  }
  url.searchParams.set("token", token);
  return url.toString();
}
