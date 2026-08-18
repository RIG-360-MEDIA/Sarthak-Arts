"use client";
import { useState } from "react";
import Link from "next/link";

/**
 * AuditPreview — the interactive 4-question quiz card that lives on the
 * homepage. Deliberately a taste of the full audit, not the full audit.
 * The full adaptive `/home-audit` page is its own build.
 *
 * Design:
 *  - Q1..Q4 walk in order; each answer highlights + advances to the next
 *  - Q4's selection produces a small "suggested direction" strip linking
 *    to that /labs/direction/[code] page
 *  - "Restart" resets to Q1
 *  - Back arrow lets the visitor step back if they mis-tapped
 *
 * Recommendation logic (v1 taste):
 *  - Entrance direction (Q1) contributes 2 points to that direction
 *  - "Off zone" (Q2) contributes 2 points to that direction
 *  - Intent (Q3) maps to a direction and contributes 1 point
 *  - Home/office (Q4) doesn't affect the direction — it just contextualizes
 *  - Highest-scoring direction wins; ties break to Q1 (entrance)
 */

type Ans = { label: string; value: string };
type Q = { id: string; question: string; options: Ans[]; kind: "direction" | "intent" | "context" };

const Q1: Q = {
  id: "entrance",
  question: "Which direction does your home's main entrance face?",
  kind: "direction",
  options: [
    { label: "North", value: "north" },
    { label: "Northeast", value: "northeast" },
    { label: "East", value: "east" },
    { label: "Southeast", value: "southeast" },
    { label: "South", value: "south" },
    { label: "Southwest", value: "southwest" },
    { label: "West", value: "west" },
    { label: "Northwest", value: "northwest" },
  ],
};
const Q2: Q = {
  id: "offzone",
  question: "Which zone in your home feels heavy or unsettled?",
  kind: "direction",
  options: [
    { label: "Northeast", value: "northeast" },
    { label: "Northwest", value: "northwest" },
    { label: "Southeast", value: "southeast" },
    { label: "Southwest", value: "southwest" },
    { label: "The whole home", value: "center" },
    { label: "Nothing feels off", value: "" },
  ],
};
const Q3: Q = {
  id: "intent",
  question: "What are you most trying to bring in?",
  kind: "intent",
  options: [
    { label: "Wealth", value: "north" },
    { label: "Peace", value: "northeast" },
    { label: "Health", value: "east" },
    { label: "Recognition", value: "south" },
    { label: "Stability", value: "southwest" },
    { label: "Relationships", value: "west" },
  ],
};
const Q4: Q = {
  id: "context",
  question: "Is this for your home, workplace, or a gift?",
  kind: "context",
  options: [
    { label: "Home", value: "home" },
    { label: "Workplace", value: "office" },
    { label: "A gift", value: "gift" },
  ],
};
const QUESTIONS: Q[] = [Q1, Q2, Q3, Q4];

const DIR_LABELS: Record<string, string> = {
  north: "Northeast", northeast: "Northeast", east: "East", southeast: "Southeast",
  south: "South", southwest: "Southwest", west: "West", northwest: "Northwest",
  center: "Brahmasthan (center)",
};

function recommend(answers: Record<string, string>) {
  const score: Record<string, number> = {};
  const add = (dir: string, n: number) => {
    if (!dir) return;
    score[dir] = (score[dir] ?? 0) + n;
  };
  add(answers.entrance, 2);
  add(answers.offzone, 2);
  add(answers.intent, 1);
  const winner = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0] ?? answers.entrance ?? "northeast";
  return {
    winner,
    winnerName: DIR_LABELS[winner] ?? winner,
    context: answers.context,
  };
}

export function AuditPreview() {
  const [step, setStep] = useState(0); // 0..3 = questions, 4 = result
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const q = QUESTIONS[step];
  const isResult = step >= QUESTIONS.length;

  const choose = (value: string) => {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    setStep((s) => s + 1);
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (isResult) {
    const rec = recommend(answers);
    const contextLine =
      rec.context === "office"
        ? "for your workspace"
        : rec.context === "gift"
        ? "as a considered gift"
        : "for your home";
    return (
      <div className="sa-quiz sa-quiz-result">
        <div className="sa-quiz-lbl">Your reading — a beginning</div>
        <div className="sa-quiz-q sa-quiz-result-heading">
          Start with the <em>{rec.winnerName}</em>.
        </div>
        <p className="sa-quiz-result-sub">
          Based on your answers, the pieces built for the {rec.winnerName} zone are the natural first step {contextLine}. A full twelve-minute reading on the dedicated audit page will go deeper — for now, take a look at what's built for this zone.
        </p>
        <div className="sa-quiz-result-actions">
          <Link className="sa-btn sa-btn-primary" href={`/direction/${rec.winner === "center" ? "center" : rec.winner}`}>
            See the {rec.winnerName} pieces →
          </Link>
          <button type="button" className="sa-btn sa-btn-ghost" onClick={restart}>Start over</button>
        </div>
        <div className="sa-quiz-step">A full reading is being built at /home-audit — coming shortly</div>
      </div>
    );
  }

  return (
    <div className="sa-quiz sa-quiz-live">
      <div className="sa-quiz-lbl">
        Question {step + 1} of {QUESTIONS.length}
        {step > 0 && (
          <button type="button" className="sa-quiz-back" onClick={back} aria-label="Previous question">
            ← back
          </button>
        )}
      </div>
      <div className="sa-quiz-q">{q.question}</div>
      <div className="sa-quiz-opts" role="radiogroup" aria-label={q.question}>
        {q.options.map((opt) => {
          const selected = answers[q.id] === opt.value;
          return (
            <button
              key={opt.value || opt.label}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`sa-quiz-opt${selected ? " active" : ""}`}
              onClick={() => choose(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="sa-quiz-step">Step {step + 1} of {QUESTIONS.length}</div>
    </div>
  );
}
