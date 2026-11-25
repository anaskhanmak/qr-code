import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "Loopmark API",
      version: "1.0.0",
      description: "Workspace-scoped QR code management. API keys are created in the Loopmark dashboard and must only be sent over HTTPS.",
    },
    servers: [{ url: `${origin.replace(/\/+$/, "")}/api/v1` }],
    security: [{ BearerAuth: [] }],
    paths: {
      "/qrs": {
        get: {
          summary: "List QR codes",
          description: "Requires the QR_READ scope. Pagination uses an opaque nextCursor value.",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
            { name: "cursor", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "QR code page." },
            "401": { description: "Missing, expired, revoked, or insufficient-scope API key." },
            "429": { description: "Rate limit exceeded." },
          },
        },
        post: {
          summary: "Create a dynamic QR code",
          description: "Requires the QR_WRITE scope.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "content"],
                  properties: {
                    name: { type: "string", minLength: 1, maxLength: 120 },
                    content: { type: "object", description: "A supported dynamic QR content object." },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "QR code created." },
            "400": { description: "Invalid request." },
            "401": { description: "Missing, expired, revoked, or insufficient-scope API key." },
            "409": { description: "Workspace QR limit reached." },
            "429": { description: "Rate limit exceeded." },
          },
        },
      },
      "/qrs/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Get a QR code",
          description: "Requires the QR_READ scope. Codes outside the API key's workspace return 404.",
          responses: {
            "200": { description: "QR code." },
            "401": { description: "Missing, expired, revoked, or insufficient-scope API key." },
            "404": { description: "QR code not found." },
            "429": { description: "Rate limit exceeded." },
          },
        },
        patch: {
          summary: "Update a QR code",
          description: "Requires the QR_WRITE scope. Supports name, dynamic content, and saved design updates.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  minProperties: 1,
                  properties: {
                    name: { type: "string", minLength: 1, maxLength: 120 },
                    content: { type: "object", description: "A supported dynamic QR content object." },
                    design: {
                      oneOf: [
                        { type: "object", properties: {
                          foregroundColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
                          backgroundColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
                          margin: { type: "integer", minimum: 0, maximum: 10 },
                        }, required: ["foregroundColor", "backgroundColor", "margin"] },
                        { type: "null" },
                      ],
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
          },
          responses: {
            "200": { description: "QR code updated. A warning may be included if redirect cache invalidation is delayed." },
            "400": { description: "Invalid update." },
            "401": { description: "Missing, expired, revoked, or insufficient-scope API key." },
            "404": { description: "QR code not found." },
            "429": { description: "Rate limit exceeded." },
          },
        },
        delete: {
          summary: "Delete a QR code",
          description: "Requires the QR_WRITE scope. Dynamic codes are paused and their redirect cache cleared before deletion.",
          responses: {
            "204": { description: "QR code deleted." },
            "401": { description: "Missing, expired, revoked, or insufficient-scope API key." },
            "404": { description: "QR code not found." },
            "429": { description: "Rate limit exceeded." },
            "503": { description: "Redirect cache could not be cleared; the code remains paused." },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "Loopmark API key" },
      },
    },
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
