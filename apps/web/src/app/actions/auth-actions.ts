"use server";

import { randomBytes, createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { accountActionUrl, sendAccountEmail } from "@/lib/email";
import { db } from "@loopmark/db";
import { z } from "zod";
import { redirect } from "next/navigation";
import { newPasswordSchema, signInPasswordSchema } from "@/lib/password";
import { safeReturnTo } from "@/lib/return-to";

export type FormState = { error?: string; success?: string };

const emailSchema = z.string().trim().email().max(320).transform((email) => email.toLowerCase());
const registrationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: newPasswordSchema,
});

function tokenDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function createEmailToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.emailVerificationToken.deleteMany({ where: { userId } });
  await db.emailVerificationToken.create({
    data: {
      tokenHash: tokenDigest(token),
      userId,
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return token;
}

export async function registerAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return {
      error: existing.emailVerified
        ? "An account already uses this email. Try signing in."
        : "This account still needs verification. Request a fresh link below.",
    };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await db.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
    });
    await transaction.workspace.create({
      data: {
        name: `${createdUser.name ?? "My"} workspace`,
        members: {
          create: {
            user: { connect: { id: createdUser.id } },
            role: "OWNER",
          },
        },
      },
    });
    return createdUser;
  });
  const token = await createEmailToken(user.id);
  const returnTo = safeReturnTo(formData.get("returnTo"));
  const verificationUrl = new URL(accountActionUrl("/api/verify-email", token));
  verificationUrl.searchParams.set("next", returnTo);
  try {
    await sendAccountEmail(
      user.email,
      "Verify your Loopmark account",
      "Confirm your email",
      "Verify email",
      verificationUrl.toString(),
    );
  } catch (error) {
    console.error("Account created but verification email failed.", error);
    return { error: "Your account was created, but the email could not be sent. Request a new link to try again." };
  }
  return { success: "Check your inbox for a verification link. It is valid for one hour." };
}

export async function resendVerificationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (!user || user.emailVerified) {
    return { success: "If that account needs verification, a fresh link has been sent." };
  }
  const token = await createEmailToken(user.id);
  try {
    await sendAccountEmail(
      user.email,
      "Verify your Loopmark account",
      "Confirm your email",
      "Verify email",
      accountActionUrl("/api/verify-email", token),
    );
  } catch (error) {
    console.error("Could not resend verification email.", error);
    return { error: "Email delivery failed. Please try again later." };
  }
  return { success: "If that account needs verification, a fresh link has been sent." };
}

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: emailSchema, password: signInPasswordSchema })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeReturnTo(formData.get("returnTo")),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Sign-in failed. Check your details and verify your email." };
    throw error;
  }
  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: safeReturnTo(formData.get("returnTo")) });
}

export async function requestPasswordResetAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (!user || !user.passwordHash) {
    return { success: "If an account exists for that email, a reset link has been sent." };
  }
  const token = randomBytes(32).toString("base64url");
  const tokenHash = tokenDigest(token);
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await db.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expires: new Date(Date.now() + 60 * 60 * 1000) },
  });
  try {
    await sendAccountEmail(
      user.email,
      "Reset your Loopmark password",
      "Choose a new password",
      "Reset password",
      accountActionUrl("/reset-password", token),
    );
  } catch (error) {
    console.error("Could not send password reset email.", error);
    return { error: "Email delivery failed. Please try again later." };
  }
  return { success: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      token: z.string().min(20),
      password: newPasswordSchema,
    })
    .safeParse({ token: formData.get("token"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid password of at least 10 characters." };
  const tokenHash = tokenDigest(parsed.data.token);
  const passwordHash = await hash(parsed.data.password, 12);
  const result = await db.$transaction(async (transaction) => {
    const reset = await transaction.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expires: true },
    });
    if (!reset || reset.expires <= new Date()) return false;
    const consumed = await transaction.passwordResetToken.deleteMany({
      where: { id: reset.id, expires: { gt: new Date() } },
    });
    if (consumed.count !== 1) return false;
    await transaction.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    await transaction.passwordResetToken.deleteMany({ where: { userId: reset.userId } });
    return true;
  });
  return result
    ? { success: "Password updated. You can now sign in." }
    : { error: "This reset link is invalid or has expired. Request a new one." };
}
