import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Star of Lakṣmī medallion — two overlapping squares (eight directions), gold
 *  on a sacred ground. Built from shapes so it renders reliably (no font). */
export default function AppleIcon() {
  const square: React.CSSProperties = {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 14,
    background: "linear-gradient(135deg, #FCE7A0 0%, #F0B441 46%, #BE831A 100%)",
  };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderRadius: 40,
          background: "radial-gradient(120% 100% at 50% 30%, #3A2140 0%, #1A0E1E 58%, #0A0512 100%)",
        }}
      >
        <div style={{ position: "absolute", width: 154, height: 154, borderRadius: "50%", border: "2px solid rgba(232,184,73,0.32)" }} />
        <div style={square} />
        <div style={{ ...square, transform: "rotate(45deg)" }} />
        <div style={{ position: "absolute", width: 30, height: 30, borderRadius: "50%", background: "#2A1236", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FCE7A0" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
