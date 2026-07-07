import { getBlock } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function Privacy() {
  const b = await getBlock("legal.privacy", "Privacy Policy coming soon.");
  return (
    <div style={{ paddingTop: 24, maxWidth: 680 }}>
      <h1>{b.title ?? "Privacy Policy"}</h1>
      <div style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{b.body}</div>
    </div>
  );
}
