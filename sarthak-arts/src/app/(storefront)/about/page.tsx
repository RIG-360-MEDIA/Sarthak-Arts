import { getBlock } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function About() {
  const b = await getBlock("about.body", "Our story is coming soon.");
  return (
    <div style={{ paddingTop: 24, maxWidth: 640 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--brass)", fontWeight: 600 }}>About</div>
      <h1>{b.title}</h1>
      <p style={{ fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.8 }}>{b.body}</p>
    </div>
  );
}
