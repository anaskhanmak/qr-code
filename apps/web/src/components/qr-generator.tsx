"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildQrPayload, qrTypes, type QRFields, type QRType } from "@/lib/qr-payload";

const typeNames: Record<QRType, string> = {
  url: "Website",
  text: "Text",
  email: "Email",
  sms: "SMS",
  phone: "Phone",
  wifi: "Wi-Fi",
  vcard: "vCard",
  location: "Location",
};

const typeFields: Record<QRType, { key: string; label: string; placeholder: string; multiline?: boolean }[]> = {
  url: [{ key: "url", label: "Website address", placeholder: "https://example.com" }],
  text: [{ key: "text", label: "Your message", placeholder: "Write something worth sharing...", multiline: true }],
  email: [
    { key: "email", label: "Email address", placeholder: "hello@example.com" },
    { key: "subject", label: "Subject", placeholder: "A quick hello" },
    { key: "body", label: "Message", placeholder: "Add an optional message", multiline: true },
  ],
  sms: [
    { key: "phone", label: "Phone number", placeholder: "+1 555 123 4567" },
    { key: "message", label: "Message", placeholder: "Add an optional text" },
  ],
  phone: [{ key: "phone", label: "Phone number", placeholder: "+1 555 123 4567" }],
  wifi: [
    { key: "ssid", label: "Network name", placeholder: "Your Wi-Fi name" },
    { key: "password", label: "Password", placeholder: "Wi-Fi password" },
  ],
  vcard: [
    { key: "name", label: "Full name", placeholder: "Alex Morgan" },
    { key: "organization", label: "Organization", placeholder: "Studio North" },
    { key: "phone", label: "Phone number", placeholder: "+1 555 123 4567" },
    { key: "email", label: "Email address", placeholder: "alex@example.com" },
    { key: "website", label: "Website", placeholder: "https://example.com" },
  ],
  location: [
    { key: "latitude", label: "Latitude", placeholder: "24.8607" },
    { key: "longitude", label: "Longitude", placeholder: "67.0011" },
  ],
};

const initialFields: Record<QRType, QRFields> = {
  url: { url: "" },
  text: { text: "" },
  email: { email: "", subject: "", body: "" },
  sms: { phone: "", message: "" },
  phone: { phone: "" },
  wifi: { ssid: "", password: "", security: "WPA", hidden: "false" },
  vcard: { name: "", organization: "", phone: "", email: "", website: "" },
  location: { latitude: "", longitude: "" },
};

const inputClass =
  "focus-ring mt-2 w-full rounded-xl border border-[#dce4d9] bg-white px-3.5 py-3 text-sm text-[#173a32] placeholder:text-[#97a69d]";

