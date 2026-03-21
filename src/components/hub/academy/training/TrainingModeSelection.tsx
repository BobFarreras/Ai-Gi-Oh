// src/components/hub/academy/training/TrainingModeSelection.tsx
import { ACADEMY_TRAINING_ARENA_ROUTE, ACADEMY_TUTORIAL_MAP_ROUTE } from "@/core/constants/routes/academy-routes";
import { TrainingMode3DPanel, ITrainingMode3DPanelProps } from "./TrainingMode3DPanel";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";

// Simulamos los iconos gigantes que harán de render 3D central
const RenderTutorial = () => (
  <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
);

const RenderArena = () => (
  <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
);

const TRAINING_MODULES: ITrainingMode3DPanelProps[] = [
  {
    title: "Módulo Tutorial",
    subtitle: "Onboarding Guiado",
    description: "Sigue el protocolo de BigLog. Asimila las mecánicas de Arsenal, Fusión y Combate Táctico.",
    href: ACADEMY_TUTORIAL_MAP_ROUTE,
    actionLabel: "Ejecutar Simulación",
    theme: "tutorial",
    icon: <RenderTutorial />,
  },
  {
    title: "Arena de Práctica",
    subtitle: "Combate Táctico",
    description: "Enfrentamientos asilados por Tiers. Vence a IAs de combate para farmear experiencia y testear mazos.",
    href: ACADEMY_TRAINING_ARENA_ROUTE,
    actionLabel: "Entrar a la Arena",
    theme: "arena",
    icon: <RenderArena />,
  },
];

export function TrainingModeSelection() {
  return (
    <section className="relative mx-auto w-full max-w-6xl p-4">
      {/* Header Estilo HUD de Combate */}
      <header className="mb-12 flex flex-col items-center justify-center text-center">
        <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-slate-700/60 bg-[#040b15]/80 px-4 py-1.5 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">
            SYS.ACADEMY // EN LÍNEA
          </span>
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tight text-white drop-shadow-lg">
          Centro de <span className="text-cyan-400">Entrenamiento</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm font-medium text-slate-400">
          Selecciona tu entorno de pruebas. Completa el tutorial para entender los sistemas base o salta a la arena para perfeccionar tu estrategia bélica.
        </p>
      </header>

      {/* Grid de Paneles 3D */}
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        {TRAINING_MODULES.map((module) => (
          <TrainingMode3DPanel key={module.href} {...module} />
        ))}
      </div>

      {/* Botón de Retorno (Estilo Terminal HUD) */}
      <div className="mt-16 flex justify-center">
        <AcademyBackButton label="Volver al Menú" href="/hub" />
      </div>
    </section>
  );
}
