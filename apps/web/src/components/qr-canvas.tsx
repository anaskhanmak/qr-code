"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";

export function QrCanvas({
  value,
  label,
  foregroundColor = "#173a32",
  backgroundColor = "#ffffff",
  margin = 2,
  size = 240,
  className = "size-60 max-w-full rounded-xl",
}: {
  value: string;
  label: string;
  foregroundColor?: string;
  backgroundColor?: string;
  margin?: number;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin,
      errorCorrectionLevel: "M",
      color: { dark: foregroundColor, light: backgroundColor },
    }).catch((error: unknown) => {
      console.error("Could not render the dynamic QR preview.", error);
    });
  }, [backgroundColor, foregroundColor, margin, size, value]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={label}
      width={size}
      height={size}
      className={className}
      style={{ backgroundColor }}
    />
  );
}
