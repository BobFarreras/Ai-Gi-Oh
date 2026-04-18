// src/components/tfm/internal/TFMOriginJourney.tsx - Relato personal y decisión del proyecto en formato visual de defensa.
import {
  TFM_PERSONAL_NARRATIVE,
  TFM_PROJECT_DECISION_MILESTONES,
} from "@/components/tfm/internal/tfm-phase-two-content";

/**
 * Resume contexto personal y decisión de construir AI-GI-OH.
 */
export function TFMOriginJourney() {
  return (
    <section aria-label="Origen del proyecto" className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <article className="rounded-2xl border border-cyan-500/40 bg-black/65 p-6 sm:p-8">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-cyan-300">Mi Punto de Partida</p>
        <h2 className="mt-2 text-3xl font-black text-cyan-50 sm:text-4xl">{TFM_PERSONAL_NARRATIVE.title}</h2>
        <p className="mt-3 text-lg leading-relaxed text-cyan-100/90">{TFM_PERSONAL_NARRATIVE.summary}</p>
        <ul className="mt-4 space-y-2 text-base text-cyan-50/95">
          {TFM_PERSONAL_NARRATIVE.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2">
              <span aria-hidden className="mt-[9px] h-2 w-2 rounded-full bg-cyan-400" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#071321] to-black p-6 sm:p-8">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-cyan-300">Decisión del TFM</p>
        <h2 className="mt-2 text-3xl font-black text-cyan-50 sm:text-4xl">Por qué un juego web</h2>
        <ol className="mt-5 space-y-3">
          {TFM_PROJECT_DECISION_MILESTONES.map((milestone, index) => (
            <li key={milestone.id} className="relative rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 pl-12">
              <span className="absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/20 text-sm font-black text-cyan-100">
                {index + 1}
              </span>
              <p className="text-lg font-bold text-cyan-50">{milestone.title}</p>
              <p className="mt-1 text-base text-cyan-100/85">{milestone.detail}</p>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
