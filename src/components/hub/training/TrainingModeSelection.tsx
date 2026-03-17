// src/components/hub/training/TrainingModeSelection.tsx - Renderiza selección de modo Tutorial o Entrenamiento desde el nodo training.
import Link from "next/link";

interface ITrainingModeCard {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  toneClassName: string;
}

const TRAINING_MODE_CARDS: ITrainingModeCard[] = [
  {
    title: "Tutorial de Combate",
    description: "Repasa las reglas base del duelo, fases y acciones clave antes de farmear progreso.",
    href: "/hub/training/tutorial",
    actionLabel: "Empezar Tutorial",
    toneClassName: "border-cyan-400/40 bg-cyan-500/10",
  },
  {
    title: "Modo Entrenamiento",
    description: "Completa combates por tier para ganar Nexus, experiencia y desbloquear nuevas dificultades.",
    href: "/hub/training/arena",
    actionLabel: "Ir a Entrenamiento",
    toneClassName: "border-emerald-400/40 bg-emerald-500/10",
  },
];

export function TrainingModeSelection() {
  return (
    <section className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-800/90 bg-[#040b15]/90 p-6 shadow-[0_24px_46px_rgba(2,4,12,0.8)]">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/85">Entrenamiento</p>
      <h1 className="mt-2 text-4xl font-black uppercase tracking-wide text-cyan-200">Selecciona un modo</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-300">Elige entre tutorial guiado o combates progresivos. Puedes volver aquí cuando quieras.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {TRAINING_MODE_CARDS.map((modeCard) => (
          <article key={modeCard.href} className={`rounded-2xl border p-4 ${modeCard.toneClassName}`}>
            <h2 className="text-lg font-black uppercase tracking-wide text-slate-100">{modeCard.title}</h2>
            <p className="mt-2 text-sm text-slate-200">{modeCard.description}</p>
            <Link
              href={modeCard.href}
              aria-label={modeCard.actionLabel}
              className="mt-4 inline-block rounded-md border border-slate-100/25 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-100 transition hover:bg-slate-100/10"
            >
              {modeCard.actionLabel}
            </Link>
          </article>
        ))}
      </div>
      <Link
        href="/hub"
        aria-label="Volver a sala de control"
        className="mt-6 inline-block rounded-lg border border-cyan-300/35 px-4 py-2 text-sm font-bold uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-400/10"
      >
        Volver a Sala de Control
      </Link>
    </section>
  );
}
