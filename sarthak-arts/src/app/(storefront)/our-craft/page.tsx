import { getBlock } from "@/lib/content";

export const dynamic = "force-dynamic";

const STEPS: [string, string][] = [["design", "◐"], ["shape", "◇"], ["set", "●"], ["certify", "✓"]];

export default async function OurCraft() {
  const [intro, materials, stones] = await Promise.all([
    getBlock("our-craft.intro"),
    getBlock("our-craft.materials"),
    getBlock("our-craft.stones"),
  ]);
  return (
    <div style={{ paddingTop: 24, maxWidth: 720 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--brass)", fontWeight: 600 }}>Our craft</div>
      <h1>{intro.title}</h1>
      <p style={{ fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.8 }}>{intro.body}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 0, maxWidth: 560, margin: "24px 0" }}>
        {STEPS.map(([name, icon], i) => (
          <div key={name} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 44, height: 44, border: "1px solid var(--brass)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--brass)", margin: "0 auto" }}>{icon}</div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 6, textTransform: "capitalize" }}>{name}</div>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "var(--line)", margin: "0 8px 22px" }} />}
          </div>
        ))}
      </div>

      <h3>{materials.title}</h3>
      <p style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.8 }}>{materials.body}</p>
      <h3>{stones.title}</h3>
      <p style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.8 }}>{stones.body}</p>
    </div>
  );
}
