"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@loopmark/db";
import { accountActionUrl, sendWorkspaceInvitationEmail } from "@/lib/email";
import {
  createWorkspaceInvitationToken,
  hashWorkspaceInvitationToken,
  isWorkspaceInvitationToken,
} from "@/lib/workspace-invitations";
import type { FormState } from "@/app/actions/auth-actions";
import { z } from "zod";

const inviteSchema = z.object({
  workspaceId: z.string().min(1).max(40),
  email: z.string().trim().email().max(320).transform((email) => email.toLowerCase()),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export async function createWorkspaceInvitationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = inviteSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Enter a valid email address and role." };

  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to invite a teammate." };
  const workspace = await db.workspace.findFirst({
    where: {
      id: parsed.data.workspaceId,
      members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
    },
    select: { id: true, name: true },
  });
  if (!workspace) return { error: "You do not have permission to invite members to this workspace." };

  const invitedUser = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (invitedUser) {
    const existingMembership = await db.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: invitedUser.id, workspaceId: workspace.id } },
      select: { userId: true },
    });
    if (existingMembership) return { error: "That person is already a workspace member." };
  }

  const pendingInvitation = await db.workspaceInvitation.findFirst({
    where: {
      workspaceId: workspace.id,
      email: parsed.data.email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (pendingInvitation) return { error: "An active invitation already exists for that email." };

  const rawToken = createWorkspaceInvitationToken();
  const inviteUrl = accountActionUrl("/invite", rawToken);
  const invitation = await db.workspaceInvitation.create({
    data: {
      workspaceId: workspace.id,
      email: parsed.data.email,
      role: parsed.data.role,
      token: hashWorkspaceInvitationToken(rawToken),
      invitedById: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    select: { id: true },
  });
  try {
    await sendWorkspaceInvitationEmail({
      email: parsed.data.email,
      workspaceName: workspace.name,
      inviterName: session.user.name ?? session.user.email ?? "A workspace member",
      inviteUrl,
    });
  } catch (error) {
    await db.workspaceInvitation.delete({ where: { id: invitation.id } });
    console.error("Workspace invitation could not be sent.", error);
    return { error: "The invitation could not be sent. Please try again later." };
  }

  revalidatePath("/dashboard/team");
  return { success: "Invitation sent. It expires in seven days." };
}

export async function acceptWorkspaceInvitationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = formData.get("token");
  if (typeof token !== "string" || !isWorkspaceInvitationToken(token)) {
    return { error: "This invitation link is invalid or has expired." };
  }

  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in with the invited email address to accept." };
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });
  if (!user?.emailVerified) return { error: "Verify your email address before accepting this invitation." };

  const tokenHash = hashWorkspaceInvitationToken(token);
  const accepted = await db.$transaction(async (transaction) => {
    const invitation = await transaction.workspaceInvitation.findUnique({
      where: { token: tokenHash },
      select: { id: true, workspaceId: true, email: true, role: true, acceptedAt: true, expiresAt: true },
    });
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt <= new Date() ||
      invitation.email.toLowerCase() !== user.email.toLowerCase()
    ) return false;

    const claimed = await transaction.workspaceInvitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: new Date() } },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count !== 1) return false;

    await transaction.workspaceMember.create({
      data: { userId: session.user.id, workspaceId: invitation.workspaceId, role: invitation.role },
    });
    return true;
  });

  if (!accepted) return { error: "This invitation is invalid, expired, or belongs to another email address." };
  revalidatePath("/dashboard");
  return { success: "You joined the workspace." };
}

export async function changeWorkspaceMemberRoleAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z.object({
    workspaceId: z.string().min(1).max(40),
    targetUserId: z.string().min(1).max(40),
    role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
  }).safeParse({
    workspaceId: formData.get("workspaceId"),
    targetUserId: formData.get("targetUserId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Choose a valid member role." };

  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to manage workspace members." };
  const actor = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: parsed.data.workspaceId } },
    select: { role: true },
  });
  if (!actor || !["OWNER", "ADMIN"].includes(actor.role) || parsed.data.targetUserId === session.user.id) {
    return { error: "You do not have permission to change this member." };
  }
  if (actor.role === "ADMIN" && parsed.data.role === "ADMIN") {
    return { error: "Only a workspace owner can assign the admin role." };
  }

  const target = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: parsed.data.targetUserId, workspaceId: parsed.data.workspaceId } },
    select: { role: true },
  });
  if (!target || target.role === "OWNER" || (actor.role === "ADMIN" && target.role === "ADMIN")) {
    return { error: "You cannot change this member's role." };
  }

  await db.workspaceMember.update({
    where: { userId_workspaceId: { userId: parsed.data.targetUserId, workspaceId: parsed.data.workspaceId } },
    data: { role: parsed.data.role },
  });
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard");
  return { success: "Member role updated." };
}

export async function removeWorkspaceMemberAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z.object({
    workspaceId: z.string().min(1).max(40),
    targetUserId: z.string().min(1).max(40),
  }).safeParse({
    workspaceId: formData.get("workspaceId"),
    targetUserId: formData.get("targetUserId"),
  });
  if (!parsed.success) return { error: "Choose a valid workspace member." };

  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to manage workspace members." };
  const actor = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: parsed.data.workspaceId } },
    select: { role: true },
  });
  if (!actor || !["OWNER", "ADMIN"].includes(actor.role) || parsed.data.targetUserId === session.user.id) {
    return { error: "You do not have permission to remove this member." };
  }
  const target = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: parsed.data.targetUserId, workspaceId: parsed.data.workspaceId } },
    select: { role: true },
  });
  if (!target || target.role === "OWNER" || (actor.role === "ADMIN" && target.role === "ADMIN")) {
    return { error: "You cannot remove this member." };
  }

  await db.workspaceMember.delete({
    where: { userId_workspaceId: { userId: parsed.data.targetUserId, workspaceId: parsed.data.workspaceId } },
  });
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard");
  return { success: "Member removed from the workspace." };
}
