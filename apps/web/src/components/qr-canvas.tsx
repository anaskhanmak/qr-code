"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";

export function QrCanvas({
  value,
  label,
  foregroundColor = "#173a32",
  backgroundColor = "#ffffff",
  margin = 2,
}: {
  value: string;
  label: string;
  foregroundColor?: string;
  backgroundColor?: string;
  margin?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    QRCode.toCanvas(canvas, value, {
      width: 240,
      margin,
      errorCorrectionLevel: "M",
      color: { dark: foregroundColor, light: backgroundColor },
    }).catch((error: unknown) => {
      console.error("Could not render the dynamic QR preview.", error);
    });
  }, [backgroundColor, foregroundColor, margin, value]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={label}
      className="size-60 max-w-full rounded-xl"
      style={{ backgroundColor }}
    />
  );
}
