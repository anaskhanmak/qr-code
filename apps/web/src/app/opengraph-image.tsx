import { ImageResponse } from "next/og";

export const runtime = "edge";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #eff8ed 0%, #dfeee4 100%)",
          fontSize: 52,
          color: "#173a32",
          fontWeight: 700,
          letterSpacing: -2,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <div style={{ fontSize: 32, letterSpacing: 6, textTransform: "uppercase", color: "#5f7d68" }}>Loopmark</div>
          <div>QR codes that keep up</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
