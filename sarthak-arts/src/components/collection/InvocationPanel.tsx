"use client";

/**
 * InvocationPanel — the DOM half of a direction invocation. Sits below the
 * hero title when a direction is active, holding the material's purpose,
 * the placement schematic, and the sensory nyāsa line. Replaces the older
 * `.direction-meaning` inline panel.
 *
 * Empty invocations (`filled: false`) fall back to a minimal panel so the
 * unfinished directions still show basic Sanskrit info while their full
 * invocations are being authored.
 */

import type { DirectionInvocation, PlacementCell } from "./invocations";

interface PlacementSchematicProps {
  cell: PlacementCell;
  zone: string;
}

/** A 3×3 Vāstu-mandala schematic drawn as SVG, with the target cell lit.
 *  The 3×3 grid is the traditional Prakīrṇa Vāstu grid layout — nine equal
 *  cells, the guardian direction indicated. */
function PlacementSchematic({ cell, zone }: PlacementSchematicProps) {
  const size = 84;
  const step = size / 3;
  return (
    <svg
      className="invocation-placement__grid"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Placement for ${zone} on the Vāstu-mandala`}
    >
      {/* Outer frame */}
      <rect x="0.5" y="0.5" width={size - 1} height={size - 1} rx="4" ry="4" />
      {/* Grid lines */}
      <line x1={step} y1="4" x2={step} y2={size - 4} />
      <line x1={step * 2} y1="4" x2={step * 2} y2={size - 4} />
      <line x1="4" y1={step} x2={size - 4} y2={step} />
      <line x1="4" y1={step * 2} x2={size - 4} y2={step * 2} />
      {/* Lit cell */}
      <rect
        className="invocation-placement__cell"
        x={cell.col * step + 3}
        y={cell.row * step + 3}
        width={step - 6}
        height={step - 6}
        rx="2"
        ry="2"
      />
      {/* Small dot at the placement */}
      <circle
        className="invocation-placement__dot"
        cx={cell.col * step + step / 2}
        cy={cell.row * step + step / 2}
        r="3"
      />
    </svg>
  );
}

export function InvocationPanel({ invocation }: { invocation: DirectionInvocation }) {
  if (!invocation.filled) {
    // Unauthored direction — show only the zone label so we don't invent
    // devotional data (memory rule: wrong is worse than absent).
    return (
      <div className="invocation-panel invocation-panel--placeholder" data-zone={invocation.zone}>
        <div className="invocation-panel__eyebrow">
          {invocation.zone} · invocation in preparation
        </div>
        <p className="invocation-panel__placeholder-note">
          This direction&apos;s full invocation is being authored — verified
          against tradition before it appears.
        </p>
      </div>
    );
  }

  const sensoryLine =
    `${invocation.sanskritName} — ${invocation.sensory.scent}, ${invocation.sensory.sound}, ${invocation.sensory.touch}.`;

  return (
    <div className="invocation-panel" data-zone={invocation.zone} key={invocation.zone}>
      {/* Header — Sanskrit name and deity */}
      <div className="invocation-panel__head">
        <div className="invocation-panel__deity">
          <span className="invocation-panel__deity-devanagari">{invocation.deityDevanagari}</span>
          <span className="invocation-panel__deity-roman">
            {invocation.sanskritName} · {invocation.deityName}
          </span>
        </div>
        <div className="invocation-panel__mantra" aria-label={`Full mantra: ${invocation.fullMantra}`}>
          {invocation.fullMantra}
        </div>
      </div>

      {/* Governs + element */}
      <div className="invocation-panel__governs">
        {invocation.governs} · <span className="invocation-panel__element">{invocation.elementLabel}</span>
      </div>

      {/* Poetic one-liner */}
      <p className="invocation-panel__oneline">&ldquo;{invocation.oneLine}&rdquo;</p>

      {/* Material — why THIS metal for THIS direction */}
      <div className="invocation-panel__material">
        <div className="invocation-panel__label">The material</div>
        <p className="invocation-panel__material-line">{invocation.materialPurpose}</p>
      </div>

      {/* Placement — schematic + line */}
      <div className="invocation-panel__placement">
        <div className="invocation-panel__label">Where in your home</div>
        <div className="invocation-placement">
          <PlacementSchematic cell={invocation.placement} zone={invocation.zone} />
          <p className="invocation-placement__line">{invocation.placementLine}</p>
        </div>
      </div>

      {/* Sensory nyāsa — one line naming scent, sound, touch */}
      <p className="invocation-panel__sensory">{sensoryLine}</p>
    </div>
  );
}
