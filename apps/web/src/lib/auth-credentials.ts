import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@loopmark/db";
import { signInPasswordSchema } from "./password";

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  password: signInPasswordSchema,
});

export async function getAuthorizedUser(email: string, password: string) {
  const parsed = credentialsSchema.safeParse({ email, password });
  if (!parsed.success) return null;

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true, passwordHash: true, emailVerified: true },
  });

  if (!user?.passwordHash || !user.emailVerified) return null;
  if (!(await compare(parsed.data.password, user.passwordHash))) return null;

  return { id: user.id, name: user.name, email: user.email };
}
