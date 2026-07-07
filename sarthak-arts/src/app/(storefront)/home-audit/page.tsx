import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomeAudit() {
  const questions = await prisma.auditQuestion.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
    include: { answers: { orderBy: { displayOrder: "asc" } } },
  });
  return (
    <div style={{ paddingTop: 24, maxWidth: 560 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--brass)", fontWeight: 600 }}>2-minute home audit</div>
      <h1>A few questions about your home</h1>
      <form action="/home-audit/result">
        {questions.map((q) => (
          <div key={q.id} style={{ marginTop: 18 }}>
            <label style={{ fontSize: 15, color: "var(--ink)" }}>{q.prompt}</label>
            <select name="a" defaultValue="">
              <option value="" disabled>Choose one…</option>
              {q.answers.map((a) => <option key={a.id} value={a.id}>{a.answerText}</option>)}
            </select>
          </div>
        ))}
        <button style={{ marginTop: 22 }}>See my recommendations</button>
      </form>
    </div>
  );
}
