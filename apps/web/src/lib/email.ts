import { Resend } from "resend";

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
