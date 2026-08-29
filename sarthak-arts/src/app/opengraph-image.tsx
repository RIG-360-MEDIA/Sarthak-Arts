import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sarthak Arts — Handcrafted Vastu pieces in copper, brass and silver";

/** The social link-preview card (WhatsApp, Facebook, LinkedIn, X). Star of
 *  Lakṣmī mark + wordmark + tagline on the sacred ground. Shapes + ASCII only,
 *  so it renders reliably with the image generator's default font. */
export default function OpengraphImage() {
  const square: React.CSSProperties = {
    position: "absolute", width: 118, height: 118, borderRadius: 18,
    background: "linear-gradient(135deg, #FCE7A0 0%, #F0B441 46%, #BE831A 100%)",
  };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", position: "relative",
          background: "radial-gradient(130% 100% at 50% 8%, #3A2140 0%, #1A0E1E 55%, #0A0512 100%)",
          fontFamily: "sans-serif", color: "#F7ECD4",
        }}
      >
        {/* Star of Lakṣmī */}
        <div style={{ position: "relative", width: 210, height: 210, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 34 }}>
          <div style={{ position: "absolute", width: 210, height: 210, borderRadius: "50%", border: "2px solid rgba(232,184,73,0.3)", display: "flex" }} />
          <div style={square} />
          <div style={{ ...square, transform: "rotate(45deg)" }} />
          <div style={{ position: "absolute", width: 40, height: 40, borderRadius: "50%", background: "#2A1236", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#FCE7A0" }} />
          </div>
        </div>

        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -1, color: "#FBEFD6" }}>Sarthak Arts</div>
        <div style={{ fontSize: 33, color: "rgba(247,236,212,0.74)", marginTop: 12, maxWidth: 860, textAlign: "center", lineHeight: 1.35 }}>
          Handcrafted Vastu pieces, each made for one direction of the home
        </div>
        <div style={{ fontSize: 21, letterSpacing: 5, color: "#E8B849", marginTop: 26 }}>COPPER · BRASS · SILVER</div>
      </div>
    ),
    { ...size },
  );
}
