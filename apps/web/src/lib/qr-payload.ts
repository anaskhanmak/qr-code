import { z } from "zod";

export const qrTypes = [
  "url",
  "text",
  "email",
  "sms",
  "phone",
  "wifi",
  "vcard",
  "location",
] as const;

export type QRType = (typeof qrTypes)[number];
export type QRFields = Record<string, string>;

const required = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(2000);

const inputSchemas: Record<QRType, z.ZodType<QRFields>> = {
  url: z.object({
    url: z.string().trim().min(1, "Website address is required").url("Enter a valid website address").max(2000),
  }),
  text: z.object({ text: required("Text") }),
  email: z.object({
    email: z.string().trim().email().max(320),
    subject: z.string().max(200).optional().default(""),
    body: z.string().max(2000).optional().default(""),
  }),
  sms: z.object({
    phone: z.string().trim().min(3).max(30),
    message: z.string().max(1000).optional().default(""),
  }),
  phone: z.object({ phone: z.string().trim().min(3).max(30) }),
  wifi: z.object({
    ssid: required("Network name").max(100),
    password: z.string().max(100).optional().default(""),
    security: z.enum(["WPA", "WEP", "nopass"]),
    hidden: z.string().optional().default("false"),
  }),
  vcard: z.object({
    name: required("Name").max(200),
    phone: z.string().max(30).optional().default(""),
    email: z.string().max(320).optional().default(""),
    organization: z.string().max(200).optional().default(""),
    website: z.string().max(2000).optional().default(""),
  }),
  location: z.object({
    latitude: z
      .string()
      .trim()
      .min(1, "Latitude is required")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= -90 && Number(value) <= 90, "Enter a latitude between -90 and 90")
      .transform((value) => String(Number(value))),
    longitude: z
      .string()
      .trim()
      .min(1, "Longitude is required")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= -180 && Number(value) <= 180, "Enter a longitude between -180 and 180")
      .transform((value) => String(Number(value))),
  }),
};

function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([;,])/g, "\\$1");
}

export function buildQrPayload(type: QRType, fields: QRFields): string {
  const parsed = inputSchemas[type].safeParse(fields);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Check the QR code details.");
  }

  const values = parsed.data;
  switch (type) {
    case "url":
      return values.url;
    case "text":
      return values.text;
    case "email": {
      const params = new URLSearchParams();
      if (values.subject) params.set("subject", values.subject);
      if (values.body) params.set("body", values.body);
      const suffix = params.size > 0 ? `?${params.toString()}` : "";
      return `mailto:${values.email}${suffix}`;
    }
    case "sms": {
      const separator = values.message ? `:${values.message}` : "";
      return `SMSTO:${values.phone}${separator}`;
    }
    case "phone":
      return `tel:${values.phone}`;
    case "wifi":
      return `WIFI:T:${values.security};S:${escapeWifi(values.ssid)};P:${escapeWifi(values.password)};H:${values.hidden === "true"};;`;
    case "vcard":
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${escapeVCard(values.name)}`,
        values.organization ? `ORG:${escapeVCard(values.organization)}` : "",
        values.phone ? `TEL;TYPE=WORK,VOICE:${escapeVCard(values.phone)}` : "",
        values.email ? `EMAIL:${escapeVCard(values.email)}` : "",
        values.website ? `URL:${escapeVCard(values.website)}` : "",
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\r\n");
    case "location":
      return `geo:${values.latitude},${values.longitude}`;
  }
}
