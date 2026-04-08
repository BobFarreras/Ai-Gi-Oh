// src/components/hub/academy/tutorial/TutorialMapSelection.tsx - Escena del mapa tutorial con layout fullscreen en desktop y scroll seguro en mobile.
import Image from "next/image";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { TutorialCircuitMap } from "@/components/hub/academy/tutorial/TutorialCircuitMap";
import { resolvePrepareDeckGuideVisibility } from "@/components/hub/academy/tutorial/internal/resolve-prepare-deck-guide-visibility";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";

interface ITutorialMapSelectionProps {
  nodes: ITutorialMapNodeRuntime[];
}

export function TutorialMapSelection({ nodes }: ITutorialMapSelectionProps) {
  const shouldGuidePrepareDeck = resolvePrepareDeckGuideVisibility(nodes);
  const guidedNodeId = shouldGuidePrepareDeck ? "tutorial-arsenal-basics" : null;

  return (
    <section className="relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 px-2 pb-2 text-cyan-100 sm:px-3 lg:gap-5 lg:overflow-hidden lg:px-4 lg:py-4">
      <header className="rounded-2xl border border-cyan-500/30 bg-[#041425]/78 px-3 py-3 backdrop-blur-sm sm:px-4 lg:px-6 lg:py-4">
        <div className="flex items-center justify-center gap-4 text-left">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-cyan-300/50 bg-slate-950 lg:h-20 lg:w-20">
            <Image src="/assets/story/opponents/opp-ch1-biglog/tutorial-BigLog.png" alt="BigLog Academy" fill className="object-contain object-top p-1" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black uppercase tracking-[0.06em] text-white sm:text-3xl lg:text-4xl">Ruta de Tutorial</h1>
            <p className="mt-1 text-base font-semibold text-slate-200 lg:text-lg">Completa los 4 nodos para desbloquear tu recompensa final.</p>
          </div>
        </div>
      </header>

      <div className="min-h-0 overflow-y-auto lg:overflow-visible lg:pt-2">
        <TutorialCircuitMap nodes={nodes} guidedNodeId={guidedNodeId} />
      </div>

      <footer className="pb-[max(0.4rem,env(safe-area-inset-bottom))] lg:pb-0">
        <div className="flex justify-center">
          <AcademyBackButton label="Volver a Academy" href={ACADEMY_HOME_ROUTE} className="w-full max-w-xs lg:w-auto" />
        </div>
      </footer>
    </section>
  );
}
