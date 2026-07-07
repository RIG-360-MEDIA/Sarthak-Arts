import { getBlock, getBlocksByPrefix } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function VastuShastra() {
  const intro = await getBlock("vastu.intro");
  const faqs = await getBlocksByPrefix("faq.");
  return (
    <div style={{ paddingTop: 24, maxWidth: 640 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--brass)", fontWeight: 600 }}>Vastu Shastra, briefly</div>
      <h1>{intro.title}</h1>
      <p style={{ fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.8 }}>{intro.body}</p>

      <h2 style={{ fontSize: 20, marginTop: 28 }}>Common questions</h2>
      {faqs.map((f) => (
        <div key={f.key} style={{ borderBottom: "1px solid var(--line)", padding: "14px 0" }}>
          <div className="serif" style={{ fontSize: 15 }}>{f.title}</div>
          <p style={{ fontSize: 14, color: "var(--ink-muted)", marginTop: 6 }}>{f.body}</p>
        </div>
      ))}
    </div>
  );
}
