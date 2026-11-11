"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";

export function QrCanvas({ value, label }: { value: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    QRCode.toCanvas(canvas, value, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#173a32", light: "#ffffff" },
    }).catch((error: unknown) => {
      console.error("Could not render the dynamic QR preview.", error);
    });
  }, [value]);

  return <canvas ref={canvasRef} aria-label={label} className="size-60 max-w-full" />;
}
