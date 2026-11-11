import { z } from "zod";

const bcryptCompatible = z
  .string()
  .max(72, "Password must be no more than 72 characters.")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be no more than 72 bytes.");

export const newPasswordSchema = bcryptCompatible.min(10, "Password must be at least 10 characters.");
export const signInPasswordSchema = bcryptCompatible.min(1, "Enter your password.");
