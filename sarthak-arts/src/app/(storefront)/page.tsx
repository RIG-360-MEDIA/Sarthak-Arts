import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { Mandala } from "@/components/Mandala";

export default async function Home() {
  const directions = await prisma.direction.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } });
  const preview = directions.filter((d) => d.code !== "center").slice(0, 4);
  const eyebrow = "Dikchakra-mapped instruments";
  const values = [
    ["Handworked, not moulded", "Every kalash, yantra and panel is shaped by hand. No two pieces are identical."],
    ["Direction-correct by design", "Every product is built for one zone of the home and one purpose."],
    ["Full material transparency", "Every listing states the exact metal weight and gemstone — no vague language."],
    ["Guided placement", "Each order comes with a placement card for your specific piece."],
  ];
  await getSetting<string>("store_name", "Sarthak Arts");

  return (
    <div style={{ paddingTop: 12 }}>
      <section style={{ display: "flex", gap: 36, alignItems: "center", padding: "36px 0", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--brass)", fontWeight: 600 }}>{eyebrow}</div>
          <h1 style={{ fontSize: 34, lineHeight: 1.2, margin: "12px 0" }}>Metal and stone, placed the way your home was meant to hold them.</h1>
          <p style={{ fontSize: 15, color: "var(--ink-muted)", maxWidth: "46ch" }}>
            Each piece is cast in copper, brass or silver and set with a single gemstone, sized and positioned according to classical Vastu Shastra. Nothing here is decorative first.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <Link href="/collection"><button>View the collection</button></Link>
            <Link href="/direction"><button className="btn-ghost">Shop by direction</button></Link>
          </div>
        </div>
        <div style={{ width: 240, height: 240, background: "var(--focus-panel)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mandala size={190} directions={directions} litCode="northeast" dark />
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
        {values.map(([t, d]) => (
          <div key={t} style={{ background: "var(--ground)", padding: "20px 18px" }}>
            <div className="serif" style={{ fontSize: 15, marginBottom: 6 }}>{t}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>{d}</div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 20, marginBottom: 14 }}>Shop by direction</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {preview.map((d) => (
            <Link key={d.code} href={`/direction?zone=${d.code}`} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, textDecoration: "none", color: "inherit" }}>
              <div className="serif" style={{ fontSize: 15 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>{d.governs}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
