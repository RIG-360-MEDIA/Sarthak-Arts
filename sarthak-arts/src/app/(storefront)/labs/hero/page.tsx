import { HeroWebGL } from "@/components/hero/HeroWebGL";

export const dynamic = "force-dynamic";

export default function HeroPreviewPage() {
  return (
    <div style={{ background: "#0A0416", minHeight: "200vh", color: "#F7ECD4", position: "relative" }}>
      {/* WebGL scene fills viewport, sits at z:0 */}
      <HeroWebGL />

      {/* HTML content overlay */}
      <main style={{ position: "relative", zIndex: 1, pointerEvents: "auto" }}>
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 40px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div
              style={{
                display: "inline-block",
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#FCD46F",
                fontWeight: 600,
                marginBottom: 26,
                padding: "6px 0",
                position: "relative",
              }}
            >
              Handcrafted for the eight directions
            </div>
            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontWeight: 400,
                fontSize: "clamp(48px, 8vw, 88px)",
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                margin: "0 0 24px",
                color: "#F7ECD4",
                textShadow: "0 4px 40px rgba(0,0,0,0.5)",
              }}
            >
              Made by hand.<br />
              <i style={{ color: "#FCD46F", textShadow: "0 0 60px rgba(252,212,111,0.5)" }}>
                Placed with intention.
              </i>
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "rgba(247,236,212,0.75)",
                lineHeight: 1.7,
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              Murtis and Vastu instruments in copper, brass and silver — each piece built for one
              direction, one purpose, one home.
            </p>
            <div
              style={{
                fontFamily: '"Sanskrit Text", "Noto Serif Devanagari", "Nirmala UI", Georgia, serif',
                fontSize: 22,
                color: "#E8B849",
                marginTop: 26,
                letterSpacing: "0.04em",
                opacity: 0.85,
                textShadow: "0 0 20px rgba(252,212,111,0.3)",
              }}
            >
              ॥ शुभं भवतु ॥
            </div>
            <div style={{ marginTop: 40, display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                style={{
                  padding: "15px 32px",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "#0A0416",
                  background:
                    "linear-gradient(90deg, #A67816 0%, #FCD46F 50%, #A67816 100%)",
                  borderRadius: 2,
                  textDecoration: "none",
                  boxShadow: "0 0 30px rgba(252,212,111,0.35)",
                  cursor: "pointer",
                }}
                href="#"
              >
                Enter the shrine
              </a>
              <a
                style={{
                  padding: "15px 32px",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "#FCD46F",
                  background: "rgba(11,6,25,0.5)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid #E8B849",
                  borderRadius: 2,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
                href="#"
              >
                Two-minute audit
              </a>
            </div>
            <div
              style={{
                marginTop: 100,
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(247,236,212,0.4)",
              }}
            >
              Scroll · move mouse
            </div>
          </div>
        </section>

        {/* Second section to give scroll room */}
        <section style={{ minHeight: "60vh", padding: "80px 40px", textAlign: "center" }}>
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              padding: "40px 32px",
              background: "rgba(11,6,25,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(232,184,73,0.24)",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                fontFamily: '"Sanskrit Text", "Noto Serif Devanagari", "Nirmala UI", Georgia, serif',
                fontSize: 44,
                color: "#FCD46F",
                textShadow: "0 0 30px rgba(252,212,111,0.5)",
                marginBottom: 20,
              }}
            >
              ॐ
            </div>
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontWeight: 400,
                fontSize: 30,
                color: "#F7ECD4",
                margin: "0 0 14px",
              }}
            >
              As you scroll, the camera flies through.
            </h2>
            <p style={{ color: "rgba(247,236,212,0.72)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              The yantra ahead moves in space. Particles react to your cursor gravity. Bloom
              post-processing makes the gold actually glow. Scroll more to see the camera dolly
              continue.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
