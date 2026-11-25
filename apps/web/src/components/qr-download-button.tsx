"use client";

import QRCode from "qrcode";
import { useState } from "react";
import type { QRDesign } from "@/lib/qr-design";

export function QRDownloadButton({ value, name, design }: { value: string; name: string; design: QRDesign | null }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function download(format: "png" | "svg") {
    setDownloading(true);
    setError("");
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "dynamic-qr";
    const options = {
      width: 1600,
      margin: design?.margin ?? 2,
      errorCorrectionLevel: "M" as const,
      color: {
        dark: design?.foregroundColor ?? "#173a32",
        light: design?.backgroundColor ?? "#ffffff",
      },
    };

    try {
      const link = document.createElement("a");
      if (format === "png") {
        link.href = await QRCode.toDataURL(value, options);
      } else {
        const svg = await QRCode.toString(value, { ...options, type: "svg" });
        const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
        link.href = blobUrl;
        link.download = `${safeName}.svg`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      }
      link.download = `${safeName}.png`;
      link.click();
    } catch (downloadError) {
      console.error("Could not export the saved QR code.", downloadError);
      setError("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" disabled={downloading} onClick={() => download("png")} className="focus-ring rounded-lg border border-[#dce4d9] px-3 py-2 text-xs font-semibold text-[#315947] disabled:opacity-60">
        {downloading ? "Preparing..." : "Download PNG"}
      </button>
      <button type="button" disabled={downloading} onClick={() => download("svg")} className="focus-ring rounded-lg border border-[#dce4d9] px-3 py-2 text-xs font-semibold text-[#315947] disabled:opacity-60">
        Download SVG
      </button>
      {error && <p role="alert" className="basis-full text-xs text-red-700">{error}</p>}
    </div>
  );
}
