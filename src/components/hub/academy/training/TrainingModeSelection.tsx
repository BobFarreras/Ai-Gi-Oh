// src/components/hub/academy/training/TrainingModeSelection.tsx - Selector Academy con layout fullscreen en desktop y stack scrolleable en mobile.
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { ACADEMY_TRAINING_ARENA_ROUTE, ACADEMY_TUTORIAL_MAP_ROUTE } from "@/core/constants/routes/academy-routes";
import { ITrainingMode3DPanelProps, TrainingMode3DPanel } from "./TrainingMode3DPanel";

const TRAINING_MODULES: ITrainingMode3DPanelProps[] = [
  {
    title: "Módulo Tutorial",
    subtitle: "Onboarding Guiado",
    description: "Aprende Arsenal, Fusión y Combate con BigLog.",
    href: ACADEMY_TUTORIAL_MAP_ROUTE,
    actionLabel: "Ejecutar Simulación",
    theme: "tutorial",
    coverImages: ["/assets/story/opponents/opp-ch1-biglog/tutorial-BigLog.png"],
    coverAlt: "BigLog en modo tutorial",
  },
  {
    title: "Arena de Práctica",
    subtitle: "Combate Táctico",
    description: "Enfrentamientos por tiers contra IAs.",
    href: ACADEMY_TRAINING_ARENA_ROUTE,
    actionLabel: "Entrar a la Arena",
    theme: "arena",
    coverImages: [
      "/assets/story/opponents/opp-ch1-soldier-act01/intro-Soldado-act01.png",
      "/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.png",
      "/assets/story/opponents/opp-ch1-jaku/intro-Jaku.png",
      "/assets/story/opponents/opp-ch1-helena/intro-Helena.png",
    ],
    coverAlt: "Rivales de arena en modo entrenamiento",
  },
];

export function TrainingModeSelection() {
  return (
    <section className="relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 text-cyan-100 lg:gap-5 lg:overflow-hidden">
      <header className="px-2 pt-1 text-center sm:px-3 lg:px-8 lg:pt-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-3 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.85)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">SYS ACADEMY EN LÍNEA</span>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-[0.07em] text-white sm:text-4xl lg:text-5xl">Centro de Entrenamiento</h1>
      </header>

      <div className="min-h-0 overflow-y-auto px-2 sm:px-3 lg:overflow-visible lg:px-3 lg:pt-2">
        <div className="grid min-h-full grid-cols-1 gap-3 pb-1 lg:h-full lg:grid-cols-2 lg:gap-5 lg:pb-0">
          {TRAINING_MODULES.map((module) => (
            <TrainingMode3DPanel key={module.href} {...module} />
          ))}
        </div>
      </div>

      <footer className="px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] sm:px-3 lg:px-0 lg:pb-4">
        <div className="flex justify-center">
          <AcademyBackButton label="Volver al Menú" href="/hub" className="w-full max-w-xs lg:w-auto" />
        </div>
      </footer>
    </section>
  );
}
