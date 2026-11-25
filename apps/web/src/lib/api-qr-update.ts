import { z } from "zod";
import { parseDynamicContent, type DynamicQRContent } from "./dynamic-qr";
import { qrDesignSchema, type QRDesign } from "./qr-design";

const qrApiUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  content: z.unknown().optional(),
  design: qrDesignSchema.nullable().optional(),
}).strict().refine(
  (value) => value.name !== undefined || value.content !== undefined || value.design !== undefined,
  "Provide at least one field to update.",
);

export type QrApiUpdate = {
  name?: string;
  content?: DynamicQRContent;
  design?: QRDesign | null;
};

export function parseQrApiUpdate(value: unknown): QrApiUpdate | null {
  const parsed = qrApiUpdateSchema.safeParse(value);
  if (!parsed.success) return null;
  const content = parsed.data.content === undefined ? undefined : parseDynamicContent(parsed.data.content);
  if (parsed.data.content !== undefined && !content) return null;
  return {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(content ? { content } : {}),
    ...(parsed.data.design !== undefined ? { design: parsed.data.design } : {}),
  };
}
