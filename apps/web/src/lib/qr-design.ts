import { z } from "zod";

export const qrDesignSchema = z.object({
  foregroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  margin: z.number().int().min(0).max(10),
});

export type QRDesign = z.infer<typeof qrDesignSchema>;

export function parseQRDesign(value: unknown): QRDesign | null {
  const parsed = qrDesignSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