export function QRGenerator() {
  const [type, setType] = useState<QRType>("url");
  const [fields, setFields] = useState<QRFields>(initialFields.url);
  const [security, setSecurity] = useState("WPA");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { payload, validationError } = useMemo(() => {
    try {
      return {
        payload: buildQrPayload(type, { ...fields, security }),
        validationError: "",
      };
    } catch (error) {
      return {
        payload: "",
        validationError: error instanceof Error ? error.message : "Check the QR code details.",
      };
    }
  }, [fields, security, type]);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!payload) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    QRCode.toCanvas(canvas, payload, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#173a32", light: "#ffffff" },
    }).catch(() => {
      if (active) {
        const context = canvas.getContext("2d");
        context?.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    return () => {
      active = false;
    };
  }, [payload]);

  function updateField(key: string, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function selectType(nextType: QRType) {
    setType(nextType);
    setFields(initialFields[nextType]);
  }

  async function downloadSvg() {
    if (!payload) return;
    try {
      const svg = await QRCode.toString(payload, {
        type: "svg",
        margin: 2,
        width: 640,
        color: { dark: "#173a32", light: "#ffffff" },
      });
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `loopmark-${type}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("The QR image could not be exported. Please try again.");
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `loopmark-${type}.png`;
    link.click();
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]" aria-label="Free QR code generator">
      <div className="rounded-3xl border border-[#e3e9de] bg-white p-5 shadow-[0_20px_70px_-45px_#385b48] sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b8777]">Step 1 · Choose a format</p>
          <div role="tablist" aria-label="QR code format" className="mt-4 flex flex-wrap gap-2">
            {qrTypes.map((option) => (
              <button
                key={option}
                id={`tab-${option}`}
                type="button"
                role="tab"
                aria-selected={type === option}
                aria-controls="qr-fields"
                onClick={() => selectType(option)}
                className={`focus-ring rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  type === option
                    ? "bg-[#173a32] text-white"
                    : "bg-[#f2f5ee] text-[#587167] hover:bg-[#e8eee1]"
                }`}
              >
                {typeNames[option]}
              </button>
            ))}
          </div>
        </div>

        <div id="qr-fields" role="tabpanel" aria-labelledby={`tab-${type}`} className="space-y-4">
          {typeFields[type].map((field) => (
            <label key={field.key} className="block text-sm font-semibold text-[#284b40]">
              {field.label}
              {field.multiline ? (
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  value={fields[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  maxLength={2000}
                />
              ) : (
                <input
                  className={inputClass}
                  type={field.key === "email" ? "email" : field.key === "website" || field.key === "url" ? "url" : field.key === "password" ? "password" : "text"}
                  inputMode={field.key === "latitude" || field.key === "longitude" ? "decimal" : undefined}
                  value={fields[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  maxLength={2000}
                />
              )}
            </label>
          ))}
          {type === "wifi" && (
            <label className="block text-sm font-semibold text-[#284b40]">
              Security
              <select className={inputClass} value={security} onChange={(event) => setSecurity(event.target.value)}>
                <option value="WPA">WPA / WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No password</option>
              </select>
            </label>
          )}
        </div>
        <p className="mt-5 text-xs leading-5 text-[#789087]">
          Static QR codes store this information directly. They are free, work offline, and never expire.
        </p>
      </div>

      <aside className="flex flex-col items-center justify-center rounded-3xl bg-[#eaf0e4] p-6 text-center sm:p-8">
        <p className="self-start text-left text-xs font-bold uppercase tracking-[0.18em] text-[#6b8777]">Step 2 · Preview</p>
        <div className="relative my-7 grid size-[288px] place-items-center rounded-[2rem] bg-white p-4 shadow-[0_15px_45px_-30px_#173a32]">
          <canvas
            ref={canvasRef}
            aria-label={payload ? `Preview of your ${typeNames[type]} QR code` : "QR code preview will appear when the required fields are filled"}
            className={payload ? "size-64 max-w-full" : "size-64 max-w-full opacity-0"}
          />
          {!payload && <span className="absolute max-w-48 text-sm text-[#879b90]">Add your details to see your code</span>}
        </div>
        <p className="mb-5 text-sm text-[#60796e]">Your code is generated in your browser. We do not upload its contents.</p>
        {!payload && (
          <p role="status" aria-live="polite" className="mb-4 text-sm text-[#8a6240]">
            {validationError}
          </p>
        )}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!payload}
            onClick={downloadPng}
            className="focus-ring flex-1 rounded-xl bg-[#173a32] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#275749] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download PNG
          </button>
          <button
            type="button"
            disabled={!payload}
            onClick={downloadSvg}
            className="focus-ring flex-1 rounded-xl border border-[#b8c8b8] bg-white px-5 py-3.5 text-sm font-bold text-[#173a32] transition hover:bg-[#f8faf6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download SVG
          </button>
        </div>
        <p className="mt-4 text-xs text-[#789087]">PNG · 256 px &nbsp; / &nbsp; SVG · scales cleanly</p>
      </aside>
    </section>
  );
}
