import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { buildQrPayload } from "./qr-payload";

describe("buildQrPayload", () => {
  it("encodes each supported static QR format", () => {
    expect(buildQrPayload("url", { url: "https://loopmark.app" })).toBe(
      "https://loopmark.app",
    );
    expect(buildQrPayload("email", { email: "hello@loopmark.app", subject: "Hi" })).toBe(
      "mailto:hello@loopmark.app?subject=Hi",
    );
    expect(buildQrPayload("sms", { phone: "+15551234567", message: "Hello" })).toBe(
      "SMSTO:+15551234567:Hello",
    );
    expect(buildQrPayload("phone", { phone: "+15551234567" })).toBe("tel:+15551234567");
    expect(buildQrPayload("text", { text: "A useful note" })).toBe("A useful note");
    expect(
      buildQrPayload("wifi", {
        ssid: "Studio;Guest",
        password: "a:b",
        security: "WPA",
        hidden: "false",
      }),
    ).toBe("WIFI:T:WPA;S:Studio\\;Guest;P:a\\:b;H:false;;");
    expect(buildQrPayload("location", { latitude: "24.86", longitude: "67.01" })).toBe(
      "geo:24.86,67.01",
    );
    expect(buildQrPayload("vcard", { name: "Alex; Morgan", email: "alex@example.com" })).toBe(
      "BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Alex\\; Morgan\r\nEMAIL:alex@example.com\r\nEND:VCARD",
    );
  });

  it("rejects malformed links and missing required data", () => {
    expect(() => buildQrPayload("url", { url: "not a URL" })).toThrow();
    expect(() => buildQrPayload("text", { text: " " })).toThrow("Text is required");
    expect(() => buildQrPayload("location", { latitude: "", longitude: "" })).toThrow(
      "Latitude is required",
    );
    expect(() => buildQrPayload("location", { latitude: "91", longitude: "0" })).toThrow(
      "Enter a latitude between -90 and 90",
    );
  });

  it("creates an SVG QR image for a valid payload", async () => {
    const svg = await QRCode.toString("https://loopmark.app", { type: "svg" });
    expect(svg).toContain("<svg");
    expect(svg).toContain("<path");
  });
});
