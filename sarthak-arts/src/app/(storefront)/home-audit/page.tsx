import type { Metadata } from "next";
import "../content-pages.css";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "The two-minute home audit — Sarthak Arts" };

export default async function HomeAudit() {
  const questions = await prisma.auditQuestion.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
    include: { answers: { orderBy: { displayOrder: "asc" } } },
  });

  return (
    <div className="pg-root">
      <div className="pg-wrap narrow">
        <div className="pg-hero center">
          <div className="pg-eyebrow">The two-minute home audit</div>
          <h1 className="serif">A few questions about your <em>home</em></h1>
          <p className="pg-lead">Answer honestly, and we&apos;ll point you to the directions and pieces that matter most for your space.</p>
        </div>

        <form action="/home-audit/result" method="get">
          <div className="audit-card">
            {questions.map((q, i) => (
              <div key={q.id} className="audit-q">
                <div className="audit-q-head">
                  <span className="audit-q-num">{i + 1}</span>
                  <span className="audit-q-prompt serif">{q.prompt}</span>
                </div>
                <div className="audit-opts">
                  {q.answers.map((a) => (
                    <label key={a.id} className="audit-opt">
                      <input type="radio" name={`q_${i}`} value={a.id} />
                      <span className="box" aria-hidden="true" />
                      {a.answerText}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="audit-submit">
            <button type="submit" className="pg-btn primary">
              See my recommendations
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
